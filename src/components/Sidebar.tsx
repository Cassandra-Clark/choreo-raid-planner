import { useState, useRef } from 'react';
import { usePlanStore } from '../store/planStore';
import { COOLDOWNS, CLASS_COLORS, type WowClass } from '../lib/cooldowns';
import { parseLog, parseReplayData } from '../lib/logParser';
import { spellIconUrl } from '../lib/wowSpecs';
import { useReplayStore } from '../store/replayStore';
import type { ParsedFight } from '../types';

const CLASS_LIST: WowClass[] = [
  'warrior', 'paladin', 'hunter', 'rogue', 'priest',
  'deathknight', 'shaman', 'mage', 'warlock', 'monk',
  'druid', 'demonhunter', 'evoker',
];

export function Sidebar() {
  const [tab, setTab] = useState<'cds' | 'abilities'>('cds');
  const [selectedClass, setSelectedClass] = useState<WowClass | 'all'>('all');
  const [playerName, setPlayerName] = useState('');
  const [fights, setFights] = useState<ParsedFight[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const logTextRef = useRef<string>('');

  const importFight = usePlanStore(s => s.importFight);
  const addCooldownRow = usePlanStore(s => s.addCooldownRow);
  const toggleAbilityHidden = usePlanStore(s => s.toggleAbilityHidden);
  const plan = usePlanStore(s => s.plan);

  const setReplayData = useReplayStore(s => s.setReplayData);
  const setReplayTime = useReplayStore(s => s.setCurrentTime);

  const filteredCDs = Object.values(COOLDOWNS).filter(cd =>
    selectedClass === 'all' || cd.class === selectedClass
  );

  async function handleLogFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setParseError('');
    setFights([]);
    try {
      const text = await file.text();
      logTextRef.current = text;
      const parsed = parseLog(text);
      if (parsed.length === 0) {
        setParseError('No boss encounters found in this log.');
      } else {
        setFights(parsed);
      }
    } catch (err) {
      setParseError('Failed to parse log file.');
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleImportFight(fight: ParsedFight, idx: number) {
    importFight(fight);
    setReplayTime(0);
    setFights([]);
    // Defer heavy replay parsing so React can render the boss abilities first
    setTimeout(() => {
      const replay = parseReplayData(logTextRef.current, idx);
      setReplayData(replay);
    }, 0);
  }

  return (
    <div className="w-64 shrink-0 bg-[#13151f] border-r border-white/10 flex flex-col overflow-hidden">
      {/* Log import */}
      <div className="p-3 border-b border-white/10">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Combat Log</div>
        <label className="flex items-center justify-center gap-2 w-full py-2 rounded bg-white/5 hover:bg-white/10 cursor-pointer text-xs text-white/60 border border-white/10 border-dashed transition-colors">
          <input
            ref={fileRef}
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleLogFile}
          />
          {parsing ? 'Parsing…' : '⬆ Import WoW Combat Log'}
        </label>
        {parseError && <p className="text-red-400 text-xs mt-1">{parseError}</p>}
        {fights.length > 0 && (
          <div className="mt-2 space-y-1">
            {fights.map((f, i) => (
              <button
                key={i}
                className="w-full text-left px-2 py-1.5 rounded bg-white/5 hover:bg-indigo-500/20 text-xs border border-white/10 hover:border-indigo-400/40 transition-colors"
                onClick={() => handleImportFight(f, i)}
              >
                <div className="font-medium text-white/80">{f.bossName}</div>
                <div className="text-white/40">{Math.floor(f.duration / 60)}:{String(f.duration % 60).padStart(2, '0')} · {f.abilities.length} abilities</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['cds', 'abilities'] as const).map(t => (
          <button
            key={t}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === t ? 'text-white border-b-2 border-indigo-400' : 'text-white/40 hover:text-white/70'}`}
            onClick={() => setTab(t)}
          >
            {t === 'cds' ? 'Cooldowns' : 'Boss Abilities'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'cds' && (
          <CDTab
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            filteredCDs={filteredCDs}
            playerName={playerName}
            setPlayerName={setPlayerName}
            addCooldownRow={addCooldownRow}
          />
        )}
        {tab === 'abilities' && (
          <AbilitiesTab
            abilities={plan.bossAbilities}
            onToggle={toggleAbilityHidden}
          />
        )}
      </div>
    </div>
  );
}

function CDTab({ selectedClass, setSelectedClass, filteredCDs, playerName, setPlayerName, addCooldownRow }: {
  selectedClass: WowClass | 'all';
  setSelectedClass: (c: WowClass | 'all') => void;
  filteredCDs: ReturnType<typeof Object.values<typeof COOLDOWNS[string]>>;
  playerName: string;
  setPlayerName: (s: string) => void;
  addCooldownRow: (name: string, key: string) => void;
}) {
  return (
    <div className="p-3 space-y-3">
      <input
        type="text"
        placeholder="Player name…"
        className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white/80 placeholder-white/30 focus:outline-none focus:border-indigo-400/50"
        value={playerName}
        onChange={e => setPlayerName(e.target.value)}
      />

      {/* Class filter */}
      <div className="flex flex-wrap gap-1">
        <button
          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${selectedClass === 'all' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
          onClick={() => setSelectedClass('all')}
        >All</button>
        {CLASS_LIST.map(cls => (
          <button
            key={cls}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors capitalize ${selectedClass === cls ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            style={selectedClass === cls ? { background: CLASS_COLORS[cls] + '40', color: CLASS_COLORS[cls] } : {}}
            onClick={() => setSelectedClass(cls)}
          >
            {cls === 'deathknight' ? 'DK' : cls === 'demonhunter' ? 'DH' : cls.slice(0, 4)}
          </button>
        ))}
      </div>

      {/* Cooldown list */}
      <div className="space-y-1">
        {filteredCDs.map(cd => (
          <button
            key={cd.key}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left transition-colors group"
            onClick={() => {
              if (!playerName.trim()) {
                alert('Enter a player name first');
                return;
              }
              addCooldownRow(playerName.trim(), cd.key);
            }}
            title={`CD: ${cd.cooldown}s · Duration: ${cd.duration}s`}
          >
            <div className="relative shrink-0 w-6 h-6">
              <img
                src={spellIconUrl(cd.iconName)}
                alt=""
                className="w-6 h-6 rounded object-cover"
                style={{ outline: `1.5px solid ${cd.color}40` }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div
                className="absolute inset-0 rounded hidden"
                style={{ background: cd.color }}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/80 truncate">{cd.name}</div>
              <div className="text-[10px] text-white/30">{cd.cooldown}s CD · {cd.duration}s</div>
            </div>
            <span className="text-white/20 group-hover:text-white/60 text-xs">+</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AbilitiesTab({ abilities, onToggle }: {
  abilities: import('../types').BossAbility[];
  onToggle: (id: string) => void;
}) {
  if (abilities.length === 0) {
    return (
      <div className="p-4 text-center text-white/30 text-xs">
        Import a combat log and select a fight to see boss abilities.
      </div>
    );
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  return (
    <div className="p-2 space-y-0.5">
      {abilities.map(a => (
        <button
          key={a.id}
          className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-opacity ${a.hidden ? 'opacity-30' : 'opacity-100'} hover:bg-white/5`}
          onClick={() => onToggle(a.id)}
          title="Click to show/hide"
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
          <span className="text-[10px] text-white/40 w-8 shrink-0">{formatTime(a.time)}</span>
          <span className="text-xs text-white/70 truncate">{a.spellName}</span>
        </button>
      ))}
    </div>
  );
}
