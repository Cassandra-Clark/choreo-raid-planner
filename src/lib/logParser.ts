import type { ParsedFight, ReplayData, ReplayUnit, PositionSample } from '../types';

// WoW combat log date: "4/4/2026 20:20:48.030-4  EVENT,..."
// Source GUID prefixes: Player-, Pet-, Creature-, Vehicle-

const NPC_GUID_RE = /^(Creature|Vehicle|GameObject)-/;
const DATE_RE = /^\d+\/\d+\/\d{4} \d+:\d+:\d+\.\d+[+-]\d+\s{2}/;

function parseTimestamp(raw: string): number {
  // "4/4/2026 20:20:48.030-4"
  // Strip timezone offset, parse as local
  const clean = raw.replace(/[+-]\d+$/, '');
  return new Date(clean).getTime();
}

// Heuristic: boss abilities are cast by NPC sources on SPELL_CAST_START.
// We also capture ENCOUNTER_START/END for phase markers.
// Smoothing: deduplicate same spellId within 2s window; drop abilities
// that cast more than once per 20s on average (spammy trash abilities).

interface RawAbility { time: number; spellId: number; spellName: string; }

export function parseLog(text: string): ParsedFight[] {
  const lines = text.split('\n');
  const fights: ParsedFight[] = [];

  let inFight = false;
  let bossName = '';
  let encounterId = 0;
  let startMs = 0;
  let rawAbilities: RawAbility[] = [];

  for (const line of lines) {
    if (!DATE_RE.test(line)) continue;
    const twoSpaceIdx = line.indexOf('  ');
    if (twoSpaceIdx === -1) continue;

    const tsRaw = line.substring(0, twoSpaceIdx);
    const rest = line.substring(twoSpaceIdx + 2).trim();

    // Parse CSV respecting quoted strings
    const fields = parseCSV(rest);
    if (fields.length < 1) continue;
    const event = fields[0];

    if (event === 'ENCOUNTER_START') {
      // ENCOUNTER_START,encounterID,"Name",difficulty,groupSize,instanceID
      encounterId = parseInt(fields[1]) || 0;
      bossName = fields[2]?.replace(/^"|"$/g, '') ?? 'Unknown Boss';
      startMs = parseTimestamp(tsRaw);
      inFight = true;
      rawAbilities = [];
    } else if (event === 'ENCOUNTER_END' && inFight) {
      const endMs = parseTimestamp(tsRaw);
      const duration = Math.max(1, Math.round((endMs - startMs) / 1000));
      fights.push({
        bossName,
        encounterId,
        duration,
        abilities: smoothAbilities(rawAbilities),
      });
      inFight = false;
    } else if (inFight && event === 'SPELL_CAST_START') {
      // fields: EVENT,srcGUID,srcName,srcFlags,srcRaidFlags,dstGUID,dstName,dstFlags,dstRaidFlags,spellId,spellName,school
      const srcGuid = fields[1] ?? '';
      if (!NPC_GUID_RE.test(srcGuid)) continue;
      const srcFlags = parseInt(fields[3] ?? '0', 16);
      // COMBATLOG_OBJECT_REACTION_HOSTILE = 0x0040
      // Only keep hostile sources — excludes players, player pets, friendly guardians, summoned NPCs
      if (!(srcFlags & 0x0040)) continue;
      const spellId = parseInt(fields[9]) || 0;
      const spellName = fields[10]?.replace(/^"|"$/g, '') ?? '';
      if (!spellId || !spellName) continue;
      const timeMs = parseTimestamp(tsRaw);
      rawAbilities.push({ time: Math.round((timeMs - startMs) / 1000), spellId, spellName });
    }
  }

  return fights;
}

function smoothAbilities(raw: RawAbility[]): ParsedFight['abilities'] {
  if (raw.length === 0) return [];

  // Deduplicate same spellId within 2s
  const deduped: RawAbility[] = [];
  for (const ab of raw) {
    const last = deduped.findLast(d => d.spellId === ab.spellId);
    if (last && ab.time - last.time < 2) continue;
    deduped.push(ab);
  }

  // Count casts per spell to detect spam (> 1 cast per 15s average = likely spammy)
  const fightDuration = deduped.length > 0 ? Math.max(...deduped.map(a => a.time)) || 1 : 1;
  const castCounts = new Map<number, number>();
  for (const ab of deduped) castCounts.set(ab.spellId, (castCounts.get(ab.spellId) ?? 0) + 1);

  const filtered = deduped.filter(ab => {
    const count = castCounts.get(ab.spellId) ?? 0;
    const avgInterval = fightDuration / count;
    return avgInterval >= 8; // at least 8s between casts on average
  });

  return filtered.map(ab => ({ time: ab.time, spellId: ab.spellId, spellName: ab.spellName }));
}

// Advanced logging: SPELL_CAST_START / SPELL_CAST_SUCCESS have 12 base fields,
// then an advanced params block that always ends with: coordX, coordY, uiMapID, facing, level.
// Minimum total with 1 resource group = 29 fields; use "last 5" regardless of resource count.
const POSITION_EVENTS = new Set(['SPELL_CAST_START', 'SPELL_CAST_SUCCESS']);
const ADV_MIN_FIELDS = 29;

