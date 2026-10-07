# Development notes

Potential problems found while documenting. **None of these were changed**: the documentation
task didn't modify application code. Each entry: issue · evidence · potential impact · suggested investigation.

Severity: 🔴 likely user-visible · 🟠 developer-facing / could bite · 🟢 housekeeping.

---

### 🔴 1. Deployment base path doesn't match the declared homepage
- **Evidence:** `package.json` `"homepage": "https://LinhL1.github.io/linh-le"` (a subpath), but `vite.config.ts` sets no `base`, `BrowserRouter` has no `basename`, and the built `dist/index.html` references `/assets/...` (root-absolute). The git remote is `linh-le-2` (which would be `/linh-le-2` on GitHub Pages), and there's no `gh-pages` branch on `origin`.
- **Impact:** if the site is served from a subpath, JS/CSS 404 and routes don't match (blank page). Separately, deep links like `/classic` 404 on any static host without an SPA fallback.
- **Investigate:** confirm where the live site is hosted. If at a domain root (custom domain, Vercel/Netlify, Lovable hosting), remove/update `homepage`. If GitHub Pages under a subpath, add `base` in Vite **and** `basename` on the router, and add a `404.html` SPA fallback.

### 🔴 2. Multi-megabyte images
- **Evidence:** see [PERFORMANCE.md → confirmed issues](PERFORMANCE.md#confirmed-issues): 6.4 MB + 3.5 MB envelope PNGs in a 208×176 box; 1.6 MB `me.jpg` shown at 104×128 in the retro About window.
- **Impact:** slow loads, high mobile data use.
- **Investigate:** convert to WebP/AVIF at display size; measure with Lighthouse before/after.

### 🟠 3. `npm run lint` fails
- **Evidence:** 3 errors: `src/components/ui/command.tsx:24` and `ui/textarea.tsx:5` (`@typescript-eslint/no-empty-object-type`), `tailwind.config.ts:90` (`no-require-imports`); plus 7 `react-refresh/only-export-components` warnings in `ui/*`. App code is clean.
- **Impact:** a lint step in CI would fail; real lint errors get lost in the noise.
- **Investigate:** fix the three generated-file errors or ignore `src/components/ui` in `eslint.config.js`.

### 🟠 4. Playwright configured but unusable
- **Evidence:** `playwright.config.ts` imports `lovable-agent-playwright-config/config`, which isn't installed; no e2e spec files exist; `playwright-fixture.ts` exists.
- **Impact:** `npx playwright test` fails; the 3D experience has no automated coverage at all.
- **Investigate:** either remove the Playwright files/dependency, or replace the config with a plain `defineConfig` and add a smoke test (load `/?mode=2d`, open a window; load `/` and check the canvas mounts).
  The `playwright` *library* does work: a plain Node script with `chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })` can screenshot both 2D and the zoomed-in 3D scene (used on 2026-10-06 to check the desktop font).

### 🟠 5. Three lockfiles, two package managers
- **Evidence:** `package-lock.json` (current, includes three/R3F), `bun.lock` + `bun.lockb` (dated 2026-04-01, no `three`).
- **Impact:** `bun install` would install from an out-of-date lockfile; confusing for contributors/tools.
- **Investigate:** confirm npm is the intended manager, then delete the bun lockfiles (or regenerate them if bun is preferred).

### 🟠 6. TypeScript is non-strict
- **Evidence:** `tsconfig.app.json` `strict: false`, `noImplicitAny: false`; `tsconfig.json` `strictNullChecks: false`.
- **Impact:** null/undefined bugs aren't caught (e.g. `Postcard.tsx` uses an untyped `useRef(null)` and reads `.offsetHeight`).
- **Investigate:** try `strictNullChecks: true` and count errors; the `src/retro/` code looks written to pass it.

### 🟠 7. `hiw.md` partly out of date
- **Evidence:** §3 lists `background.png` (now `.webp`) and an old component list; §9/§15 show only `/` and `*` routes and say `ProjectsSection` implements the card stack (now `ProjectCarousel`); §12.4 describes a `MutationObserver` swapping the hero image, which `HeroSection` replaced with CSS `dark:` classes; §16 describes a gh-pages deploy that doesn't match the repo (issue 1).
- **Impact:** misleading for future you and for AI agents.
- **Investigate:** a banner pointing to `docs/` was added at the top of `hiw.md`; update or trim the stale sections when convenient.

### 🟠 8. Idle camera framing is computed once
- **Evidence:** `RetroScene.tsx` `initialCamera = useMemo(() => idleCameraPosition(window.innerWidth / window.innerHeight), [])`. The zoomed pose re-fits on resize; the idle pose doesn't.
- **Impact:** after resizing (e.g. from wide to tall), the idle desk may be cropped until reload.
- **Investigate:** resize while idle and look; if it matters, recompute the distance along the current orbit direction on resize.

### 🟠 9. Classic carousel captures the mouse wheel
- **Evidence:** `ProjectCarousel.tsx` `onWheel` always calls `e.preventDefault()`, including at the last card.
- **Impact:** with the cursor over the card stack, the page can't be scrolled with the wheel; the visitor must move the pointer off it.
- **Investigate:** only `preventDefault` when the carousel actually advances.

### 🟢 10. Undeclared type dependency
- **Evidence:** `CameraRig.tsx` `import type { OrbitControls } from "three-stdlib"`; `three-stdlib` isn't in `package.json` (it comes via drei).
- **Impact:** type-only, erased at build; would break typechecking if drei stopped depending on it.
- **Investigate:** add `three-stdlib` to devDependencies or type the controls via drei's exports.

### 🟢 11. Template leftovers
- **Evidence:** unused `src/App.css`; ~45 unused shadcn components and their dependencies; `QueryClientProvider` with no queries; `next-themes` without a provider; `index.html` meta `description: "Lovable Generated Project"`, `author: "Lovable"`, a `TODO: Update og:title` comment; unused `src/assets/me1.jpg`, `me2.jpg`, `me3.jpg` (~6 MB in the repo).
- **Impact:** noise, install time, wrong link-preview metadata (`description`) when the site is shared.
- **Investigate:** update `index.html` meta; prune when convenient.

### 🟢 12. Fragile cross-file content links
- **Evidence:** `security.ts` resolves highlights by exact strings from `experience.ts`/`projects.ts`; a test pins the list. There's also a `TODO(linh)` there for certifications/CTFs/target role.
- **Impact:** renaming an entry drops the highlight (the test will catch it).

### 🟢 13. Contact postcard error UX
- **Evidence:** `Postcard.tsx` uses `alert()` on failure and `console.error`.
- **Impact:** jarring on failure; fine functionally.

### 🟢 14. Stray files
- **Evidence:** `linh-le/.next/dev/logs` (a Next.js dev folder in a Vite project), `.claude/settings.json` allows `node zoom_check.mjs` but no such script exists.
- **Impact:** none at runtime. See [UNKNOWN.md](UNKNOWN.md).

### 🟢 15. 2D exit × can cover a window's close button
- **Evidence:** `.retro-desktop__exit` (2D only) is pinned top-right above all windows (`z-index: 99999`); windows can be dragged under it.
- **Impact:** a window pushed into the top-right corner has its own × hidden behind the exit ×; Esc or dragging it away still works.

### 🟢 16. Desktop font varies by platform
- **Evidence:** `--r-win` is a system-font stack (Tahoma, Verdana, DejaVu Sans…); nothing is bundled.
- **Impact:** Windows/macOS show Tahoma; iOS shows Verdana (wider, so lines wrap sooner); Android shows its default sans. Layout tolerates it, but the look isn't identical everywhere.

### 🟢 17. 3D wheel scrolling is reimplemented, touch scrolling isn't
- **Evidence:** `Desktop` handles `wheel` itself in 3D (Chromium can't scroll inside drei's preserve-3d layer). It moves `scrollTop` instantly (no smooth scrolling) and only vertically.
- **Impact:** wheel/trackpad work; horizontal scrolling and touch-drag scrolling inside 3D windows don't. 3D is only offered on ≥900×600 viewports, so touch is mostly tablets.
