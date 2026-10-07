# Decision log

Architectural decisions visible in the codebase. Where the *reason* is written down (code comment,
doc, commit), the source is cited. Otherwise: **"Reasoning not documented; inferred from implementation."**
Nothing below claims historical intent without evidence.

Add new decisions at the bottom using the same template.

---

## Decision: React Three Fiber + drei instead of plain three.js

### Context
The site is a React app and needed a 3D scene that reacts to app state (zoom, power-on) and hosts a React UI on a surface.

### Decision
Use `@react-three/fiber` v8 and `@react-three/drei` v9 over `three` r169.

### Why
Reasoning not documented; inferred from implementation. The scene is expressed as React components
whose props come from React state (`active` → LEDs/glow), R3F's pointer events give click/hover on
3D objects, and drei's `Html` is what makes the live DOM desktop on the screen possible.

### Alternatives
Plain three.js with an imperative render loop; Babylon.js; Spline/embedded viewer; a pre-rendered video/image.

### Tradeoffs
+ One mental model (React) for UI and scene; huge helper ecosystem.
− An extra abstraction layer to learn; React re-renders must be kept out of per-frame code; v8 pins the project to React 18 (R3F v9 targets React 19).

### Current Status
Appropriate. Upgrading React to 19 would require R3F v9 / drei v10 together.

---

## Decision: Procedural computer instead of a downloaded model

### Context
The scene needs a retro computer whose screen lines up exactly with an interactive desktop.

### Decision
Build the computer from three.js primitives in code (`ProceduralComputer.tsx`), with a config switch to use a `.glb` later.

### Why
Partly documented: CREDITS.md says it is built procedurally "so it has no third-party model or licence".
The screen geometry is generated from `PROCEDURAL_SCREEN`, so it lines up with the desktop by construction (inferred benefit).

### Alternatives
A CC-licensed Sketchfab model (the commented example in `model.config.ts`); a custom Blender model.

### Tradeoffs
+ No licence/attribution, no download, tiny, fully tweakable in code, exact screen alignment.
− Lower visual fidelity than a sculpted model; every detail is hand-coded numbers.

### Current Status
Active. The GLB path exists but is untested in the repo (no model shipped).

---

## Decision: The screen is real DOM (drei `Html` + `occlude="blending"`), not a rendered texture

### Context
The monitor must show readable, interactive content: windows, links, a terminal with text input.

### Decision
Render the `Desktop` React component as DOM, positioned on the glass with CSS 3D transforms, behind a
transparent hole in the WebGL canvas.

### Why
Documented: "The text stays crisp and fully interactive" ([hiw.md §18](../hiw.md)); `ScreenSlot.tsx`
comment explains the hole-punching. Also lets the same `Desktop` serve the 2D mode (inferred benefit).

