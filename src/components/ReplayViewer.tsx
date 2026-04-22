import { useRef, useEffect, useCallback, useState } from 'react';
import { useReplayStore } from '../store/replayStore';
import { usePlanStore } from '../store/planStore';
import { SPECS, CLASS_COLORS, specIconUrl, type Role } from '../lib/wowSpecs';
import { COOLDOWNS, CLASS_COLORS as WOW_CLASS_COLORS } from '../lib/cooldowns';
import type { ReplayData, ReplayUnit, PositionSample } from '../types';

const CANVAS_H = 300;
const PAD = 40;
const PLAYER_R = 14;   // icon radius
const NPC_R = 18;

// ── icon cache ────────────────────────────────────────────────────────────────

const iconCache = new Map<string, HTMLImageElement | 'loading' | 'error'>();

function getIcon(iconName: string, onLoad: () => void): HTMLImageElement | null {
  const cached = iconCache.get(iconName);
  if (cached instanceof HTMLImageElement) return cached;
  if (cached === 'loading') return null;
  iconCache.set(iconName, 'loading');
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => { iconCache.set(iconName, img); onLoad(); };
  img.onerror = () => { iconCache.set(iconName, 'error'); };
  img.src = specIconUrl(iconName);
  return null;
}

// ── coordinate helpers ────────────────────────────────────────────────────────

function makeTransform(bounds: ReplayData['bounds'], w: number, h: number) {
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const scaleX = (w - PAD * 2) / worldW;
  const scaleY = (h - PAD * 2) / worldH;
  const scale = Math.min(scaleX, scaleY);
  const ox = PAD + ((w - PAD * 2) - worldW * scale) / 2;
  const oy = PAD + ((h - PAD * 2) - worldH * scale) / 2;
  return (wx: number, wy: number): [number, number] => [
    ox + (wx - bounds.minX) * scale,
    h - oy - (wy - bounds.minY) * scale,
  ];
}

function interpolate(positions: PositionSample[], t: number): PositionSample | null {
  if (positions.length === 0) return null;
  if (t <= positions[0].t) return positions[0];
  const last = positions[positions.length - 1];
  if (t >= last.t) return last;
  let lo = 0, hi = positions.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (positions[mid].t <= t) lo = mid; else hi = mid;
  }
  const a = positions[lo], b = positions[hi];
  const alpha = (t - a.t) / (b.t - a.t);
  return { t, x: a.x + (b.x - a.x) * alpha, y: a.y + (b.y - a.y) * alpha, facing: a.facing + (b.facing - a.facing) * alpha };
}

// ── canvas draw ───────────────────────────────────────────────────────────────

