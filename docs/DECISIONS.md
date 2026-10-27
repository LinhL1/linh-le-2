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
**Partly superseded (2026-10-23):** small viewports no longer force 2D; see "3D on phones with a
full-screen desktop handoff" below. No WebGL, reduced motion, an explicit choice and runtime failures
still decide as described.

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

**Update (2026-10-07):** the city is deliberately a *subtle* backdrop (owner's request: the window pixels were "large and obvious").
Textures are blurred once at load with `soften()` (shrink + stretch the canvas) as a fake depth of field, lit windows are
smaller and dimmer (`WINDOW_ALPHA`), skyline layers blend (`transparent`) instead of `alphaTest`, and the 111 Huntington crown is dimmed.
The owner then asked for the blur on the *whole* window, so the three landmarks were converted from 3D meshes into painted,
softened cutout planes at their original depths (blur can't reach geometry). This also cut ~25 meshes/draw calls.
A real depth-of-field post-process was not used: it costs a full-screen pass every rendered frame and would also blur nothing
the canvas blur can't already fake for flat, distant layers.

### Tradeoffs
+ Zero asset downloads; tweakable; consistent between visits.
− Startup cost of painting ~5 canvases (small); landmark placement is tuned to the default camera view.
− Landmarks are flat: orbiting to the azimuth limits shows no new sides of the towers (barely visible at that distance).

### Current Status
Superseded on 2026-10-27 by "Dark room lit only by the screen" (below). `NightCity.tsx` is kept, unmounted.

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
No backend; both contact forms (classic Postcard, retro Contact app) send via EmailJS from the browser,
through one helper, [sendMessage.ts](../src/lib/sendMessage.ts), which holds the service/template/public-key IDs.

### Why
Documented in [hiw.md §13](../hiw.md): "sends real emails from the browser using EmailJS — no server required."

### Tradeoffs
+ Free static hosting, no server to maintain.
− Relies on a third-party service and its quotas; spam protection depends on EmailJS settings.

### Current Status
Appropriate. The retro Contact app gained the same message form (2026-10-23), so visitors to `/` can
send a message without leaving the desktop; its `mailto:` link and copy button stay as the fallback when
sending fails. Both forms go through `sendMessage()` so the IDs live in one place.

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

---

## Decision: 3D on phones with a full-screen desktop handoff

### Context
Phones (any viewport < 900×600) used to get the 2D desktop only, because the 800×600 desktop on the
monitor is unreadable once scaled to a phone (~45% on a 390 px-wide screen) and touch scrolling doesn't
work inside drei's 3D layer. The owner asked for the 3D scene to work on mobile too (2026-10-23).

### Decision
`decideRetroMode` no longer looks at viewport size: with WebGL and no reduced-motion preference, phones get
the 3D desk (orbit by drag, tap to zoom). `SMALL_VIEWPORT_QUERY` now means "too small to read the glass":
there, once the camera has arrived, `RetroScene` shows a full-screen `<Desktop mode="2d" compact>` over the
canvas (with a CRT power-on animation) instead of activating the desktop on the glass. Power off flies back
out. The idle camera re-fits on resize so rotation keeps the computer framed.

### Why
Owner's request. The handoff keeps the 3D part that works well on touch (looking around, the camera
flight) and gives the content the readable, natively scrolling, keyboard-friendly 2D layout.
See [3D_GUIDE §18](3D_GUIDE.md#18-3d-on-phones-re-fitting-and-the-flat-screen-handoff).

### Alternatives
Desktop on the glass at phone size (unreadable, no touch scroll); a smaller `SCREEN_PIXELS` on phones
(the 4:3 monitor leaves most of a tall screen empty, and windows get tiny); keep phones on 2D.

### Tradeoffs
+ Same first impression on every device; content stays readable; no new rendering path.
− Phones now download the ~930 KB 3D chunk and run WebGL (battery, low-end GPUs). Failures still fall back to 2D.
− The glass desktop and the full-screen one are separate React trees: open windows aren't carried across
  if a tablet crosses 900×600 while zoomed in.

### Current Status
Active. Checked in headless Chromium with iPhone 13 emulation (idle, orbit, zoom, handoff, Contact,
power off, rotate to landscape); not yet on a physical phone.

---

## Decision: Dark room lit only by the screen

### Context
The scene was a night room: a warm "desk lamp" key light, cool and pink fill from a big window onto a
procedural Boston skyline (`NightCity`), and a green CRT glow. The owner wanted to try a moodier look
(2026-10-27): "just the lit PC in a dark room, the few items on the table can still be in view but the
rest is dark, so no window view. Make the glow of the screen warm."

### Decision
- `<NightCity />` is no longer mounted. There's no room geometry; the transparent canvas shows the
  `.retro-page` CSS background, now near-black with a faint warm radial haze around the middle.
- The screen is the key light: a `rectAreaLight` the size of `ACTIVE_SCREEN` on the glass, plus a
  `pointLight` lower and in front of it for the pool on the keyboard and desk. Both are warm amber
  (`SCREEN_GLOW` in `RetroScene.tsx`) and brighten ×1.15 when the screen activates.
- The old lights were removed: lamp key (`#ffe2b8`, 1.25), window rim (`#8a9cff`, 0.9), skyline fill
  (`#ff86bd`, 0.45), lavender ambient (0.28), green CRT point light (`#a8ffc4`, 1.1 → 1.8). They are replaced by
  a warm ambient at 0.05 and a faint dusty-blue back rim (0.12) so the silhouette doesn't vanish.
- The environment map is down to one dim warm `Lightformer` (`environmentIntensity` 0.55 → 0.15),
  because an environment lights from every direction and would wash out the dark.
- The 3D screen gets a faint amber wash (`.retro-desktop--3d::after`) so its colour matches its light.

### Why
Owner's request. The values were tuned against headless-Chromium screenshots (idle and zoomed):
the first pass (stronger, more saturated amber, point light near the glass) turned the beige plastic
orange and lit the bezel more than the desk.

### Alternatives
Fog to fade the room out (dims the computer too, since it's distance-from-camera based); a
post-processing bloom on the screen (a full-screen pass every frame, and the screen is DOM, not WebGL,
so bloom can't see it); keeping a dim window (the owner asked for none).

### Tradeoffs
+ Strong focus on the computer; simpler scene (no skyline textures painted at startup, ~15 fewer meshes).
+ The glow follows `ACTIVE_SCREEN`, so a GLB model's screen would light the room the same way.
− The Boston landmarks (a nod to "Based in Boston") are gone from view.
− Objects far from the screen (plant, sticky notes) are dim; moving props further out loses them.
− The area light has no shadows, so the monitor doesn't block glow from reaching things behind/beside it.

**Revision (same day): light comes *from* the screen, in the screen's colour.** The owner asked for the
room to be "dark except for the dim light radiating from the screen" and for the light to "match the
screen's aesthetic". The amber version didn't read as screen light: its point light (z ≈ 1.3) and
reflection panel (z = 3) were in front of the computer and lit every front face evenly, like a flash.
Changes:
- Every light now sits on or just in front of the glass: the point light moved to 0.2 in front of the
  screen (behind the base unit's front face, which now falls into shadow), the reflection `Lightformer`
  moved onto the screen itself.
- `SCREEN_GLOW.color` is now `#9fd1bb`, the desktop's teal-green, replacing amber (the amber screen wash was
  removed; the page haze is teal too). Ambient 0.03, rim 0.08, `environmentIntensity` 0.12.
- New `ScreenHalo`: an additive glow plane around the glass (fake bloom), since real bloom can't see the DOM screen.
- Tuned against screenshots: closer point light and `area` 2.2 burned the bezel's inner bevel white; settled on
  `area` 0.9, `point` 1.4, halo opacity 0.35 (0.3 zoomed in).

### Current Status
Active (experimental, the owner is exploring the look). `NightCity.tsx` is kept so the window can come back
(see [CHANGE_GUIDE.md → environment](CHANGE_GUIDE.md#modify-the-environment-dark-room-or-windowskylinewall)).
Going back to a warm glow is a one-line change to `SCREEN_GLOW.color` (plus the `.retro-page` haze).
