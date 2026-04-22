export interface CooldownDef {
  key: string;
  name: string;
  spellId: number;
  duration: number;   // seconds the buff/effect lasts
  cooldown: number;   // recharge in seconds
  class: WowClass;
  color: string;      // hex
  category: 'healing' | 'defensive' | 'offensive' | 'utility' | 'movement';
  iconName: string;   // wow.zamimg.com icon filename (no extension)
}

export type WowClass =
  | 'warrior' | 'paladin' | 'hunter' | 'rogue' | 'priest'
  | 'deathknight' | 'shaman' | 'mage' | 'warlock' | 'monk'
  | 'druid' | 'demonhunter' | 'evoker';

export const CLASS_COLORS: Record<WowClass, string> = {
  warrior:     '#C79C6E',
  paladin:     '#F58CBA',
  hunter:      '#ABD473',
  rogue:       '#FFF569',
  priest:      '#FFFFFF',
  deathknight: '#C41F3B',
  shaman:      '#0070DE',
  mage:        '#69CCF0',
  warlock:     '#9482C9',
  monk:        '#00FF96',
  druid:       '#FF7D0A',
  demonhunter: '#A330C9',
  evoker:      '#33937F',
};

export const COOLDOWNS: Record<string, CooldownDef> = {
  // ── Warrior ──────────────────────────────────────────────────────────────
  rallying_cry: {
    key: 'rallying_cry', name: 'Rallying Cry', spellId: 97462,
    duration: 10, cooldown: 180, class: 'warrior',
    color: CLASS_COLORS.warrior, category: 'defensive',
    iconName: 'ability_warrior_rallyingcry',
  },
  // ── Paladin ──────────────────────────────────────────────────────────────
  aura_mastery: {
    key: 'aura_mastery', name: 'Aura Mastery', spellId: 31821,
    duration: 8, cooldown: 180, class: 'paladin',
    color: CLASS_COLORS.paladin, category: 'defensive',
    iconName: 'spell_holy_auramastery',
  },
  blessing_of_protection: {
    key: 'blessing_of_protection', name: 'BoP', spellId: 1022,
    duration: 10, cooldown: 300, class: 'paladin',
    color: CLASS_COLORS.paladin, category: 'defensive',
    iconName: 'spell_holy_sealofprotection',
  },
  blessing_of_sacrifice: {
    key: 'blessing_of_sacrifice', name: 'BoS', spellId: 6940,
    duration: 12, cooldown: 120, class: 'paladin',
    color: CLASS_COLORS.paladin, category: 'defensive',
    iconName: 'spell_holy_sealofsacrifice',
  },
  divine_toll: {
    key: 'divine_toll', name: 'Divine Toll', spellId: 375576,
    duration: 0, cooldown: 60, class: 'paladin',
    color: CLASS_COLORS.paladin, category: 'healing',
    iconName: 'spell_paladin_divinetoll',
  },
  // ── Priest ───────────────────────────────────────────────────────────────
  barrier: {
    key: 'barrier', name: 'Power Word: Barrier', spellId: 62618,
    duration: 25, cooldown: 180, class: 'priest',
    color: CLASS_COLORS.priest, category: 'defensive',
    iconName: 'spell_holy_powerwordbarrier',
  },
  pain_suppression: {
    key: 'pain_suppression', name: 'Pain Suppression', spellId: 33206,
    duration: 8, cooldown: 180, class: 'priest',
    color: CLASS_COLORS.priest, category: 'defensive',
    iconName: 'spell_holy_painsupression',
  },
  guardian_spirit: {
    key: 'guardian_spirit', name: 'Guardian Spirit', spellId: 47788,
    duration: 10, cooldown: 180, class: 'priest',
    color: CLASS_COLORS.priest, category: 'defensive',
    iconName: 'spell_holy_guardianspirit',
  },
  leap_of_faith: {
    key: 'leap_of_faith', name: 'Grip', spellId: 73325,
    duration: 0, cooldown: 90, class: 'priest',
    color: CLASS_COLORS.priest, category: 'utility',
    iconName: 'spell_priest_leapoffaith',
  },
  power_infusion: {
    key: 'power_infusion', name: 'Power Infusion', spellId: 10060,
    duration: 20, cooldown: 120, class: 'priest',
    color: CLASS_COLORS.priest, category: 'offensive',
    iconName: 'spell_holy_powerinfusion',
  },
  // ── Death Knight ─────────────────────────────────────────────────────────
  amz: {
    key: 'amz', name: 'Anti-Magic Zone', spellId: 51052,
    duration: 8, cooldown: 120, class: 'deathknight',
    color: CLASS_COLORS.deathknight, category: 'defensive',
    iconName: 'spell_deathknight_antimagiczone',
  },
  // ── Shaman ───────────────────────────────────────────────────────────────
  spirit_link: {
    key: 'spirit_link', name: 'Spirit Link Totem', spellId: 98008,
    duration: 6, cooldown: 180, class: 'shaman',
    color: CLASS_COLORS.shaman, category: 'defensive',
    iconName: 'spell_shaman_spiritlink',
  },
  bloodlust: {
    key: 'bloodlust', name: 'Bloodlust', spellId: 2825,
    duration: 40, cooldown: 300, class: 'shaman',
    color: CLASS_COLORS.shaman, category: 'offensive',
    iconName: 'spell_nature_bloodlust',
  },
  // ── Druid ────────────────────────────────────────────────────────────────
  tranquility: {
    key: 'tranquility', name: 'Tranquility', spellId: 740,
    duration: 8, cooldown: 180, class: 'druid',
    color: CLASS_COLORS.druid, category: 'healing',
    iconName: 'spell_nature_tranquility',
  },
  innervate: {
    key: 'innervate', name: 'Innervate', spellId: 29166,
    duration: 12, cooldown: 180, class: 'druid',
    color: CLASS_COLORS.druid, category: 'offensive',
    iconName: 'ability_druid_innervate',
  },
  // ── Monk ─────────────────────────────────────────────────────────────────
  revival: {
    key: 'revival', name: 'Revival', spellId: 115310,
    duration: 0, cooldown: 180, class: 'monk',
    color: CLASS_COLORS.monk, category: 'healing',
    iconName: 'ability_monk_revival',
  },
  // ── Mage ─────────────────────────────────────────────────────────────────
  timewarp: {
    key: 'timewarp', name: 'Time Warp', spellId: 80353,
    duration: 40, cooldown: 300, class: 'mage',
    color: CLASS_COLORS.mage, category: 'offensive',
    iconName: 'spell_mage_timewarp',
  },
  // ── Demon Hunter ─────────────────────────────────────────────────────────
  darkness: {
    key: 'darkness', name: 'Darkness', spellId: 196718,
    duration: 8, cooldown: 180, class: 'demonhunter',
    color: CLASS_COLORS.demonhunter, category: 'defensive',
    iconName: 'ability_demonhunter_darkness',
  },
  // ── Evoker ───────────────────────────────────────────────────────────────
  rewind: {
    key: 'rewind', name: 'Rewind', spellId: 363534,
    duration: 0, cooldown: 240, class: 'evoker',
    color: CLASS_COLORS.evoker, category: 'healing',
    iconName: 'ability_evoker_rewind',
  },
  dream_breath: {
    key: 'dream_breath', name: 'Dream Breath', spellId: 355936,
    duration: 0, cooldown: 30, class: 'evoker',
    color: CLASS_COLORS.evoker, category: 'healing',
    iconName: 'ability_evoker_dreambreath',
  },
  // ── Hunter ───────────────────────────────────────────────────────────────
  heroism_hunter: {
    key: 'heroism_hunter', name: 'Heroism', spellId: 32182,
    duration: 40, cooldown: 300, class: 'hunter',
    color: CLASS_COLORS.hunter, category: 'offensive',
    iconName: 'ability_shaman_heroism',
  },
  // ── Warlock ──────────────────────────────────────────────────────────────
  gateway: {
    key: 'gateway', name: 'Demonic Gateway', spellId: 111771,
    duration: 900, cooldown: 10, class: 'warlock',
    color: CLASS_COLORS.warlock, category: 'utility',
    iconName: 'warlock_summon_demonicgateway',
  },
};

export const COOLDOWN_CATEGORIES = ['defensive', 'healing', 'offensive', 'utility', 'movement'] as const;
