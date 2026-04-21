## Scripts
Common scripts are defined in `package.json`:

- `dev` — Start development server
- `build` — Type-check and build for production
- `lint` — Run ESLint
- `preview` — Preview production build

Add test scripts if/when tests are added.
## Testing
No test files are currently present. For future tests, use a `__tests__/` folder or colocate test files (e.g., `Component.test.tsx`) with source files.
## Type Definitions
If `src/types.ts` grows large, consider splitting types into a `src/types/` directory for better organization.

# Raid Planner

WoW raid cooldown planning tool. Import a WoW combat log, visualize boss ability timelines, and assign player cooldowns. Share plans via URL or JSON.

## Features
- Import WoW combat logs (.txt)
- Visual timeline of boss abilities and player cooldowns
- Drag-and-drop cooldown assignment
- Share plans via URL or export/import JSON
- LocalStorage persistence

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start development server:**
   ```sh
   npm run dev
   ```
3. **Build for production:**
   ```sh
   npm run build
   ```

## Project Structure
See [CLAUDE.md](CLAUDE.md) for detailed project context, stack, and architecture.

## Contributing
- Fork and clone the repo
- Create feature branches for changes
- Run `npm run lint` before submitting PRs

## License
MIT
