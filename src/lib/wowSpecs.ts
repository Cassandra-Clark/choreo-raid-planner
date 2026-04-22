export type Role = 'Tank' | 'Healer' | 'Damage';

export interface SpecInfo {
  specId: number;
  specName: string;
  className: string;
  role: Role;
  iconName: string;
  color: string; // WoW class color
}

// WoW class colors (standard)
export const CLASS_COLORS: Record<string, string> = {
  Warrior:     '#C69B3A',
  Paladin:     '#F48CBA',
  Hunter:      '#AAD372',
  Rogue:       '#FFF468',
  Priest:      '#FFFFFF',
  DeathKnight: '#C41E3A',
  Shaman:      '#0070DD',
  Mage:        '#3FC7EB',
  Warlock:     '#8788EE',
  Monk:        '#00FF98',
  Druid:       '#FF7C0A',
  DemonHunter: '#A330C9',
  Evoker:      '#33937F',
  NPC:         '#F97316',
};

export const SPECS: Record<number, SpecInfo> = {
  // Warrior
  71:   { specId: 71,   specName: 'Arms',          className: 'Warrior',     role: 'Damage', iconName: 'ability_warrior_savageblow',           color: CLASS_COLORS.Warrior },
  72:   { specId: 72,   specName: 'Fury',           className: 'Warrior',     role: 'Damage', iconName: 'ability_warrior_innerrage',            color: CLASS_COLORS.Warrior },
  73:   { specId: 73,   specName: 'Protection',     className: 'Warrior',     role: 'Tank',   iconName: 'ability_warrior_defensivestance',      color: CLASS_COLORS.Warrior },
  // Paladin
  65:   { specId: 65,   specName: 'Holy',           className: 'Paladin',     role: 'Healer', iconName: 'spell_holy_holybolt',                  color: CLASS_COLORS.Paladin },
  66:   { specId: 66,   specName: 'Protection',     className: 'Paladin',     role: 'Tank',   iconName: 'ability_paladin_shieldofthetemplar',   color: CLASS_COLORS.Paladin },
  70:   { specId: 70,   specName: 'Retribution',    className: 'Paladin',     role: 'Damage', iconName: 'spell_holy_auraoflight',               color: CLASS_COLORS.Paladin },
  // Hunter
  253:  { specId: 253,  specName: 'Beast Mastery',  className: 'Hunter',      role: 'Damage', iconName: 'ability_hunter_bestialdiscipline',     color: CLASS_COLORS.Hunter },
  254:  { specId: 254,  specName: 'Marksmanship',   className: 'Hunter',      role: 'Damage', iconName: 'ability_hunter_focusedaim',            color: CLASS_COLORS.Hunter },
  255:  { specId: 255,  specName: 'Survival',       className: 'Hunter',      role: 'Damage', iconName: 'ability_hunter_camouflage',            color: CLASS_COLORS.Hunter },
  // Rogue
  259:  { specId: 259,  specName: 'Assassination',  className: 'Rogue',       role: 'Damage', iconName: 'ability_rogue_deadlybrew',             color: CLASS_COLORS.Rogue },
  260:  { specId: 260,  specName: 'Outlaw',         className: 'Rogue',       role: 'Damage', iconName: 'ability_rogue_waylay',                 color: CLASS_COLORS.Rogue },
  261:  { specId: 261,  specName: 'Subtlety',       className: 'Rogue',       role: 'Damage', iconName: 'ability_stealth',                      color: CLASS_COLORS.Rogue },
  // Priest
  256:  { specId: 256,  specName: 'Discipline',     className: 'Priest',      role: 'Healer', iconName: 'spell_holy_powerwordshield',           color: CLASS_COLORS.Priest },
  257:  { specId: 257,  specName: 'Holy',           className: 'Priest',      role: 'Healer', iconName: 'spell_holy_guardianspirit',            color: CLASS_COLORS.Priest },
  258:  { specId: 258,  specName: 'Shadow',         className: 'Priest',      role: 'Damage', iconName: 'spell_shadow_shadowwordpain',          color: CLASS_COLORS.Priest },
  // Death Knight
  250:  { specId: 250,  specName: 'Blood',          className: 'DeathKnight', role: 'Tank',   iconName: 'spell_deathknight_bloodpresence',      color: CLASS_COLORS.DeathKnight },
  251:  { specId: 251,  specName: 'Frost',          className: 'DeathKnight', role: 'Damage', iconName: 'spell_deathknight_frostpresence',      color: CLASS_COLORS.DeathKnight },
  252:  { specId: 252,  specName: 'Unholy',         className: 'DeathKnight', role: 'Damage', iconName: 'spell_deathknight_unholypresence',     color: CLASS_COLORS.DeathKnight },
  // Shaman
  262:  { specId: 262,  specName: 'Elemental',      className: 'Shaman',      role: 'Damage', iconName: 'spell_nature_lightning',               color: CLASS_COLORS.Shaman },
  263:  { specId: 263,  specName: 'Enhancement',    className: 'Shaman',      role: 'Damage', iconName: 'spell_shaman_improvedstormstrike',     color: CLASS_COLORS.Shaman },
  264:  { specId: 264,  specName: 'Restoration',    className: 'Shaman',      role: 'Healer', iconName: 'spell_nature_magicimmunity',           color: CLASS_COLORS.Shaman },
  // Mage
  62:   { specId: 62,   specName: 'Arcane',         className: 'Mage',        role: 'Damage', iconName: 'spell_holy_magicalsentry',             color: CLASS_COLORS.Mage },
  63:   { specId: 63,   specName: 'Fire',           className: 'Mage',        role: 'Damage', iconName: 'spell_fire_firebolt02',                color: CLASS_COLORS.Mage },
  64:   { specId: 64,   specName: 'Frost',          className: 'Mage',        role: 'Damage', iconName: 'spell_frost_frostbolt02',              color: CLASS_COLORS.Mage },
  // Warlock
  265:  { specId: 265,  specName: 'Affliction',     className: 'Warlock',     role: 'Damage', iconName: 'spell_shadow_deathcoil',               color: CLASS_COLORS.Warlock },
  266:  { specId: 266,  specName: 'Demonology',     className: 'Warlock',     role: 'Damage', iconName: 'spell_shadow_metamorphosis',           color: CLASS_COLORS.Warlock },
  267:  { specId: 267,  specName: 'Destruction',    className: 'Warlock',     role: 'Damage', iconName: 'spell_shadow_rainoffire',              color: CLASS_COLORS.Warlock },
  // Monk
  268:  { specId: 268,  specName: 'Brewmaster',     className: 'Monk',        role: 'Tank',   iconName: 'spell_monk_brewmaster_spec',           color: CLASS_COLORS.Monk },
  269:  { specId: 269,  specName: 'Windwalker',     className: 'Monk',        role: 'Damage', iconName: 'spell_monk_windwalker_spec',           color: CLASS_COLORS.Monk },
  270:  { specId: 270,  specName: 'Mistweaver',     className: 'Monk',        role: 'Healer', iconName: 'spell_monk_mistweaver_spec',           color: CLASS_COLORS.Monk },
  // Druid
  102:  { specId: 102,  specName: 'Balance',        className: 'Druid',       role: 'Damage', iconName: 'spell_nature_starfall',                color: CLASS_COLORS.Druid },
  103:  { specId: 103,  specName: 'Feral',          className: 'Druid',       role: 'Damage', iconName: 'ability_druid_catform',                color: CLASS_COLORS.Druid },
  104:  { specId: 104,  specName: 'Guardian',       className: 'Druid',       role: 'Tank',   iconName: 'ability_racial_bearform',              color: CLASS_COLORS.Druid },
  105:  { specId: 105,  specName: 'Restoration',    className: 'Druid',       role: 'Healer', iconName: 'spell_nature_healingtouch',            color: CLASS_COLORS.Druid },
  // Demon Hunter
  577:  { specId: 577,  specName: 'Havoc',          className: 'DemonHunter', role: 'Damage', iconName: 'ability_demonhunter_specdps',          color: CLASS_COLORS.DemonHunter },
  581:  { specId: 581,  specName: 'Vengeance',      className: 'DemonHunter', role: 'Tank',   iconName: 'ability_demonhunter_spectank',         color: CLASS_COLORS.DemonHunter },
  // Evoker
  1467: { specId: 1467, specName: 'Devastation',    className: 'Evoker',      role: 'Damage', iconName: 'classicon_evoker_devastation',         color: CLASS_COLORS.Evoker },
  1468: { specId: 1468, specName: 'Preservation',   className: 'Evoker',      role: 'Healer', iconName: 'classicon_evoker_preservation',        color: CLASS_COLORS.Evoker },
  1473: { specId: 1473, specName: 'Augmentation',   className: 'Evoker',      role: 'Damage', iconName: 'classicon_evoker_augmentation',        color: CLASS_COLORS.Evoker },
};

export function specIconUrl(iconName: string): string {
  return `https://wow.zamimg.com/images/wow/icons/medium/${iconName}.jpg`;
}

export function spellIconUrl(iconName: string, size: 'small' | 'medium' = 'small'): string {
  return `https://wow.zamimg.com/images/wow/icons/${size}/${iconName}.jpg`;
}
