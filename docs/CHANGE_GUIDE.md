# "If I want to change X…"

Each task lists: **where to look · files · concepts · what to modify · what could break · how to test.**
Code blocks marked *sketch* are illustrations, not code that exists in the repo.

Universal 3D test pass after any scene change (run `npm run dev`, open `/`):
1. orbit left/right/up/down to the limits and look for gaps or clipping;
2. hover the computer (pointer cursor) and click it → smooth zoom → icons focusable;
3. drag a window, open the terminal, type `help`;
4. Esc / Power off → returns to where you orbited from;
5. resize the window while zoomed (the close-up re-frames);
6. `/?mode=2d` still works; `npm test` passes.

---

## Change the camera

| Goal | Edit | Notes |
|---|---|---|
| Different idle angle | `IDLE_DIRECTION` in [RetroScene.tsx](../src/retro/scene/RetroScene.tsx) | it's normalized, so only the direction matters |
| Look at a different point | `IDLE_TARGET` | also the orbit pivot and the zoom-out target |
| Closer/farther idle view | `SCENE_HALF` (what must fit) or `IDLE_MIN_DISTANCE` (3.8; this one wins on landscape windows) | computed once at mount; zoom-out returns to it |
| Wider/narrower lens | `FOV` | affects idle fit **and** zoom distance (both use `camera.fov`) |
| Orbit range | `minAzimuthAngle`/`maxAzimuthAngle`/`minPolarAngle`/`maxPolarAngle` on `<OrbitControls>` | radians; polar 0 = straight down from above |
| Allow zoom/pan | `enableZoom`/`enablePan` | zooming changes the distance, so the `returnTo` logic still works; panning moves the target, which CameraRig overwrites on zoom-out |
| How much the close-up fills | `FILL` in [CameraRig.tsx](../src/retro/scene/CameraRig.tsx) | 0.86 of height / 0.92 of width |
| Transition speed | the `5.5` in `1 - Math.exp(-… * 5.5)` | higher = faster |

