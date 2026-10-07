# Debugging guide

Each entry follows: **Symptom → Likely causes → Where to inspect → How to verify → Likely fix.**
At the end: general techniques and [common 3D mistakes](#common-3d-mistakes-for-this-project).

## Quick toolbox

| Need | How |
|---|---|
| Force a mode | `/?mode=2d`, `/?mode=3d`; clear `localStorage.retro-mode` |
| Why am I in 2D? | `useRetroMode()` returns `reason` (`no-webgl`, `forced`, `small-viewport`, `reduced-motion`, `default`). Temporarily log it in `Retro.tsx`. |
| Simulate reduced motion | DevTools → ⋮ → More tools → Rendering → "Emulate CSS prefers-reduced-motion" |
| See the desktop layer | DevTools Elements: inside `.retro-scene` there's a `<canvas>` and a sibling `div` (drei Html) containing `.retro-desktop` |
| Inspect three.js objects | temporarily add `onCreated={(s) => ((window as any).r3f = s)}` on `<Canvas>`, then in the console: `r3f.scene`, `r3f.camera.position`, `r3f.controls.target`, `r3f.gl.info.render` (draw calls, triangles) |
| Visual helpers | drei `<axesHelper args={[1]} />` (X red, Y green, Z blue), `<gridHelper />`, `<Stats />` from drei; add inside `<Canvas>` temporarily |
| Frame capture | Spector.js browser extension: see every draw call of one frame |
| Performance | DevTools Performance panel; with `frameloop="demand"` an idle scene should show no GPU activity |

Remove temporary helpers before committing.

---

## UI issues (desktop/HUD)

**Symptom:** a window, button or text looks wrong on the 3D screen.
- **Causes:** CSS in `retro.css`; fixed 800×600 size (`.retro-desktop--3d`); `compact` layout in 2D; font not loaded; a heading picking up the classic site's `h1–h6` font from `index.css`.
- **Inspect:** `/?mode=2d` shows the same DOM unscaled, so debug layout there first. In 3D, the Elements panel works normally on the desktop DOM.
- **Verify:** toggle the CSS rule in DevTools; compare 2D vs 3D.
- **Fix:** edit scoped `.retro-*` styles. Silkscreen (HUD only) renders crisply only at multiples of 8 px (comment in `retro.css`).

**Symptom:** the mouse wheel doesn't scroll a window on the 3D screen (works in 2D).
- **Cause:** Chromium can't wheel-scroll inside drei's `preserve-3d` layer; `Desktop`'s own `wheel` handler does it. It only scrolls elements whose computed `overflow-y` is `auto`/`scroll` and that have room to move.
- **Fix:** make sure the new scrollable element has `overflow-y: auto` and a constrained height; see [3D_GUIDE §17](3D_GUIDE.md#17-scrolling-inside-css-3d-transforms).

**Symptom:** screen scrolls/shifts when focusing something inside the 3D desktop.
- **Causes:** a `focus()` without `{ preventScroll: true }` or a `scrollIntoView` inside the transformed layer.
- **Fix:** use `preventScroll` and set `scrollTop` on the local scroll container (pattern in `TerminalApp`, `Window`).

## State issues

**Symptom:** clicking the screen while zoomed does nothing / desktop ignores clicks.
- **Causes:** `active` never became true (camera never "arrived"), so `pointerEvents` is `none` and the desktop is `inert`.
- **Inspect:** React DevTools on `RetroScene` (`zoomed`, `active`); Elements: does `.retro-desktop` have `inert`?
- **Verify:** log in `CameraRig` when the phase changes.
- **Fix:** see "camera never settles" below.

**Symptom:** window positions or terminal history lost.
- **Causes:** the desktop unmounted (switching 2D/3D, leaving `/`). State is in-memory only by design.

## 3D positioning issues

**Symptom:** object appears in the wrong place / floating / sunk into the desk.
- **Causes:** local vs world confusion (its parent group is offset/rotated/scaled); primitives are **centred** (a box of height `h` at `y=0` is half below the desk); a landmark painted outside its `bounds` is clipped off its cutout canvas.
- **Inspect:** the parent chain in the JSX; `r3f.scene.getObjectByName(...)` (set a `name` prop) and `.getWorldPosition(new THREE.Vector3())`.
- **Verify:** drop an `<axesHelper>` inside the parent group to see its local frame.
- **Fix:** lift by half the height (`y = h/2`), or move the parent rather than the child.

**Symptom:** flicker / pale dithered patches, especially on the screen.
- **Causes:** **z-fighting**: two surfaces at the same depth. On the screen: some face sits at the screen plane (`monitorZ` / `screen.position[2]`).
- **Inspect:** recently moved meshes near the monitor front; with a `.glb`, the model's own glass.
- **Fix:** push the face a few thousandths of a unit back (the glass is at −0.006, the recess at −0.02). Never at exactly the screen depth.

## Camera issues

**Symptom:** camera jumps/snaps on load or after zooming out.
- **Causes:** idle pose outside the orbit limits (OrbitControls clamps on `update()`); `IDLE_TARGET` changed without the controls' `target` matching.
- **Inspect:** compute the idle direction's polar/azimuth: polar = `acos(dir.y)`, azimuth = `atan2(dir.x, dir.z)`. They must be within the min/max props.
- **Fix:** adjust `IDLE_DIRECTION` or the limits.

**Symptom:** camera fights / jitters during zoom, or drifts up when zoomed.
- **Causes:** OrbitControls left enabled while CameraRig drives the camera (it clamps to `maxPolarAngle` every frame).
- **Fix:** keep `controls.enabled = false` for the whole zoom; re-enable only on arrival at idle (current behaviour).

**Symptom:** camera never settles (desktop never becomes active).
- **Causes:** goal unreachable because something else moves the camera each frame; threshold too strict after you change scale.
- **Inspect:** log `camera.position.distanceToSquared(goal)` in `useFrame`.
- **Fix:** remove the competing driver; keep the `1e-6` threshold proportional to scene scale.

**Symptom:** close-up crops the screen on narrow/tall windows.
- **Causes:** `FILL` too large; the width-fit uses the canvas aspect.
- **Fix:** lower `FILL.width`.

## Interaction / raycasting issues

**Symptom:** hover cursor / click doesn't react.
- **Causes:** (1) handler is on an object outside the interactive group; (2) another element above the scene takes the pointer (HUD with `pointer-events: auto`); (3) layout changed so `clientX/Y` no longer equals canvas coordinates (`eventPrefix="client"` assumes the scene fills the viewport from the top-left); (4) the object has `visible={false}` or `raycast={() => null}`.
- **Inspect:** Elements panel → hover the spot; DevTools "Inspect" shows which DOM element is on top. Log `e.object.name` in the handler.
- **Verify:** add `onPointerMissed={() => console.log("miss")}` on `<Canvas>`.
- **Fix:** move the handler, fix CSS stacking/pointer-events, or remove `eventPrefix` if the canvas is no longer full-viewport (and test offsets).

**Symptom:** finishing an orbit drag zooms you in.
- **Causes:** missing `e.delta` check.
- **Fix:** keep `if (e.delta > 6) return`.

**Symptom:** a click on a child object also triggers the computer zoom.
- **Causes:** event bubbling up the scene graph.
- **Fix:** `e.stopPropagation()` in the child handler.

**Symptom:** dragging a window in 3D moves it too much/too little.
- **Causes:** pointer delta not divided by the CSS scale.
- **Inspect:** `Window.tsx` `scale` computation (`getBoundingClientRect().width / offsetWidth`).

## Model loading issues (if using a `.glb`)

**Symptom:** computer missing; console 404 or loader error.
- **Causes:** wrong URL (files in `public/` are served from the root; use `import.meta.env.BASE_URL`); invalid file; Draco decoder blocked (fetched from a CDN by drei).
- **Inspect:** Network tab for the `.glb` request; console errors. The `SceneErrorBoundary` will fall back to 2D on a thrown error and log "3D scene unavailable…".
- **Fix:** correct path, re-export, or host the Draco decoder locally.

**Symptom:** model invisible but no error.
- **Causes:** scale off by 100× (cm vs m), positioned far away, or `hideMeshes` hid a parent node.
- **Inspect:** `new THREE.Box3().setFromObject(model)` to see its size/position.

**Symptom:** the model's own screen covers the live desktop.
- **Fix:** add its mesh name to `hideMeshes`. Note three.js may sanitise names (spaces become `_`).

## Texture / material issues

**Symptom:** colours look washed out or too dark.
- **Causes:** canvas texture missing `colorSpace = SRGBColorSpace`; tone mapping applied where you wanted exact colours.
- **Fix:** set the colour space; `toneMapped: false` for unlit backdrop materials.

**Symptom:** black object.
- **Causes:** lit material with no light reaching it, or normals wrong after editing vertices.
- **Fix:** call `geometry.computeVertexNormals()` after moving vertices; check lights; try `MeshBasicMaterial` to rule out lighting.

**Symptom:** skyline shows rectangles of sky colour or hard edges.
- **Causes:** `transparent: true` removed from the skyline materials, or texture without transparency. (Hard but
  clean edges instead of soft ones means `soften()` was skipped or `alphaTest` was added back.)

**Symptom:** GPU memory grows after navigating back and forth.
- **Causes:** geometries/materials/textures created with `new` and not disposed.
- **Inspect:** `r3f.gl.info.memory` (geometries, textures) before/after remount.
- **Fix:** add them to a `useDisposable` object or a cleanup effect.

## Animation issues

**Symptom:** an animation only moves when I move the mouse.
- **Causes:** `frameloop="demand"`: nothing is requesting frames.
- **Fix:** call `invalidate()` inside `useFrame` while the animation runs (as `CameraRig` does).

**Symptom:** animation speed differs between machines.
- **Causes:** fixed per-frame step instead of `delta`-based.
- **Fix:** use `1 - Math.exp(-k * delta)` for easing or `x += speed * delta`.

**Symptom:** stuttering when something animates.
- **Causes:** `setState` inside `useFrame`, or allocating `new Vector3()` every frame.
- **Fix:** refs + reuse objects.

## Performance problems

**Symptom:** fans spin / high GPU while idle.
- **Causes:** something keeps calling `invalidate()` (a forgotten loop), or `frameloop` changed to `"always"`.
- **Inspect:** Performance panel recording while idle; should be near-empty.

**Symptom:** slow first load of `/`.
- **Causes:** the RetroScene chunk (~930 KB minified) plus fonts; the BIOS loader always shows 4.6 s.
- **Inspect:** Network tab; Lighthouse.

See [PERFORMANCE.md](PERFORMANCE.md) for the measured asset sizes.

---

## Common 3D mistakes (for this project)

| Mistake | Why it bites here | Do instead |
|---|---|---|
| Treating a child's `position` as its world position | the monitor, chin, base-unit panel and keyboard are all nested groups | sum the parent chain, or use `getWorldPosition` |
| Mutating shared vectors | `IDLE_TARGET.addScaledVector(...)` would change the constant for everyone | `.clone()` first (as the code does) |
| Forgetting to normalize a direction | `IDLE_DIRECTION` scaled by `distance` would be 15% off | `.normalize()` directions |
| Degrees in `rotation` | `rotation={[90,0,0]}` spins 90 *radians* | `Math.PI / 2`, `MathUtils.degToRad` |
| Assuming rotation pivots at the base | primitives rotate about their centre | wrap in a group with an offset child |
| Confusing screen and world coordinates | pointer pixels vs world units vs desktop CSS px (three different units here) | convert explicitly (NDC for rays, scale for window drags) |
| Putting a face at the screen depth | z-fights with the HTML hole | stay ≥ ~0.005 units off `monitorZ` |
| Calling `setState` every frame | re-renders the whole scene subtree at 60 Hz | refs + `useFrame` |
| Allocating in `useFrame` | `new Vector3()` per frame → garbage collection hitches | allocate once in a ref (CameraRig keeps `goal`/`returnTo` in refs; note `zoomPose` allocates, but only on transitions) |
| Forgetting `invalidate()` | demand frameloop won't redraw | call it whenever you mutate outside React props |
| Forgetting `needsUpdate` | instance matrices/colours, edited geometry stay stale on the GPU | set `instanceMatrix.needsUpdate = true` etc. |
| Leaving OrbitControls enabled during a scripted move | it clamps and fights the camera | disable, then re-enable and `update()` |
| Expecting static effects to update | `Environment`/`ContactShadows` use `frames={1}` | reload, or remove `frames` while iterating |
| Using router hooks inside the desktop | separate React root in 3D → no router context | `useDesktopContext().navigate` |
| Loading a model repeatedly | re-parsing on every mount | `useGLTF` caches by URL; don't add cache-busting query strings |
| Raycasting too much | R3F raycasts on every pointer move against all handler-bearing objects | keep handlers on few, simple groups; this scene has one |
