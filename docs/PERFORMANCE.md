# Performance

Performance concepts as they apply here, then findings split into **confirmed issues**
(measured or read directly), **potential risks** (plausible, not measured) and **optimisation
opportunities**. Nothing here was profiled in a browser during the 2026-10-05 audit; sizes come from
the files in `src/assets` and the existing `dist/` build.

## Concepts, briefly

| Concept | Meaning | Here |
|---|---|---|
| **Draw call** | one "draw this mesh with this material" command from CPU to GPU; each has overhead | the scene has dozens of small meshes (not measured: use `gl.info.render.calls`); the keyboard uses instancing to draw 91 keys in 1 call |
| **CPU vs GPU work** | JS (matrix updates, raycasts, React) vs shading pixels/vertices | GPU work is near zero when idle thanks to `frameloop="demand"` |
| **Geometry complexity** | triangles per frame | low: primitives with modest segment counts; the cords are the densest (120 tube segments × 6 sides) |
| **Texture size** | GPU memory + upload time | 5 canvas textures: 2048×512 (×3), 1024×512, 256×1024 (×3) |
| **Pixel ratio** | pixels shaded per CSS pixel | capped at 1.75 (`dpr={[1, 1.75]}`) |
| **Render loop cost** | work per frame × frames per second | frames only while orbiting/zooming |
| **Raycasting cost** | triangles tested per pointer event | one interactive group; bounding-sphere early-outs per mesh |
| **Bundle size** | JS to download/parse | 3D libraries isolated in a lazy chunk |
| **Resource reuse / memoisation** | create once, share, dispose | shared materials (`mats`), `useDisposable`, memoised textures |

## What's already done well (CONFIRMED in code)

- `frameloop="demand"`: no rendering while nothing moves.
- 3D code split into a lazy chunk; 2D visitors never download three.js.
- Shared materials/geometries + explicit disposal on unmount.
- Instanced keyboard.
- Environment map at 64 px and contact shadows rendered **once** (`frames={1}`).
- No image/model downloads for the 3D scene (all procedural).
- Camera animation in `useFrame` with refs (no React re-renders per frame).
- Window dragging mutates the DOM and commits state once.
- The WebGL probe context is released immediately.
- The `/` route renders behind the 4.6 s BIOS loader, so the 3D chunk downloads while the loader plays.

## Confirmed issues

### 1. Very large images shipped unoptimised
Vite copies images byte-for-byte (confirmed: identical sizes in `dist/assets/`).

| File | Size | Used by | Displayed at |
|---|---|---|---|
| `open_envelope.png` | **6.4 MB** | classic About (hover state) | inside a 208×176 CSS px box (`w-52 h-44`) |
| `closed_envelope.png` | **3.5 MB** | classic About | same 208×176 box |
| `bouquet_banter.jpg` | 2.0 MB | Community (classic + 3D app) | card width |
| `me.jpg` | 1.6 MB | classic About, **3D About window** | 104×128 px in the retro window |
| `loader_frame_01…07.jpg` | 3.2 MB total | classic loader (2.1 s) | full-screen frames cycling every 190 ms |

Impact: slow `/classic` loads on mobile data; the loader frames likely aren't all downloaded within
the 2.1 s the loader is visible. Opening "About Me" in the retro desktop fetches 1.6 MB for a thumbnail.

### 2. Time-based loaders
`App.tsx` hides the loader after a fixed 4.6 s (`/`) or 2.1 s (others), regardless of readiness. On
fast connections that's added wait; on slow ones the content may still be loading underneath.
This is a UX/perceived-performance issue, not a bug, and it may well be intentional theatre (INFERRED).

### 3. Bundle sizes (from current `dist/`, minified, before gzip)
- `RetroScene-*.js` ≈ 929 KB (three + R3F + drei + scene code), lazy.
- `index-*.js` ≈ 536 KB (React, router, Framer Motion, Radix, classic + desktop code), loaded on every route.
Gzipped sizes weren't measured.

## Potential risks (not measured)

| Risk | Why it might matter | How to check |
|---|---|---|
| CSS `matrix3d` recalculation of the desktop DOM on every frame while orbiting/zooming | drei `Html` updates the transform each rendered frame; the browser re-composites an 800×600 DOM layer | Performance panel during an orbit drag on a low-end laptop |
| Raycasts on every `pointermove`, even while zoomed | desktop pointer events bubble to the R3F event source; R3F raycasts the computer group recursively (including 91 instances) | Performance panel while moving the mouse over the zoomed desktop |
| Mesh count / draw calls | many tiny meshes (4 vent grooves, 6 front vents, cords, 13 plant leaves) each cost a draw call | `r3f.gl.info.render.calls` (see [DEBUGGING.md](DEBUGGING.md)) |
| Infinite CSS animations | `.retro-crt` flicker runs forever over the desktop | probably cheap (opacity is compositor-only); check paint flashing |
| Classic custom cursor loop | `CursorEffect` runs `requestAnimationFrame` forever, even when the mouse is still | Performance panel idle on `/classic` |
| Large GLB if swapped in | no compression/size guidance enforced | file size in Network tab |

## Optimisation opportunities

Ordered by likely payoff:

1. **Compress and resize images** (WebP/AVIF, sized to display): the envelopes alone are ~10 MB. A `<picture>` or Vite image plugin could automate it.
2. **Use a smaller thumbnail for `me.jpg`** in the retro About window.
3. **End loaders on readiness** (e.g. when the lazy chunk resolves / fonts load) rather than a fixed timeout, with a minimum duration if the boot animation should always play.
4. **Instance or merge repeated scene parts** (plant leaves, vents, front-panel slots), e.g. with `InstancedMesh`, drei `<Instances>`, or `BufferGeometryUtils.mergeGeometries`. Small win; the scene is already light.
5. **Skip R3F raycasts while zoomed** (e.g. disable events on the group or the event manager when `active`), if profiling shows cost.
6. **Stop the cursor rAF loop when the ring has caught up** with the mouse.
7. **Prefetch the 3D chunk** on `/classic` idle time if visitors often go there first (only if analytics say so).
