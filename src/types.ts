export interface BossAbility {
  id: string;
  time: number; // seconds from pull
  spellId: number;
  spellName: string;
  hidden: boolean;
  color: string;
  phase?: string;
}

export interface CooldownPlacement {
  id: string;
  time: number; // seconds from pull
  note?: string;
}

export interface CooldownRow {
  id: string;
  playerName: string;
  cooldownKey: string; // key into COOLDOWNS map
  placements: CooldownPlacement[];
}

export interface Plan {
  id: string;
  name: string;
  bossName: string;
  fightDuration: number; // seconds
  bossAbilities: BossAbility[];
  cdRows: CooldownRow[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface ParsedFight {
  bossName: string;
  encounterId: number;
  duration: number;
  abilities: Omit<BossAbility, 'id' | 'hidden' | 'color'>[];
}

export interface PositionSample {
  t: number;      // seconds from pull
  x: number;
  y: number;
  facing: number; // radians
}

export interface ReplayUnit {
  guid: string;
  name: string;
  isPlayer: boolean;
  specId?: number;
  positions: PositionSample[];
  deathTimes: number[];
}

export interface ReplayData {
  units: ReplayUnit[];
  duration: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}