function drawUnit(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  color: string, iconImg: HTMLImageElement | null, isDead: boolean,
  name: string, showName: boolean,
) {
  ctx.save();
  ctx.globalAlpha = isDead ? 0.2 : 1;

  if (iconImg) {
    // Circular clipped icon
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    try { ctx.drawImage(iconImg, cx - r, cy - r, r * 2, r * 2); } catch { /* CORS taint fallback */ }
    ctx.restore();
  } else {
    // Fallback colored circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Colored ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = isDead ? 1 : 2.5;
  ctx.stroke();

  if (showName && !isDead) {
    ctx.globalAlpha = 0.9;
    ctx.font = '9px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    // Small shadow for legibility
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 3;
    ctx.fillText(name, cx, cy - r - 3);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function draw(
  ctx: CanvasRenderingContext2D,
  data: ReplayData,
  t: number,
  hiddenGuids: string[],
  showNames: boolean,
  playerColorMap: Map<string, string>,
  onIconLoad: () => void,
) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const toCanvas = makeTransform(data.bounds, w, h);
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#090b12';
  ctx.fillRect(0, 0, w, h);

  // Arena floor gradient
  const [fcx, fcy] = toCanvas(
    (data.bounds.minX + data.bounds.maxX) / 2,
    (data.bounds.minY + data.bounds.maxY) / 2,
  );
  const [ex] = toCanvas(data.bounds.maxX, (data.bounds.minY + data.bounds.maxY) / 2);
  const [, ey] = toCanvas((data.bounds.minX + data.bounds.maxX) / 2, data.bounds.maxY);
  const rx = Math.abs(ex - fcx) + PAD * 0.4;
  const ry = Math.abs(fcy - ey) + PAD * 0.4;

  const grad = ctx.createRadialGradient(fcx, fcy, 0, fcx, fcy, Math.max(rx, ry));
  grad.addColorStop(0, 'rgba(255,255,255,0.05)');
  grad.addColorStop(0.75, 'rgba(255,255,255,0.015)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(fcx, fcy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(fcx, fcy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Sort: NPCs first (drawn under players)
  const visible = data.units.filter(u => !hiddenGuids.includes(u.guid));
  const sorted = [...visible].sort((a, b) => (a.isPlayer ? 1 : -1) - (b.isPlayer ? 1 : -1));

  for (const unit of sorted) {
    const pos = interpolate(unit.positions, t);
    if (!pos) continue;
    const isDead = unit.deathTimes.some(dt => dt <= t);
    const [ux, uy] = toCanvas(pos.x, pos.y);

    const spec = unit.specId ? SPECS[unit.specId] : undefined;
    const color = spec
      ? spec.color
      : (unit.isPlayer ? (playerColorMap.get(unit.name) ?? '#94a3b8') : CLASS_COLORS.NPC);
    const r = unit.isPlayer ? PLAYER_R : NPC_R;

    // Facing line for players
    if (unit.isPlayer && !isDead) {
      const canvasFacing = -pos.facing + Math.PI / 2;
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ux, uy);
      ctx.lineTo(ux + Math.cos(canvasFacing) * (r + 6), uy + Math.sin(canvasFacing) * (r + 6));
      ctx.stroke();
      ctx.restore();
    }

    // Load icon if player with known spec
    let iconImg: HTMLImageElement | null = null;
    if (spec) {
      iconImg = getIcon(spec.iconName, onIconLoad);
    }

    drawUnit(ctx, ux, uy, r, color, iconImg, isDead, unit.name, showNames);
  }
}

// ── helpers for filter UI ─────────────────────────────────────────────────────

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

const ROLE_COLORS: Record<Role, string> = {
  Tank:   '#60a5fa',
  Healer: '#4ade80',
  Damage: '#f87171',
};

// ── component ─────────────────────────────────────────────────────────────────

export function ReplayViewer() {
  const replayData    = useReplayStore(s => s.replayData);
  const cdRows        = usePlanStore(s => s.plan.cdRows);
  const currentTime   = useReplayStore(s => s.currentTime);
  const setCurrentTime = useReplayStore(s => s.setCurrentTime);
  const playing       = useReplayStore(s => s.playing);
  const setPlaying    = useReplayStore(s => s.setPlaying);
  const hiddenRoles   = useReplayStore(s => s.hiddenRoles);
  const toggleRole    = useReplayStore(s => s.toggleRole);
  const hiddenGuids   = useReplayStore(s => s.hiddenGuids);
  const toggleUnit    = useReplayStore(s => s.toggleUnit);
  const showNames     = useReplayStore(s => s.showNames);
  const setShowNames  = useReplayStore(s => s.setShowNames);

  const [showUnitPanel, setShowUnitPanel] = useState(false);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number | null>(null);
  const playTimeRef  = useRef(currentTime);
  const lastTsRef    = useRef<number | null>(null);
  const storeTickRef = useRef(0);

  // Compute effective hidden guids: from explicit toggles + hidden roles
  const effectiveHiddenGuids = replayData
    ? replayData.units
        .filter(u => {
          if (hiddenGuids.includes(u.guid)) return true;
          if (u.isPlayer && u.specId) {
            const spec = SPECS[u.specId];
            if (spec && hiddenRoles.includes(spec.role)) return true;
          }
          return false;
        })
        .map(u => u.guid)
    : [];

  // Build playerName → class color from CD rows as fallback when specId is unknown
  const playerColorMap = new Map<string, string>();
  for (const row of cdRows) {
    if (!playerColorMap.has(row.playerName)) {
      const cd = COOLDOWNS[row.cooldownKey];
      if (cd) playerColorMap.set(row.playerName, WOW_CLASS_COLORS[cd.class]);
    }
  }

  const redraw = useCallback((t: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && replayData) {
      draw(ctx, replayData, t, effectiveHiddenGuids, showNames, playerColorMap, () => redraw(playTimeRef.current));
    }
  }, [replayData, effectiveHiddenGuids, showNames, playerColorMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redraw when paused
  useEffect(() => {
    if (!playing) redraw(currentTime);
  }, [currentTime, replayData, playing, redraw]);

  // Animation loop
  useEffect(() => {
    if (!playing || !replayData) return;
    playTimeRef.current = currentTime;
    lastTsRef.current = null;
    storeTickRef.current = 0;

    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      playTimeRef.current = Math.min(replayData.duration, playTimeRef.current + dt);

      redraw(playTimeRef.current);

      storeTickRef.current += dt;
      if (storeTickRef.current >= 0.1) {
        setCurrentTime(playTimeRef.current);
        storeTickRef.current = 0;
      }

      if (playTimeRef.current < replayData.duration) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentTime(replayData.duration);
        setPlaying(false);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setCurrentTime(playTimeRef.current);
    };
  }, [playing, replayData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = CANVAS_H;
      if (!playing) redraw(currentTime);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [playing, currentTime, redraw]);

  if (!replayData) {
    return (
      <div className="flex items-center justify-center h-16 text-white/25 text-xs border-b border-white/10 bg-[#090b12]">
        No replay data — import a log with Advanced Combat Logging enabled
      </div>
    );
  }

  const duration = replayData.duration;
  const players = replayData.units.filter(u => u.isPlayer);
  const npcs    = replayData.units.filter(u => !u.isPlayer);

  // Group players by role for the unit panel
  const byRole: Record<string, ReplayUnit[]> = { Tank: [], Healer: [], Damage: [], Unknown: [] };
  for (const u of players) {
    const role = u.specId ? (SPECS[u.specId]?.role ?? 'Unknown') : 'Unknown';
    byRole[role].push(u);
  }

  return (
    <div className="flex flex-col border-b border-white/10 bg-[#090b12]" style={{ height: CANVAS_H + 64 }}>
      {/* Controls row */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 shrink-0">
        <button
          className="w-7 h-7 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors text-sm"
          onClick={() => { if (currentTime >= duration) setCurrentTime(0); setPlaying(!playing); }}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button
          className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 text-xs"
          onClick={() => { setCurrentTime(0); setPlaying(false); }}
          title="Restart"
        >↺</button>
        <input
          type="range" min={0} max={duration} step={0.1}
          value={currentTime} onChange={e => { setCurrentTime(parseFloat(e.target.value)); if (playing) setPlaying(false); }}
          className="flex-1 h-1 accent-cyan-400 cursor-pointer"
        />
        <span className="text-[10px] text-white/40 tabular-nums shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-white/10 shrink-0 flex-wrap">
        <span className="text-[10px] text-white/30 uppercase tracking-wider">Roles</span>
        {(['Tank', 'Healer', 'Damage'] as Role[]).map(role => {
          const hidden = hiddenRoles.includes(role);
          return (
            <button
              key={role}
              onClick={() => toggleRole(role)}
              className="px-2 py-0.5 rounded text-[10px] font-medium border transition-all"
              style={{
                borderColor: hidden ? 'rgba(255,255,255,0.1)' : ROLE_COLORS[role] + '80',
                color: hidden ? 'rgba(255,255,255,0.25)' : ROLE_COLORS[role],
                background: hidden ? 'transparent' : ROLE_COLORS[role] + '18',
              }}
            >
              {role}
            </button>
          );
        })}

        <div className="w-px h-3 bg-white/10 mx-1" />

        {/* Names toggle */}
        <button
          onClick={() => setShowNames(!showNames)}
          className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
            showNames
              ? 'border-white/20 text-white/70 bg-white/10'
              : 'border-white/10 text-white/25'
          }`}
        >
          Names
        </button>

        {/* Units panel toggle */}
        <div className="relative">
          <button
            onClick={() => setShowUnitPanel(v => !v)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
              showUnitPanel
                ? 'border-white/20 text-white/70 bg-white/10'
                : 'border-white/10 text-white/25 hover:text-white/50'
            }`}
          >
            Units {players.length}p · {npcs.length} npc {showUnitPanel ? '▲' : '▼'}
          </button>

          {showUnitPanel && (
            <div className="absolute top-full left-0 z-50 mt-1 w-64 max-h-72 overflow-y-auto rounded-lg border border-white/15 bg-[#13151f] shadow-xl">
              {(['Tank', 'Healer', 'Damage', 'Unknown'] as const).map(role => {
                const group = byRole[role];
                if (group.length === 0) return null;
                return (
                  <div key={role}>
                    <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider"
                      style={{ color: role === 'Unknown' ? 'rgba(255,255,255,0.25)' : ROLE_COLORS[role as Role] }}
                    >
                      {role}
                    </div>
                    {group.map(unit => {
                      const spec = unit.specId ? SPECS[unit.specId] : undefined;
                      const isHidden = hiddenGuids.includes(unit.guid);
                      return (
                        <button
                          key={unit.guid}
                          onClick={() => toggleUnit(unit.guid)}
                          className="w-full flex items-center gap-2 px-3 py-1 hover:bg-white/5 transition-colors text-left"
                        >
                          <div
                            className="w-3 h-3 rounded-full shrink-0 border"
                            style={{
                              background: isHidden ? 'transparent' : (spec?.color ?? '#94a3b8'),
                              borderColor: spec?.color ?? '#94a3b8',
                            }}
                          />
                          <span className={`text-xs truncate ${isHidden ? 'text-white/25 line-through' : 'text-white/70'}`}>
                            {unit.name}
                          </span>
                          {spec && (
                            <span className="text-[10px] text-white/30 ml-auto shrink-0">{spec.specName}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              {/* NPCs */}
              {npcs.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-orange-400/60">NPC</div>
                  {npcs.map(unit => {
                    const isHidden = hiddenGuids.includes(unit.guid);
                    return (
                      <button
                        key={unit.guid}
                        onClick={() => toggleUnit(unit.guid)}
                        className="w-full flex items-center gap-2 px-3 py-1 hover:bg-white/5 transition-colors text-left"
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0 border border-orange-500"
                          style={{ background: isHidden ? 'transparent' : '#f97316' }}
                        />
                        <span className={`text-xs truncate ${isHidden ? 'text-white/25 line-through' : 'text-white/70'}`}>
                          {unit.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0" height={CANVAS_H} />
      </div>
    </div>
  );
}
