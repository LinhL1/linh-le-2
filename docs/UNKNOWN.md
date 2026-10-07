# Known, inferred and unknown

A ledger of things where the implementation is clear but the *reason*, *history* or *external
context* may not be. Update it when something gets confirmed, and remove TODOs when done.

Labels: **CONFIRMED** (evidence in repo/library source) · **INFERRED** (reasonable reading, not
stated anywhere) · **UNKNOWN** (can't be determined from the repo) · **TODO** (known open task).

## Deployment target
- **UNKNOWN:** where the live site is hosted. `homepage` says `LinhL1.github.io/linh-le`, the remote is `linh-le-2`, the build has no `base`, no router `basename`, no `gh-pages` branch on `origin`, and no deploy script. `hiw.md` describes a gh-pages flow that doesn't match. → [DEVELOPMENT_NOTES #1](DEVELOPMENT_NOTES.md)
- **UNKNOWN:** whether the host provides an SPA fallback for `/classic` and `/projects`.

## Project origin and tools
- **CONFIRMED:** scaffolded with Lovable (package name `vite_react_shadcn_ts`, `lovable-tagger`, Lovable Playwright preset, `index.html` meta).
- **CONFIRMED:** Claude Code has been used in this workspace (`.claude/settings.json`).
- **UNKNOWN:** which features were written by hand vs with AI assistance.
- **UNKNOWN:** whether Figma or another design tool was used for this site.
- **INFERRED:** npm is the current package manager (current `package-lock.json`, stale bun lockfiles).

## 3D scene
- **CONFIRMED:** no external 3D or texture assets are loaded by default; everything is procedural.
- **CONFIRMED:** clicks on the screen area reach the computer group via drei's occlusion plane (drei `Html.js` source).
- **CONFIRMED:** OrbitControls must be disabled during camera transitions or it clamps the zoomed pose (drei `OrbitControls.js` + `maxPolarAngle 1.42 < π/2`).
- **INFERRED:** R3F v8/drei v9 were chosen (or kept) because the app is on React 18.
- **INFERRED:** `isolation: isolate` on `.retro-scene` exists to keep drei's behind-the-canvas HTML layer above the page background.
- **INFERRED:** the `eventPrefix="client"` setup relies on the scene filling the viewport from the top-left.
- **INFERRED:** fov 35° was chosen for a flatter, product-shot look.
- **UNKNOWN:** the real-world meaning of 1 world unit (no stated scale).
- **UNKNOWN:** why specific numeric constants were chosen (orbit limits, `FILL`, easing rate 5.5, 6 px drag threshold) beyond "they look/feel right". Treat them as tuned values.
- **UNKNOWN:** whether the GLB path in `GlbComputer.tsx` has ever been exercised with a real model. No model is in the repo.
- **UNKNOWN:** what `zoom_check.mjs` (allowed in `.claude/settings.json`) was. It's not in the repo; possibly an ad-hoc script used while tuning the camera zoom (speculative).

## Classic site and app
- **CONFIRMED:** TanStack Query provider is mounted but unused.
- **INFERRED:** unused shadcn components/dependencies are template leftovers.
- **INFERRED:** the fixed loader durations (2.1 s / 4.6 s) are intentional presentation, not a loading mechanism.
- **UNKNOWN:** why `.next/dev/logs` exists in a Vite project.
- **UNKNOWN:** whether making the retro desktop the default `/` (over the classic site) is meant to be permanent.
- **UNKNOWN:** whether `/classic` and `/projects` should be deleted outright now that nothing on `/` links to them, and whether the unused `navigate` plumbing in `DesktopContext` should go too.

## Content TODOs
- **TODO (from code):** `src/data/security.ts`: "add anything not yet in the repo — certifications, CTFs/labs, security coursework or tools you've used, and a sentence on what kind of security role you're aiming for."
- **TODO:** `index.html`: `<!-- TODO: Update og:title to match your application name -->`, and the meta description still says "Lovable Generated Project".
- **TODO:** decide on the deployment target and fix `homepage`/`base` accordingly.

## Documentation gaps
- **TODO:** the classic site's components were reviewed at a summary level; `hiw.md` remains the deep reference for them and is partly stale.
- **TODO:** no runtime profiling was done; performance risks in [PERFORMANCE.md](PERFORMANCE.md) are unmeasured.