### Alternatives
Render the UI to a canvas texture (e.g. via `html2canvas` or drawing manually) and raycast UVs for input;
a WebGL UI library; drei `Html` without `transform` (overlay that doesn't sit in 3D).

### Tradeoffs
+ Native text, accessibility, focus, forms, links, testable with Testing Library.
− Must avoid z-fighting at the screen depth; canvas becomes `pointer-events:none`, so events must go through an `eventSource` wrapper; the desktop lives in a separate React root (no router context); pointer maths needs a scale correction; no post-processing can apply to the screen.

### Current Status
Appropriate and central. Constraints are listed in [3D_GUIDE §12](3D_GUIDE.md#12-depth-z-fighting-and-the-hole-in-the-canvas).

---

## Decision: Render on demand (`frameloop="demand"`)

### Context
A mostly static scene that only moves when orbited or zooming.

### Decision
Only render frames when something calls `invalidate()`.

### Why
Documented in `CameraRig.tsx`: "the canvas only renders while something is moving".

### Alternatives
`frameloop="always"` (60 fps continuous).

### Tradeoffs
+ Near-zero GPU/battery use when idle.
− Every animation must remember to call `invalidate()`; static effects (`Environment`, `ContactShadows`) are set to render once.

### Current Status
Appropriate.

---

## Decision: Camera transitions hand-written in `useFrame` with refs

### Context
Need a smooth fly-in to the screen and back, interruptible, without fighting OrbitControls.

### Decision
`CameraRig` keeps phase/goal/returnTo in refs, lerps camera position and orbit target with frame-rate-independent exponential easing, disables OrbitControls during transitions.

### Why
Documented in the `CameraRig` doc comment ("All per-frame work happens on refs inside useFrame (no React state)").
Choice of hand-written lerp over an animation library: reasoning not documented; inferred from implementation (no dependency, easy to interrupt mid-flight).

### Alternatives
GSAP/`@react-spring/three`/`maath` `easing.damp3`; drei `CameraControls` (has `setLookAt` transitions built in).

### Tradeoffs
+ Small, interruptible, no extra dependency, frame-rate independent.
− Straight-line path (no arc); you maintain the state machine yourself.

### Current Status
Appropriate.

---

## Decision: Separate "zoomed" (intent) from "active" (arrived)

### Context
The desktop shouldn't take input while the camera is still flying.

### Decision
Two booleans in `RetroScene`; `active` is set only by `CameraRig.onSettled`.

### Why
Documented: comment in `RetroScene.tsx` ("`zoomed` is what the visitor asked for; `active` flips once the camera has arrived, and is what makes the screen interactive").

### Alternatives
One boolean with a timeout; disabling input via CSS transitions.

### Tradeoffs
+ Correct regardless of frame rate or window size.
− Two states to keep consistent (zoom-out clears both immediately).

### Current Status
Appropriate.

---

## Decision: 3D is opt-out by capability; 2D desktop is a full alternative

### Context
3D is costly and unreadable on small screens; some visitors prefer reduced motion or lack WebGL.

### Decision
`decideRetroMode` picks 2D for no WebGL, small viewport (< 900×600) or reduced motion, unless forced via `?mode=` or a saved button choice; runtime failures (chunk load, render error, context loss) also fall back to 2D. The 3D scene is lazy-loaded.

### Why
Documented in comments (`useRetroMode.ts`: "Below these sizes the 3D desk is too cramped to read the screen"; `Retro.tsx`: "three / @react-three/* only load when the 3D view is actually used") and [hiw.md §18](../hiw.md).

### Alternatives
3D everywhere with a degraded mobile scene; a static image for non-WebGL.

### Tradeoffs
+ Works everywhere, accessible, smaller download for most phones.
− Two layouts to test; a forced `?mode=3d` can still be used on small screens.

### Current Status
Appropriate; covered by unit tests.

---

## Decision: Retro desktop at `/`, classic site moved to `/classic`

### Context
A new retro experience was added alongside the existing editorial portfolio.

### Decision
`/` → retro (3D/2D); `/classic` → old site; `/projects` unchanged.

### Why
The move is documented in [hiw.md §18](../hiw.md); the *reason* for making retro the default is not documented (inferred: it's the new centrepiece).

### Tradeoffs
+ New experience front and centre; old site preserved.
− Two sites to maintain; anyone with a bookmark to `/` expecting the editorial site now lands on the retro page.

### Current Status
Active.

---

## Decision: Shared content modules (`src/data`)

### Decision
Bio, projects, experience, events and security framing live in TS modules consumed by both sites and the terminal.

### Why
Documented: `profile.ts` "Edit here and both update"; `security.ts` explains that highlights are derived so "the wording stays in one place".

### Tradeoffs
+ Single source of truth, type-checked, no CMS needed.
− Content changes require a rebuild/deploy; cross-file string matching is fragile (tested).

### Current Status
Appropriate for a personal site.

---

## Decision: Pure reducer + pure command interpreter for the desktop

### Decision
Window state in `desktopReducer`; the terminal's logic in `runCommand` returning `{ lines, action }`; React components only execute actions.

### Why
Partly documented: [hiw.md §18](../hiw.md) says `commands.ts` "is a pure function, so it's easy to test". The reducer follows the same pattern (inferred).

### Tradeoffs
+ Unit-testable without rendering (both have test files).
− Slight indirection (action objects).

### Current Status
Appropriate.

---

## Decision: Desktop gets outside capabilities via props/context, not router hooks

### Decision
`navigate`, `onPowerOff` etc. are passed into `Desktop` and exposed through `DesktopContext`.

### Why
Documented in `DesktopContext.ts`: drei's `Html` "mounts a separate React root — so router/app contexts from the page are NOT available in here".

### Current Status
Required by the Html approach.

---

## Decision: Procedural night city with seeded canvas textures

### Decision
Wall, window and Boston skyline are generated: canvas-painted textures from a deterministic PRNG, unlit materials, parallax layers at different depths, simplified landmark towers.

### Why
Documented in `NightCity.tsx`: "Everything is generated at runtime on `<canvas>` (no image assets), from a fixed seed so the skyline is stable." Boston landmarks tie to "Based in Boston, MA" in the profile (inferred).

### Tradeoffs
+ Zero asset downloads; tweakable; consistent between visits.
− Startup cost of painting ~5 canvases (small); landmark placement is tuned to the default camera view.

### Current Status
Appropriate.

---

## Decision: No real-time shadows; baked-once contact shadows and a one-shot environment

### Decision
No `shadows` on the Canvas; `ContactShadows frames={1}`; `Environment frames={1}` from Lightformers.

### Why
Reasoning not documented; inferred from implementation (performance with a static scene, soft look without shadow-map artefacts).

### Tradeoffs
+ Cheap and soft.
− Shadows/reflections don't update if objects move at runtime.

### Current Status
Appropriate while the scene is static.

---

## Decision: Frontend-only, EmailJS for contact

### Decision
No backend; the classic contact form sends via EmailJS from the browser.

### Why
Documented in [hiw.md §13](../hiw.md): "sends real emails from the browser using EmailJS — no server required."

### Tradeoffs
+ Free static hosting, no server to maintain.
− Relies on a third-party service and its quotas; spam protection depends on EmailJS settings.

### Current Status
Appropriate. (The retro Contact app uses `mailto:` + copy-to-clipboard instead of a form.)

---

## Decision: Separate scoped stylesheet for the retro UI

### Decision
`retro.css` with `--r-*` variables, scoped under `.retro-desktop`/`.retro-page`; Tailwind only on the classic site.

### Why
Documented at the top of `retro.css`: scoped "so the classic site's styles and dark mode are untouched".

### Current Status
Appropriate.

---

## Decision: No links from the retro desktop to the classic site

### Context
`/` used to offer four ways to reach the classic site: a "Classic Site" desktop icon, a HUD button,
a `classic` terminal command, and a "Browse all projects on the classic site" link in the Projects app.

### Decision
All four were removed (2026-10-06, at the owner's request). The `/classic` and `/projects` routes
still exist and are reachable by URL. `/projects`'s "Back to home" now goes to `/` instead of `/classic`.

### Why
Owner's request; the reason wasn't stated.

### Tradeoffs
+ Visitors stay in the retro experience; fewer exits to maintain.
− `/classic` and `/projects` are effectively hidden; the `navigate` prop/context plumbing into the desktop has no caller now.

### Current Status
Active.

---

## Decision: Tahoma inside the computer; 3D screen at 800×600

### Context
The desktop mixed four typefaces (Silkscreen titles, VT323 labels, Inter body, an italic serif lede).
The owner asked for one consistent "classic Windows" look inside the computer, keeping the pixel fonts outside it.

### Decision
Window content uses `--r-win` (Tahoma, then Verdana / DejaVu Sans / Segoe UI): 13px body,
bold titles, 24px headings; terminal-style text keeps VT323. The desktop home screen (icon labels,
taskbar, clock, wallpaper, idle overlay) keeps the original pixel fonts (VT323/Silkscreen) at the owner's request. The 3D screen resolution
(`SCREEN_PIXELS` + `.retro-desktop--3d`) dropped from 960×720 to 800×600, and the Projects window from 720 to 640 px wide.

### Why
Owner's request (2026-10-06): first for a classic-Windows look, then, after trying a pixel recreation of
Win98's MS Sans Serif at its native 11px, for something "clear, clean and legible" because small text was
hard to read. Tahoma was the Windows 2000/ME UI font and was designed for small-size screen legibility.
The resolution change is measured: on a 1366×650 viewport the 960×720 screen is shown at ~0.79×; at 800×600 at ~0.93×.

### Alternatives
Pixel MS Sans Serif (tried; authentic but only crisp at 11/22px and hard to read once scaled in 3D);
a bundled webfont such as IBM Plex Sans (identical everywhere, but costs a download and reads less "Windows").

### Tradeoffs
+ One coherent classic-Windows look; legible at small sizes; no font download.
− Rendering varies by platform (Verdana on iOS, default sans on Android).

### Current Status
Active.
