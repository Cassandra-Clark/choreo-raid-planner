# Raid Planner — Project Context

## What this is
A WoW raid cooldown planning tool, similar to raidstrats.gg/planner. Users import a WoW combat log to get a boss ability timeline, then manually assign player utility cooldowns on top of it. Plans can be shared via URL hash or exported/imported as JSON.

## Stack
- Vite + React + TypeScript
- Tailwind CSS (via `@tailwindcss/vite`)
- Zustand (with localStorage persistence)
- lz-string (URL hash sharing)
- Dev server: `http://localhost:5273`

## Project structure
```
src/
  types.ts                 — Plan, BossAbility, CooldownRow, CooldownPlacement, ParsedFight
  lib/
    logParser.ts           — Parses WoW combat log .txt files
    cooldowns.ts           — COOLDOWNS map, CLASS_COLORS, CooldownDef type
    sharing.ts             — URL hash encode/decode, JSON export/import
    nanoid.ts              — Simple ID generator
  store/
    planStore.ts           — Zustand store, all plan mutations, auto-syncs to URL hash
  components/
    Header.tsx             — Plan name, boss name, duration, share/export/import buttons
    Sidebar.tsx            — Log import, cooldown palette, boss ability list
    Timeline.tsx           — Ruler, boss lane, CD rows with click-to-place/drag/right-click-remove
  App.tsx                  — Root layout, loads plan from URL hash on mount
```

## Log parsing
- Format: `M/D/YYYY HH:MM:SS.ms±tz  EVENT,fields...`
- NPC detection: source GUID prefixed with `Creature-` or `Vehicle-`
- Captures `SPELL_CAST_START` from NPC sources between `ENCOUNTER_START` / `ENCOUNTER_END`
- Smoothing: deduplicates same spellId within 2s; drops abilities averaging less than 8s between casts (spam filter)
- Player source flag is `0x514` / `0x511` / `0x512`; NPC source is `0x2114` etc. — GUID prefix is the reliable check

## Timeline interaction
- Click on a CD row → place cooldown at that time
- Right-click a placement → remove it
- Drag a placement → move it
- Click a boss ability marker → toggle visibility
- 8px per second scale

## Sharing
- URL hash auto-updates on every plan mutation (LZ-string compressed JSON)
- "Share Link" button copies current URL
- JSON export downloads a `.json` file; JSON import loads it and updates the URL hash
- Plan also persists to localStorage under key `raid-planner-plan`

## Cooldown library
Defined in `src/lib/cooldowns.ts`. Covers: Rallying Cry, Aura Mastery, BoP, BoS, Barrier, Pain Suppression, Guardian Spirit, Grip, Power Infusion, AMZ, Spirit Link, Bloodlust/Heroism/Time Warp, Tranquility, Innervate, Revival, Darkness, Rewind, Dream Breath, Demonic Gateway.

To add a new cooldown: add an entry to the `COOLDOWNS` object with `key, name, spellId, duration, cooldown, class, color, category`.

## Known limitations / future work
- No WCL API integration — log must be a local .txt file
- No phase labels on the timeline (planned)
- No notes per boss ability
- No undo/redo
- Cooldown overlap prevention only checks duration, not cooldown recharge
