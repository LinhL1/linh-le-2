# CLAUDE.md

Personal portfolio (Vite + React 18 + TypeScript, frontend-only). `/` is a 3D retro computer
(three.js via React Three Fiber v8 + drei v9) whose monitor runs a real React desktop ("LINH-OS");
it falls back to a flat 2D desktop. `/classic` is the editorial site, `/projects` lists projects.
Content lives in `src/data/`. Full docs: [docs/README.md](docs/README.md).

## Commands
- `npm install` (npm is the package manager; ignore the stale `bun.lock*`)
- `npm run dev` → http://localhost:8080 (`/?mode=2d` or `/?mode=3d` forces a mode)
- `npm test` (Vitest, jsdom; no 3D coverage) · `npx tsc -p tsconfig.app.json --noEmit` (typecheck)
- `npm run lint` (currently fails on 3 pre-existing errors in generated files; see docs/DEVELOPMENT_NOTES.md)
- `npm run build` / `npm run preview`

## Invariants for the 3D scene (read before touching `src/retro/scene/`)
- `ACTIVE_SCREEN` in `model.config.ts` is the single source of truth for the screen: it drives the
  DOM desktop placement, camera zoom, CRT glow and the procedural bezel. Move the screen there, not piecemeal.
- Never place a mesh face at the screen plane's depth: it z-fights with drei `Html`'s transparent hole.
- `frameloop="demand"`: any per-frame or imperative change must call `invalidate()`.
- Per-frame work goes in `useFrame` with refs. Never `setState` per frame.
- `CameraRig` must keep OrbitControls disabled during transitions (it clamps the head-on pose otherwise).
- The desktop inside drei `<Html>` is a separate React root: no router/app context. Use `useDesktopContext()`.
- Keep `onComputerClick`'s `e.delta > 6` (drag) and `zoomed` guards.
- Dispose geometries/materials/textures created with `new` (use `useDisposable` or a cleanup effect).
- Every change must keep `?mode=2d` and keyboard access ("Turn on the computer", Esc) working.

## Documentation Requirements

This project maintains living technical documentation under `/docs` (index: `docs/README.md`).

Before modifying architecture or significant functionality:
- Read the relevant docs (`docs/CHANGE_GUIDE.md` maps tasks to files and docs).
- Understand the existing implementation by reading the source, not only the docs.
- Preserve documented architectural patterns (see `docs/DECISIONS.md`) unless intentionally changing them.

After changes, in the same piece of work:
- Update affected documentation. If code and docs disagree, the code wins and the docs get fixed.
- Update `docs/3D_GUIDE.md`, `docs/3D_ARCHITECTURE.md` and/or `docs/INTERACTION_GUIDE.md` when 3D behaviour, rendering,
  interaction, assets, camera, scene structure, animation, lighting or spatial logic changes.
- Update Mermaid diagrams (`ARCHITECTURE.md`, `DATA_FLOW.md`, `3D_ARCHITECTURE.md`) when architecture or flows change.
- Update `docs/TECH_STACK.md` and `docs/TOOLS_AND_DEPENDENCIES.md` when dependencies or tools change.
- Add an entry to `docs/DECISIONS.md` for significant architectural decisions (use its template; never present an inference as fact).
- Update `docs/UNKNOWN.md` when an assumption is confirmed or a new unknown appears.
- Add to `docs/DEVELOPMENT_NOTES.md` any problem noticed but not fixed; remove entries that get fixed.
- If the change introduces a concept the developer may not know (new 3D technique, library API), explain it in
  `docs/3D_GUIDE.md` using its concept format (what / why / how / where / example / mental model / related).
- Bump the "Last full audit" line in `docs/README.md` only after a full re-audit, not after a partial edit.

Never claim documentation is complete if important implementation details remain unexplored.
The developer is new to 3D: explain *why* before *what*, and link docs to real files.