export function parseReplayData(text: string, fightIdx: number): ReplayData | null {
  const lines = text.split('\n');

  let fightCount = -1;
  let inFight = false;
  let startMs = 0;
  let duration = 0;

  // COMBATLOG_OBJECT_TYPE flags (correct values from WoW Lua API)
  const FLAG_PLAYER    = 0x0400; // COMBATLOG_OBJECT_TYPE_PLAYER
  const FLAG_PET       = 0x1000; // COMBATLOG_OBJECT_TYPE_PET
  const FLAG_GUARDIAN  = 0x2000; // COMBATLOG_OBJECT_TYPE_GUARDIAN
  const FLAG_HOSTILE   = 0x0040; // COMBATLOG_OBJECT_REACTION_HOSTILE

  interface RawPos { t: number; guid: string; name: string; flags: number; x: number; y: number; facing: number; }
  const rawPositions: RawPos[] = [];
  const deathTimes = new Map<string, number[]>();
  // COMBATANT_INFO: playerGUID → specId (field index 24)
  const combatantSpecs = new Map<string, number>();

  for (const line of lines) {
    if (!DATE_RE.test(line)) continue;
    const sep = line.indexOf('  ');
    if (sep === -1) continue;
    const tsRaw = line.substring(0, sep);
    const fields = parseCSV(line.substring(sep + 2).trim());
    if (fields.length < 1) continue;
    const event = fields[0];

    if (event === 'ENCOUNTER_START') {
      fightCount++;
      if (fightCount === fightIdx) {
        startMs = parseTimestamp(tsRaw);
        inFight = true;
        rawPositions.length = 0;
        deathTimes.clear();
        combatantSpecs.clear();
      }
    } else if (event === 'ENCOUNTER_END' && inFight && fightCount === fightIdx) {
      duration = Math.max(1, Math.round((parseTimestamp(tsRaw) - startMs) / 1000));
      inFight = false;
      break;
    } else if (inFight && fightCount === fightIdx) {
      if (event === 'COMBATANT_INFO') {
        // COMBATANT_INFO,playerGUID,faction,str,agi,sta,int,dodge,parry,block,
        //   critMelee,critRanged,critSpell,speed,lifesteal,hasteMelee,hasteRanged,
        //   hasteSpell,avoidance,mastery,versDD,versHD,versDT,armor,currentSpecID,...
        const guid = fields[1] ?? '';
        const specId = parseInt(fields[24] ?? '0') || 0;
        if (guid && specId) combatantSpecs.set(guid, specId);
      } else if (POSITION_EVENTS.has(event) && fields.length >= ADV_MIN_FIELDS) {
        const guid = fields[1] ?? '';
        if (!guid) continue;
        // Filter: skip Pet- GUIDs, and units that are pets/guardians by flag
        if (guid.startsWith('Pet-')) continue;
        const flags = parseInt(fields[3] ?? '0', 16);
        if (flags & FLAG_PET) continue;
        if (flags & FLAG_GUARDIAN) continue;
        // Only include players and hostile NPCs (boss/adds) — skip friendly summons
        const isPlayer = !!(flags & FLAG_PLAYER);
        const isHostileNPC = !isPlayer && !!(flags & FLAG_HOSTILE);
        if (!isPlayer && !isHostileNPC) continue;

        const rawName = (fields[2] ?? '').replace(/^"|"$/g, '');
        // Strip realm name: "Playername-Realm" → "Playername"
        const name = isPlayer ? (rawName.split('-')[0] || rawName) : rawName;

        const x = parseFloat(fields[fields.length - 5]);
        const y = parseFloat(fields[fields.length - 4]);
        const facing = parseFloat(fields[fields.length - 2]);
        if (!isNaN(x) && !isNaN(y)) {
          rawPositions.push({ t: (parseTimestamp(tsRaw) - startMs) / 1000, guid, name, flags, x, y, facing });
        }
      } else if (event === 'UNIT_DIED') {
        const dstGuid = fields[5] ?? '';
        if (dstGuid) {
          const t = (parseTimestamp(tsRaw) - startMs) / 1000;
          const arr = deathTimes.get(dstGuid) ?? [];
          arr.push(t);
          deathTimes.set(dstGuid, arr);
        }
      }
    }
  }

  if (rawPositions.length === 0) return null;

  // Group by GUID, downsample to ≥0.5s intervals
  const byGuid = new Map<string, { name: string; flags: number; samples: PositionSample[] }>();
  for (const p of rawPositions) {
    if (!byGuid.has(p.guid)) byGuid.set(p.guid, { name: p.name, flags: p.flags, samples: [] });
    const entry = byGuid.get(p.guid)!;
    const last = entry.samples[entry.samples.length - 1];
    if (!last || p.t - last.t >= 0.5) {
      entry.samples.push({ t: p.t, x: p.x, y: p.y, facing: p.facing });
    }
  }

  const units: ReplayUnit[] = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (const [guid, data] of byGuid) {
    if (data.samples.length < 2) continue;
    const isPlayer = !!(data.flags & FLAG_PLAYER);
    const specId = combatantSpecs.get(guid);
    units.push({
      guid, name: data.name, isPlayer,
      specId,
      positions: data.samples,
      deathTimes: deathTimes.get(guid) ?? [],
    });
    for (const s of data.samples) {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.y > maxY) maxY = s.y;
    }
  }

  if (units.length === 0) return null;

  // Ensure minimum world extent so the view isn't degenerate
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const halfW = Math.max((maxX - minX) / 2, 25);
  const halfH = Math.max((maxY - minY) / 2, 25);

  return {
    units,
    duration,
    bounds: { minX: cx - halfW, maxX: cx + halfW, minY: cy - halfH, maxY: cy + halfH },
  };
}

function parseCSV(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
      cur += ch;
    } else if (ch === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}
