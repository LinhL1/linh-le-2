# Tools and dependencies

Every tool involved in building this project, by category, with evidence. "Evidence" says how we
know it's used, so nothing here is assumed from habit.

## Development

| Tool | What it is | Why / how it's used | Evidence |
|---|---|---|---|
| **VS Code** | editor | day-to-day editing; Claude Code runs inside it | current Claude Code session runs in the VS Code extension; `.gitignore` keeps `.vscode/extensions.json` |
| **Terminal** (Windows PowerShell / Git Bash) | shell | running npm scripts and git | Windows 11 dev machine |
| **Node.js + npm** | runtime + package manager | `npm install`, `npm run …` | `package-lock.json` is current and contains the 3D packages; `node_modules/.package-lock.json` exists |
| **Bun** | alternative package manager | used early on (April 2026), not since | `bun.lock`/`bun.lockb` dated 2026-04-01 and missing `three`/R3F, so stale |
| **Git + GitHub** | version control + hosting | feature branches (`about-me`, `postcard`, `projects`, `site-loader`, `visuals`…) pushed to `origin` | `git branch -a`, remote `github.com/LinhL1/linh-le-2` |

## Frameworks and libraries

See [TECH_STACK.md](TECH_STACK.md) for how each is used. Grouped:

| Group | Packages |
|---|---|
| Core | `react`, `react-dom`, `react-router-dom`, `typescript` |
| 3D | `three`, `@react-three/fiber`, `@react-three/drei` (+ transitive `three-stdlib`), `@types/three` |
| Styling | `tailwindcss`, `tailwindcss-animate`, `@tailwindcss/typography`, `postcss`, `autoprefixer`, `tailwind-merge`, `clsx`, `class-variance-authority` |
| UI | `@radix-ui/*`, shadcn/ui (generated into `src/components/ui`), `lucide-react`, `sonner` |
| Animation | `framer-motion` |
| Integrations | `@emailjs/browser` |
| Template leftovers | `@tanstack/react-query`, `recharts`, `embla-carousel-react`, `react-hook-form`, `zod`, `cmdk`, `vaul`, `input-otp`, `react-day-picker`, `date-fns`, `react-resizable-panels`, `next-themes` |

## 3D tools

| Tool | Status |
|---|---|
| Blender / any modelling tool | **not used**: no model files; the computer is built in code (CONFIRMED, CREDITS.md) |
| glTF pipeline (gltf-transform, Draco, KTX2) | **not used** today; `useGLTF` path is ready if a `.glb` is added |
| Texture tools | **not used**: night-city textures are painted on `<canvas>` at runtime |
| Fonts as UI in 3D | none; all text on the monitor is real DOM text |

## Design tools

| Tool | Status |
|---|---|
| Figma | UNKNOWN for this project. Figma appears in the profile's tool list (`src/data/profile.ts`) and as a recommendation in `hiw.md`, but no design files or links are in the repo. |
| Fonts | ZT Bros Oskon 90s (bundled `.otf`), Tahoma/Verdana (system fonts, retro desktop), Source Serif 4, Inter, Silkscreen, VT323 (Google Fonts). Licences in [CREDITS.md](../CREDITS.md). |
| Pixel icons | hand-authored as 16×16 character grids in `src/retro/desktop/pixelIcons.ts` |

## AI tools

| Tool | What it is | Evidence |
|---|---|---|
| **Lovable** | AI app builder that scaffolds Vite + React + shadcn projects | package name `vite_react_shadcn_ts`, `lovable-tagger` dev plugin, Lovable Playwright config, `index.html` meta `author: Lovable`, comment `ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL` |
| **Claude Code** | AI coding agent | `.claude/settings.json` in the parent folder; this documentation |

Which commits or features were AI-assisted isn't recorded (UNKNOWN).

## Testing and debugging

| Tool | Use | Command / place |
|---|---|---|
| Vitest | unit + component tests (jsdom) | `npm test`, `npm run test:watch` |
| Testing Library + jest-dom | DOM queries and matchers | `src/test/**` |
| TypeScript compiler | type checking (no npm script) | `npx tsc -p tsconfig.app.json --noEmit` |
| ESLint | linting | `npm run lint` |
| Playwright | e2e (configured, not runnable as-is) | `playwright.config.ts` imports an uninstalled package |
| Browser DevTools | DOM, performance, WebGL debugging | see [DEBUGGING.md](DEBUGGING.md) |

Useful additions for 3D debugging that are **not installed**: `r3f-perf` or drei's `<Stats />`/`<Perf>`-style overlays,
the [Spector.js](https://spector.babylonjs.com/) WebGL frame capture extension, and the three.js DevTools extension.

## Deployment

| Tool | Status |
|---|---|
| `vite build` | produces `dist/` (static files) |
| `gh-pages` (npm package) | installed; no script calls it; no `gh-pages` branch exists on `origin` |
| Hosting | **UNKNOWN**: see [UNKNOWN.md](UNKNOWN.md#deployment-target) |
