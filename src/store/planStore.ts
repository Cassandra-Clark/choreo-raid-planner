import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from '../lib/nanoid';
import type { Plan, BossAbility, CooldownRow, CooldownPlacement, ParsedFight } from '../types';
import { COOLDOWNS } from '../lib/cooldowns';
import { setPlanInURL, clearPlanFromURL } from '../lib/sharing';

const ABILITY_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6',
];

function colorForSpell(spellId: number): string {
  return ABILITY_COLORS[spellId % ABILITY_COLORS.length];
}

function makeDefaultPlan(): Plan {
  return {
    id: nanoid(),
    name: 'New Plan',
    bossName: '',
    fightDuration: 300,
    bossAbilities: [],
    cdRows: [],
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

interface PlanStore {
  plan: Plan;
  // Plan management
  loadPlan: (plan: Plan) => void;
  newPlan: () => void;
  setPlanName: (name: string) => void;
  setBossName: (name: string) => void;
  setFightDuration: (secs: number) => void;
  setNotes: (notes: string) => void;
  // Boss abilities (from log)
  importFight: (fight: ParsedFight) => void;
  toggleAbilityHidden: (id: string) => void;
  setAbilityColor: (id: string, color: string) => void;
  // CD rows
  addCooldownRow: (playerName: string, cooldownKey: string) => void;
  removeCooldownRow: (rowId: string) => void;
  renameCooldownRowPlayer: (rowId: string, name: string) => void;
  // Placements
  addPlacement: (rowId: string, time: number) => void;
  removePlacement: (rowId: string, placementId: string) => void;
  movePlacement: (rowId: string, placementId: string, time: number) => void;
  updatePlacementNote: (rowId: string, placementId: string, note: string) => void;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      plan: makeDefaultPlan(),

      loadPlan: (plan) => {
        set({ plan });
        setPlanInURL(plan);
      },

      newPlan: () => {
        const p = makeDefaultPlan();
        clearPlanFromURL();
        set({ plan: p });
      },

      setPlanName: (name) => update(set, get, p => ({ ...p, name })),
      setBossName: (bossName) => update(set, get, p => ({ ...p, bossName })),
      setFightDuration: (fightDuration) => update(set, get, p => ({ ...p, fightDuration })),
      setNotes: (notes) => update(set, get, p => ({ ...p, notes })),

      importFight: (fight) => {
        update(set, get, p => ({
          ...p,
          bossName: fight.bossName,
          fightDuration: fight.duration,
          bossAbilities: fight.abilities.map(a => ({
            id: nanoid(),
            time: a.time,
            spellId: a.spellId,
            spellName: a.spellName,
            hidden: false,
            color: colorForSpell(a.spellId),
          })),
        }));
      },

      toggleAbilityHidden: (id) => {
        update(set, get, p => ({
          ...p,
          bossAbilities: p.bossAbilities.map(a =>
            a.id === id ? { ...a, hidden: !a.hidden } : a
          ),
        }));
      },

      setAbilityColor: (id, color) => {
        update(set, get, p => ({
          ...p,
          bossAbilities: p.bossAbilities.map(a =>
            a.id === id ? { ...a, color } : a
          ),
        }));
      },

      addCooldownRow: (playerName, cooldownKey) => {
        if (!COOLDOWNS[cooldownKey]) return;
        update(set, get, p => ({
          ...p,
          cdRows: [...p.cdRows, {
            id: nanoid(),
            playerName,
            cooldownKey,
            placements: [],
          }],
        }));
      },

      removeCooldownRow: (rowId) => {
        update(set, get, p => ({
          ...p,
          cdRows: p.cdRows.filter(r => r.id !== rowId),
        }));
      },

      renameCooldownRowPlayer: (rowId, name) => {
        update(set, get, p => ({
          ...p,
          cdRows: p.cdRows.map(r => r.id === rowId ? { ...r, playerName: name } : r),
        }));
      },

      addPlacement: (rowId, time) => {
        update(set, get, p => ({
          ...p,
          cdRows: p.cdRows.map(r => {
            if (r.id !== rowId) return r;
            const cd = COOLDOWNS[r.cooldownKey];
            // Prevent overlapping placements (within duration)
            const overlaps = r.placements.some(pl =>
              Math.abs(pl.time - time) < (cd?.duration ?? 0)
            );
            if (overlaps) return r;
            return { ...r, placements: [...r.placements, { id: nanoid(), time }] };
          }),
        }));
      },

      removePlacement: (rowId, placementId) => {
        update(set, get, p => ({
          ...p,
          cdRows: p.cdRows.map(r =>
            r.id !== rowId ? r : { ...r, placements: r.placements.filter(pl => pl.id !== placementId) }
          ),
        }));
      },

      movePlacement: (rowId, placementId, time) => {
        update(set, get, p => ({
          ...p,
          cdRows: p.cdRows.map(r =>
            r.id !== rowId ? r : {
              ...r,
              placements: r.placements.map(pl =>
                pl.id !== placementId ? pl : { ...pl, time }
              ),
            }
          ),
        }));
      },

      updatePlacementNote: (rowId, placementId, note) => {
        update(set, get, p => ({
          ...p,
          cdRows: p.cdRows.map(r =>
            r.id !== rowId ? r : {
              ...r,
              placements: r.placements.map(pl =>
                pl.id !== placementId ? pl : { ...pl, note }
              ),
            }
          ),
        }));
      },
    }),
    { name: 'raid-planner-plan' }
  )
);

function update(
  set: (fn: (s: PlanStore) => PlanStore) => void,
  get: () => PlanStore,
  fn: (p: Plan) => Plan
) {
  set(state => {
    const next = fn(state.plan);
    next.updatedAt = Date.now();
    setPlanInURL(next);
    return { ...state, plan: next };
  });
}