**Concepts:** [camera](3D_GUIDE.md#7-the-camera), [lerp](3D_GUIDE.md#14-smooth-motion-lerp-and-frame-rate-independence), [state machine](3D_ARCHITECTURE.md#camerarig-state-machine).
**Could break:** if the idle view's polar/azimuth angle is outside the orbit limits, OrbitControls snaps the camera on its first update. With a wider FOV or lower camera you may see past the oversized wall (`WALL` in NightCity) or under the desk. Too small `near` causes depth precision issues; too small `far` cuts off the sky (z = −46).
**Test:** universal pass, plus different window aspect ratios (tall and ultra-wide).

## Move a 3D object

**Where:** the `position` prop of the object or its parent `<group>`.
**Concepts:** [local vs world](3D_GUIDE.md#1-coordinate-systems), [parent/child](3D_GUIDE.md#5-parentchild-transforms-and-the-scene-graph).
**Modify:** e.g. move the plant: `<group position={[-1.75, 0, 0.35]}>` in `PottedPlant`. Keep `y = 0` for things that sit on the desk (desk top is y = 0).
**Could break:**
- **The monitor and screen are coupled.** Don't move monitor parts independently of `PROCEDURAL_SCREEN`; move the screen rect instead (it drives bezel, glass, zoom, glow and the desktop).
- `ContactShadows` is rendered once (`frames={1}`): the shadow stays where the object *was* until reload. Remove `frames` (costlier) or reload to check.
- Objects moved close to the screen plane can z-fight with the HTML hole.
- Cords are drawn through fixed points; move the keyboard or mouse and the cord ends no longer meet it.
**Test:** orbit around it; check its shadow; check it doesn't intersect other parts.

## Rotate an object

**Where:** `rotation={[x, y, z]}` (radians) on the mesh/group.
**Concepts:** [Euler angles & quaternions](3D_GUIDE.md#4-transformations-position-rotation-scale).
**Modify:** turn the mouse: `rotationY={-0.12}` on `<Mouse>`. To point something *along a direction*, use
`new Quaternion().setFromUnitVectors(new Vector3(0,1,0), dir.normalize())`; if the object's spin around that
direction matters too (a flat leaf), nest a yaw group around a tilted mesh like the `PottedPlant` leaves.
**Could break:** rotation is around the object's **own origin**. Primitives are centred, so a box rotates
about its middle, not its base; wrap it in a group and offset it if you need a different pivot. Rotating the
screen rect means the zoom pose follows (it uses `applyEuler`), which is what you want.
**Test:** orbit to check from several sides.

## Change an object's appearance

**Where:** its material. In `ProceduralComputer` most parts share materials from `mats` (`useDisposable`)
and colours from `PALETTE`. In `NightCity` look at `WINDOW_COLORS`, `WINDOW_ALPHA` (how bright lit windows are), `LAYERS[].body/haze/litChance/win`,
the `paintWindows` options inside each `LANDMARKS[].paint` (more `cols`/`rows` = smaller windows), and the `soften(canvas, factor)` calls (higher = blurrier city).
**Concepts:** [materials](3D_GUIDE.md#10-materials-and-textures).
**Modify:**
- recolour all beige plastic → `PALETTE.beige` (shared, so many parts change at once);
- one part only → give that mesh its own `<meshStandardMaterial color="…" />` child instead of the shared `material={mats.beige}`;
- shinier → lower `roughness`; glow → `emissive` + `emissiveIntensity`.
**Could break:** materials created with `new` in a memo must stay in the `useDisposable` object (or have a cleanup) to be freed. Night-city materials are `MeshBasicMaterial` with `toneMapped:false`; switching them to Standard makes them react to lights and tone mapping (they'll go dark).
**Test:** look in both idle and zoomed (the green CRT light changes the look near the screen).

## Add a new 3D object

**Where:** inside `ProceduralComputer` (part of the clickable computer) or as a new component placed in
`RetroScene`'s `<Canvas>` (outside the clickable group if it shouldn't zoom you in).
**Concepts:** [meshes](3D_GUIDE.md#9-meshes-and-geometry), [scene graph](3D_ARCHITECTURE.md#scene-graph).

*Sketch: a coffee mug on the desk, not clickable:*
```tsx
// src/retro/scene/Mug.tsx
export function Mug() {
  return (
    <group position={[1.2, 0, 0.9]}>                       {/* on the desk: y = 0 */}
      <mesh position={[0, 0.07, 0]}>                        {/* cylinder is centred → lift by half its height */}
        <cylinderGeometry args={[0.06, 0.055, 0.14, 24]} />
        <meshStandardMaterial color="#c9564a" roughness={0.4} />
      </mesh>
    </group>
  );
}
// RetroScene.tsx, inside <Canvas>, next to <NightCity />:  <Mug />
```
**Could break:** placing it inside the interactive group makes it zoom-on-click. Many separate meshes add draw calls (use instancing for repeats, like the keyboard). If you create geometries/materials with `new`, dispose them.
**Test:** universal pass; orbit to all limits to check it's not clipping into the monitor or out of frame.

## Add a new interaction

**Where:** an R3F handler on the object's group. If the object is inside the computer group, call `e.stopPropagation()` so the zoom doesn't also fire.
**Concepts:** [R3F events](INTERACTION_GUIDE.md#3-how-react-three-fiber-does-it), [click vs drag](INTERACTION_GUIDE.md#4-this-projects-pointer-pipeline), [frame loop](3D_ARCHITECTURE.md#frame-loop-and-reactivity).

*Sketch: make the plant wiggle when clicked, without zooming:*
```tsx
function PottedPlant() {
  const ref = useRef<Group>(null);
  const wiggle = useRef(0);                         // ref, not state: changes every frame
  const invalidate = useThree((s) => s.invalidate);

  useFrame((_, delta) => {
    if (wiggle.current <= 0 || !ref.current) return;
    wiggle.current = Math.max(0, wiggle.current - delta);
    ref.current.rotation.z = Math.sin(wiggle.current * 30) * 0.08 * wiggle.current;
    invalidate();                                   // frameloop="demand": keep frames coming
  });

  return (
    <group ref={ref} position={[-1.75, 0, 0.35]}
      onClick={(e) => { e.stopPropagation(); if (e.delta <= 6) { wiggle.current = 0.6; invalidate(); } }}>
      …
    </group>
  );
}
```
**Could break:** forgetting `stopPropagation` (zoom also triggers), forgetting `invalidate()` (animation only advances when you move the mouse), using `setState` per frame (slow), not ignoring drags (`e.delta`).
**Test:** click it idle; orbit-drag ending on it shouldn't trigger; check it does nothing harmful while zoomed (handlers still fire when zoomed; guard with the `zoomed` state if needed).

## Change what happens when the computer is clicked

**Where:** `onComputerClick` in [RetroScene.tsx](../src/retro/scene/RetroScene.tsx).
**Modify:** it currently ignores drags (`e.delta > 6`) and clicks while zoomed, clears hover, and calls `zoomIn()`. `e.object` tells you which mesh was hit if you want different parts to do different things.
**Could break:** the `zoomed` guard is load-bearing: while zoomed, desktop clicks bubble to the scene and would re-trigger this (see [layers](INTERACTION_GUIDE.md#5-who-receives-the-pointer-layers)). Keep the HUD "Turn on the computer" button working too: it's the keyboard path.

## Change lighting

**Where:** the light elements and `<Environment>` at the top of the `<Canvas>` in [RetroScene.tsx](../src/retro/scene/RetroScene.tsx).
**Concepts:** [lighting](3D_GUIDE.md#11-lighting).
**Modify:** intensity/colour/position props. The CRT glow is the `pointLight` (intensity switches with `active`). Reflections come from the `Lightformer`s; `environmentIntensity` scales them.
**Could break:** the night city ignores lights (Basic material) by design. Real shadows need `shadows` on `<Canvas>` + `castShadow` on lights and meshes (currently `castShadow: false`), which costs GPU time; the existing `ContactShadows` would then double up. `Environment frames={1}` means changes to Lightformers need a remount (reload) to show.
**Test:** idle *and* zoomed; check the desk isn't blown out under the CRT light.

## Change animations

| Animation | Where |
|---|---|
| camera fly-in/out | `CameraRig` (speed constant, `FILL`) |
| LED/glow "power on" | `poweredOn`/`active` props in `ProceduralComputer` and the `pointLight` |
| orbit inertia | `dampingFactor` on OrbitControls |
| CRT flicker, scanlines, blinking prompt | `retro.css` (`retro-flicker`, `.retro-crt`, `retro-blink`); disabled under `prefers-reduced-motion` |
| boot loader | `Loader.tsx` `BOOT_LINES`/`BOOT_LINE_DELAY` + `RETRO_LOADER_DURATION` in `App.tsx` (keep them consistent) |
| classic-site motion | Framer Motion props in `src/components/*` |

**Could break:** per-frame 3D animation must call `invalidate()` (demand frameloop). Long-running 3D animations
cost GPU constantly; respect `reducedMotion` (available from `useRetroMode`).

## Add a new 3D model (.glb)

1. Optimise the model and put it in `public/models/` (e.g. `crt.glb`).
2. In [model.config.ts](../src/retro/scene/model.config.ts), replace `COMPUTER_MODEL` with the commented `kind: "glb"` example; set `url`, `position`, `rotation`, `scale`.
3. Find the model's screen mesh name (log it: temporarily `scene.traverse(o => console.log(o.name))` in `GlbComputer`) and add it to `hideMeshes`.
4. Tune `screen` (`position`, `rotation`, `width`, `height` with width:height = 4:3) until the desktop sits exactly on the glass. Keep the model's glass *behind* `screen.position` (z-fighting, see [3D_GUIDE §12](3D_GUIDE.md#12-depth-z-fighting-and-the-hole-in-the-canvas)).
5. Credit it in `CREDITS.md` and, for CC-BY, visibly on the site.

**Concepts:** [assets](3D_GUIDE.md#13-assets-and-3d-models). **Could break:** the procedural desk, keyboard, mouse, plant and sticky notes disappear (they're part of `ProceduralComputer`), so the model needs its own desk or you add one; a model with its own lights/cameras is ignored; large models slow the first load (the `Suspense` fallback is `null`, so the computer just pops in). **Test:** zoom in and check edges of the desktop against the bezel from the close-up and idle views.

## Modify the environment (window, skyline, wall)

**Where:** [NightCity.tsx](../src/retro/scene/NightCity.tsx): `WINDOW` (opening), `WALL_Z`, `LAYERS` (depth `z`, size, seed, density, colours, haze), `LANDMARKS` (each tower's `z`, world-unit `bounds` and `paint` function), `skyTexture` (gradient, stars).
**Could break:** `ROOM_COLOR` must match `.retro-page { background }` in `retro.css` or a seam appears when orbiting. Landmark positions were tuned so they show through the window panes in the default view (CONFIRMED comment); moving the camera may require re-tuning. Changing a `seed` changes the whole skyline.
**Test:** orbit to every limit and look through the window; check edges of the skyline layers never show.

## Change UI ↔ 3D communication

| Direction | Mechanism today | Add more by… |
|---|---|---|
| page → scene | props on `RetroScene` | adding a prop |
| scene → desktop | props through `ScreenSlot` → `Desktop` | extending `DesktopProps` |
| desktop/apps → scene/page | callbacks in `DesktopContext` (`powerOff`, `navigate`) | adding a field to `DesktopContextValue` and passing it from `Desktop`'s props |
| scene → HUD | `zoomed`/`active` state in `RetroScene` | rendering from that state |

**Could break:** never use router/app context hooks inside the desktop; it's a separate React root in 3D. Keep the 2D path working: `Retro.tsx` renders `Desktop` without the 3D props, so new props must be optional.

## Modify state

- **Desktop windows:** add an action to `DesktopAction` and a `case` in `desktopReducer` ([useDesktop.ts](../src/retro/desktop/useDesktop.ts)); add a test in `desktopState.test.ts`.
- **3D scene state:** `RetroScene` `useState`. Ask "does this change per frame?" If yes, use a ref + `useFrame`, not state.
- **Mode (3D/2D):** `decideRetroMode` is the policy; update `retroMode.test.ts` with any rule change.

## Add a desktop app

1. Create `src/retro/desktop/apps/MyApp.tsx` (read data from `src/data`, use `useDesktopContext()` for navigation).
2. Add the id to `APP_IDS` in `useDesktop.ts`.
3. Register it in `APPS` in `apps.tsx` (title, label, icon, width/height in desktop px; the 3D desktop is 800×564 usable, so keep windows ≤ 640 wide to clear the icon column).
4. Add an icon to `ICONS` in `pixelIcons.ts` (16 rows × 16 chars, palette letters or `.`); the test enforces the grid.
5. Optional: terminal file alias / help line in `terminal/commands.ts`.

**Test:** `npm test` (icons, Desktop tests), then open it in 2D, 3D and compact (narrow) layouts.

## Add a terminal command

Add a handler to `COMMANDS` (and optionally `HELP`, `ALIASES`, `FILES`) in [commands.ts](../src/retro/desktop/terminal/commands.ts). Return `{ lines, action? }`; to *do* something, add a new `TerminalAction` type and handle it in `TerminalApp.submit`. Add a test in `commands.test.ts`.

## Edit content

Edit `src/data/*.ts`. Both sites update. If you rename an experience role/company or a project title referenced in `security.ts`, update `security.ts` and the expected list in `retroMode.test.ts`.

## Add a new feature (general recipe)

1. Decide which world it lives in: **DOM** (desktop app, HUD) or **WebGL** (scene object). Prefer DOM for text and forms.
2. Decide the update style: React state (discrete), `useFrame` + refs (continuous), or imperative (setup/high-frequency).
3. Keep both modes working (3D and `?mode=2d`) and keyboard access intact.
4. Add pure-function tests where the logic allows (reducers, command parsers, decision functions).
5. Update the docs per [CLAUDE.md](../CLAUDE.md).
