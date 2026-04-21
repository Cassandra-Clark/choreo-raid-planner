import { useRef, useCallback, useState } from 'react';
import { usePlanStore } from '../store/planStore';
import { useReplayStore } from '../store/replayStore';
import { COOLDOWNS } from '../lib/cooldowns';
import type { CooldownRow, BossAbility } from '../types';

const PX_PER_SECOND = 8;
const BOSS_LANE_H = 100;
const CD_ROW_H = 36;
const LABEL_W = 160;
const RULER_H = 28;

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Timeline() {
  const plan = usePlanStore(s => s.plan);
  const toggleHidden = usePlanStore(s => s.toggleAbilityHidden);
  const replayCursorTime = useReplayStore(s => s.currentTime);
  const addPlacement = usePlanStore(s => s.addPlacement);
  const removePlacement = usePlanStore(s => s.removePlacement);
  const movePlacement = usePlanStore(s => s.movePlacement);
  const removeCooldownRow = usePlanStore(s => s.removeCooldownRow);

  const totalW = plan.fightDuration * PX_PER_SECOND;

  const [dragging, setDragging] = useState<{
    rowId: string; placementId: string; startX: number; startTime: number;
  } | null>(null);

  const bossScrollRef = useRef<HTMLDivElement>(null);
  const cdScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const syncFromBoss = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (cdScrollRef.current && bossScrollRef.current) {
      cdScrollRef.current.scrollLeft = bossScrollRef.current.scrollLeft;
    }
    syncingRef.current = false;
  }, []);

  const syncFromCd = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (bossScrollRef.current && cdScrollRef.current) {
      bossScrollRef.current.scrollLeft = cdScrollRef.current.scrollLeft;
    }
    syncingRef.current = false;
  }, []);

  const getTimeFromX = useCallback((x: number) => {
    return Math.max(0, Math.min(plan.fightDuration, Math.round(x / PX_PER_SECOND)));
  }, [plan.fightDuration]);

  const handleRowClick = useCallback((e: React.MouseEvent, row: CooldownRow) => {
    if (dragging) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left - LABEL_W;
    if (x < 0) return;
    addPlacement(row.id, getTimeFromX(x));
  }, [dragging, getTimeFromX, addPlacement]);

  const handlePlacementMouseDown = useCallback((
    e: React.MouseEvent, rowId: string, placementId: string, time: number
  ) => {
    e.stopPropagation();
    if (e.button === 2) { removePlacement(rowId, placementId); return; }
    setDragging({ rowId, placementId, startX: e.clientX, startTime: time });
  }, [removePlacement]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const newTime = Math.max(0, Math.min(
      plan.fightDuration,
      Math.round(dragging.startTime + dx / PX_PER_SECOND)
    ));
    movePlacement(dragging.rowId, dragging.placementId, newTime);
  }, [dragging, plan.fightDuration, movePlacement]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const visibleAbilities = plan.bossAbilities.filter(a => !a.hidden);

  const ticks: number[] = [];
  for (let t = 0; t <= plan.fightDuration; t += 30) ticks.push(t);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ── Boss timeline pane ── */}
      <div
        ref={bossScrollRef}
        className="shrink-0 overflow-x-auto overflow-y-hidden border-b-2 border-white/20"
        onScroll={syncFromBoss}
      >
        <div style={{ width: totalW + LABEL_W, minWidth: '100%', position: 'relative' }}>
          {/* Ruler */}
          <div
            className="flex border-b border-white/10 bg-[#0f1117]"
            style={{ height: RULER_H }}
          >
            <div
              className="flex items-center px-2 border-r border-white/10 shrink-0 text-[10px] text-white/30 font-medium uppercase tracking-wider"
              style={{ width: LABEL_W, minWidth: LABEL_W }}
            >
              Boss
            </div>
            <div className="relative flex-1" style={{ height: RULER_H }}>
              {ticks.map(t => (
                <div
                  key={t}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: t * PX_PER_SECOND }}
                >
                  <div className={`${t % 60 === 0 ? 'h-3 bg-white/30' : 'h-2 bg-white/15'} w-px`} />
                  {t % 60 === 0 && (
                    <span className="text-[10px] text-white/40 mt-0.5 -translate-x-1/2">{formatTime(t)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Boss ability lane */}
          <BossLane
            abilities={plan.bossAbilities}
            fightDuration={plan.fightDuration}
            onToggle={toggleHidden}
          />

          {/* Replay time cursor */}
          <div
            className="absolute top-0 bottom-0 w-px bg-cyan-400/70 pointer-events-none z-30"
            style={{ left: LABEL_W + replayCursorTime * PX_PER_SECOND }}
          />
        </div>
      </div>

      {/* ── Player cooldown pane ── */}
      <div
        ref={cdScrollRef}
        className="flex-1 overflow-auto"
        onScroll={syncFromCd}
      >
        <div style={{ width: totalW + LABEL_W, minWidth: '100%', position: 'relative' }}>
          {/* Ruler (mirrored so it's visible in the CD pane too) */}
          <div
            className="sticky top-0 z-10 flex border-b border-white/10 bg-[#0f1117]"
            style={{ height: RULER_H }}
          >
            <div
              className="flex items-center px-2 border-r border-white/10 shrink-0 text-[10px] text-white/30 font-medium uppercase tracking-wider"
              style={{ width: LABEL_W, minWidth: LABEL_W }}
            >
              Cooldowns
            </div>
            <div className="relative flex-1" style={{ height: RULER_H }}>
              {ticks.map(t => (
                <div
                  key={t}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: t * PX_PER_SECOND }}
                >
                  <div className={`${t % 60 === 0 ? 'h-3 bg-white/30' : 'h-2 bg-white/15'} w-px`} />
                  {t % 60 === 0 && (
                    <span className="text-[10px] text-white/40 mt-0.5 -translate-x-1/2">{formatTime(t)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CD rows */}
          {plan.cdRows.map(row => {
            const cd = COOLDOWNS[row.cooldownKey];
            if (!cd) return null;
            return (
              <div
                key={row.id}
                className="relative flex border-b border-white/5 hover:bg-white/[0.02] cursor-crosshair group"
                style={{ height: CD_ROW_H }}
                onClick={e => handleRowClick(e, row)}
                onContextMenu={e => e.preventDefault()}
              >
                {/* Label */}
                <div
                  className="flex items-center gap-1.5 px-2 border-r border-white/10 shrink-0"
                  style={{ width: LABEL_W }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cd.color }} />
                  <span className="text-xs text-white/70 truncate">{row.playerName}</span>
                  <span className="text-[10px] text-white/30 truncate">{cd.name}</span>
                  <button
                    className="ml-auto opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 text-xs"
                    onClick={e => { e.stopPropagation(); removeCooldownRow(row.id); }}
                  >✕</button>
                </div>

                {/* Timeline area */}
                <div
                  className="relative flex-1 timeline-grid"
                  style={{ '--tick-px': `${PX_PER_SECOND * 30}px` } as React.CSSProperties}
                >
                  {/* Faint boss ability guide lines */}
                  {visibleAbilities.map(a => (
                    <div
                      key={a.id}
                      className="absolute top-0 bottom-0 w-px opacity-10 pointer-events-none"
                      style={{ left: a.time * PX_PER_SECOND, background: a.color }}
                    />
                  ))}
                  {row.placements.map(pl => (
                    <PlacementBlock
                      key={pl.id}
                      time={pl.time}
                      duration={cd.duration}
                      cooldown={cd.cooldown}
                      color={cd.color}
                      note={pl.note}
                      fightDuration={plan.fightDuration}
                      onMouseDown={e => handlePlacementMouseDown(e, row.id, pl.id, pl.time)}
                      isDragging={dragging?.placementId === pl.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {plan.cdRows.length === 0 && (
            <div className="flex items-center justify-center h-24 text-white/20 text-sm border-b border-white/5">
              Add cooldown rows from the sidebar →
            </div>
          )}

          {/* Replay time cursor */}
          <div
            className="absolute top-0 bottom-0 w-px bg-cyan-400/70 pointer-events-none z-30"
            style={{ left: LABEL_W + replayCursorTime * PX_PER_SECOND }}
          />
        </div>
      </div>
    </div>
  );
}

function BossLane({ abilities, fightDuration, onToggle }: {
  abilities: BossAbility[];
  fightDuration: number;
  onToggle: (id: string) => void;
}) {
  const totalW = fightDuration * PX_PER_SECOND;

  return (
    <div
      className="relative flex bg-[#0c0e18]"
      style={{ height: BOSS_LANE_H }}
    >
      {/* Label */}
      <div
        className="flex items-center px-2 border-r border-white/10 shrink-0 z-10 bg-[#0c0e18]"
        style={{ width: LABEL_W }}
      >
        <span className="text-xs text-white/40 font-medium">
          {abilities.length === 0 ? 'No log imported' : `${abilities.length} abilities`}
        </span>
      </div>

      {/* Timeline canvas */}
      <div className="relative flex-1 overflow-hidden">
        {/* Fight duration bar */}
        <div
          className="absolute rounded-full bg-white/5"
          style={{
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: totalW,
            height: 4,
          }}
        />

        {/* Ability markers */}
        {abilities.map(a => (
          <AbilityMarker key={a.id} ability={a} laneH={BOSS_LANE_H} onToggle={onToggle} />
        ))}

        {abilities.length === 0 && (
          <div className="flex items-center h-full pl-4 text-white/20 text-xs">
            Import a combat log to populate boss abilities
          </div>
        )}
      </div>
    </div>
  );
}

function AbilityMarker({ ability: a, laneH, onToggle }: {
  ability: BossAbility;
  laneH: number;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className={`absolute top-0 bottom-0 flex flex-col items-center cursor-pointer group/ab transition-opacity ${a.hidden ? 'opacity-20' : 'opacity-100'}`}
      style={{ left: a.time * PX_PER_SECOND }}
      onClick={() => onToggle(a.id)}
      title={`${a.spellName} @ ${formatTime(a.time)} — click to toggle`}
    >
      {/* Vertical line */}
      <div
        className="w-px opacity-50 group-hover/ab:opacity-90 transition-opacity"
        style={{ background: a.color, height: laneH }}
      />

      {/* Top dot */}
      <div
        className="absolute top-2 w-2 h-2 rounded-full border border-black/30 -translate-x-1/2 group-hover/ab:scale-125 transition-transform"
        style={{ background: a.color, left: 0 }}
      />

      {/* Name label */}
      <div
        className="absolute text-[9px] whitespace-nowrap pointer-events-none font-medium"
        style={{
          color: a.color,
          top: 18,
          left: 5,
          transform: 'rotate(40deg)',
          transformOrigin: 'left top',
          opacity: a.hidden ? 0.4 : 0.85,
        }}
      >
        {a.spellName}
      </div>
    </div>
  );
}

function PlacementBlock({ time, duration, cooldown, color, note, fightDuration, onMouseDown, isDragging }: {
  time: number;
  duration: number;
  cooldown: number;
  color: string;
  note?: string;
  fightDuration: number;
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}) {
  const left = time * PX_PER_SECOND;
  const durationW = duration * PX_PER_SECOND;
  const cdW = Math.min(cooldown * PX_PER_SECOND, fightDuration * PX_PER_SECOND - left);

  return (
    <div
      className="absolute top-0 bottom-0 flex items-center"
      style={{ left, zIndex: isDragging ? 10 : 1 }}
    >
      {cooldown > 0 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full opacity-15"
          style={{ width: cdW, background: color, left: 0 }}
        />
      )}
      <div
        className={`absolute top-1 bottom-1 rounded cursor-grab active:cursor-grabbing ${isDragging ? 'ring-2 ring-white/50' : ''}`}
        style={{
          left: 0,
          width: Math.max(4, durationW),
          background: color,
          opacity: isDragging ? 0.9 : 0.75,
        }}
        onMouseDown={onMouseDown}
        title={note || `Right-click to remove`}
      />
    </div>
  );
}
