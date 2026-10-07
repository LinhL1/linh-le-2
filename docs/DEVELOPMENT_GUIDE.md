# Development guide

All commands run from the repository folder `linh-le/`. Every command below exists in
`package.json` or was run successfully on 2026-10-05; none are invented.

## Install

```bash
npm install
```
Use **npm**. `package-lock.json` is the up-to-date lockfile; the `bun.lock*` files are stale
(they predate the 3D packages). See [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md).

## Run locally

```bash
npm run dev          # Vite dev server on http://localhost:8080 (listens on all interfaces, "::")
```

| URL | What you get |
|---|---|
| `http://localhost:8080/` | retro desktop: 3D if your window is ≥ 900×600 and WebGL works |
| `http://localhost:8080/?mode=2d` | force the flat desktop (saved choice is ignored) |
| `http://localhost:8080/?mode=3d` | force 3D even with reduced motion or a small window (not without WebGL) |
| `http://localhost:8080/classic` | classic editorial site |
| `http://localhost:8080/projects` | all projects |

Clicking "2D mode"/"3D view" (or the 2D corner × / Esc) stores the choice in `localStorage["retro-mode"]`. To reset:
DevTools → Application → Local Storage → delete `retro-mode`, or run `localStorage.removeItem("retro-mode")`.

Hot reload: edits to scene components hot-swap without losing the page. `useMemo` factories (geometries, textures)
re-run on save, so procedural changes show up immediately.

## Test

```bash
npm test             # vitest run (one-off)       → 5 files, 34 tests, all passing on 2026-10-05
npm run test:watch   # vitest in watch mode
```
3D rendering isn't covered by tests (jsdom has no WebGL). For scene changes, check in a browser:
orbit, hover cursor, click-to-zoom, Power off/Esc, window dragging while zoomed, 2D fallback.

## Typecheck

There's no npm script for it. Run:
```bash
npx tsc -p tsconfig.app.json --noEmit     # passes on 2026-10-05
```
TS is non-strict, so a passing typecheck doesn't rule out null/undefined bugs.

## Lint

```bash
npm run lint         # eslint .
```
Currently **exits with errors**: 3 errors, 7 warnings, all in generated shadcn files
(`ui/command.tsx`, `ui/textarea.tsx`) and `tailwind.config.ts`. Application code is clean. Details in
[DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md).

## Build and preview

```bash
npm run build        # production build → dist/
npm run build:dev    # development-mode build (enables lovable-tagger)
npm run preview      # serve dist/ locally to check the production build
```
The 3D code is split into its own lazy chunk (`dist/assets/RetroScene-*.js`).

## Deploy

**Not documented in the repo** (see [UNKNOWN.md](UNKNOWN.md#deployment-target)). What's known:
- `dist/` is a static site. Any static host works.
- The build uses root-absolute asset paths (`/assets/...`) because `vite.config.ts` has no `base`.
  So it must be served from a **domain root** unless you add `base` (and a router `basename`).
- Client-side routes (`/classic`, `/projects`) need the host to serve `index.html` for unknown paths
  ("SPA fallback"), otherwise a refresh on those URLs gives a 404.
- `hiw.md` describes `npm run build && npx gh-pages -d dist`, but there's no `gh-pages` branch on
  `origin` and the `homepage` subpath doesn't match the build config. Treat that section as historical.

## Environment variables

None are used. The only `import.meta.env` reference is `BASE_URL` in the commented GLB example.
EmailJS IDs are hard-coded in `src/components/Postcard.tsx` (public by design). There is no `.env`
file or `.env.example`. If you add one, use the `VITE_` prefix (only those are exposed to client code).

## Asset workflow

| Asset | Where to put it | How it's used |
|---|---|---|
| Project/event images | `src/assets/projects/`, `src/assets/events/` | `import` in `src/data/*.ts` → hashed URL |
| Photos, backgrounds | `src/assets/` | `import` in the component |
| Fonts | `src/assets/fonts/` + `@font-face` in `index.css`, or Google Fonts `@import` at the top of `index.css` | CSS |
| 3D model (optional) | `public/models/*.glb` | URL `${import.meta.env.BASE_URL}models/x.glb` in `model.config.ts` |
| Files served verbatim | `public/` | site root |

**Compress images before adding them.** Vite copies them as-is (no resizing or recompression). Several
current images are multi-megabyte. See [PERFORMANCE.md](PERFORMANCE.md).

For a `.glb`: optimise it first (e.g. `npx @gltf-transform/cli optimize in.glb out.glb`; this tool is not
installed in the project), keep it small (aim for < 2–3 MB), and credit it in `CREDITS.md` (CC-BY needs visible credit on the site).

## Git workflow (as practised)

- `main` is the default branch on `origin`. Work happens on topic branches named after the feature
  (`about-me`, `postcard`, `project-cards`, `site-loader`, `visuals`, …), which are pushed to `origin`.
- Commit messages are short and lowercase ("night backdrop", "3d update v1").
- Before risky 3D changes, commit first. Scene tweaks are easy to lose track of.

## Safe-change checklist

1. Read the relevant doc ([CHANGE_GUIDE.md](CHANGE_GUIDE.md) maps tasks → files).
2. Make the change.
3. `npm test` and `npx tsc -p tsconfig.app.json --noEmit`.
4. Browser check of `/` in 3D **and** `?mode=2d`, and `/classic` if shared data changed.
5. Update docs (see [CLAUDE.md](../CLAUDE.md) → Documentation Requirements).
