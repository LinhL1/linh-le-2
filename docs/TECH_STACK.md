# Tech stack

What each technology is, the role it actually plays here, and what to learn next. Versions are the
installed ones (`node_modules`), checked 2026-10-05.

## At a glance

| Layer | Technology | Used for |
|---|---|---|
| Language | TypeScript 5.8 (non-strict) | all source |
| UI framework | React 18.3 | everything |
| Build/dev | Vite 5.4 + SWC React plugin | dev server, bundling, code-splitting |
| Routing | react-router-dom 6.30 | `/`, `/classic`, `/projects`, `*` |
| 3D engine | three 0.169 | scene objects, maths, WebGL rendering |
| 3D in React | @react-three/fiber 8.18 | JSX scene, render loop, pointer events |
| 3D helpers | @react-three/drei 9.122 (brings three-stdlib 2.36) | orbit controls, DOM-on-surface, environment, contact shadows, rounded boxes, GLTF loading |
| Styling (classic) | Tailwind CSS 3.4 + CSS variables | classic site |
| Styling (retro) | plain CSS (`retro.css`) | LINH-OS desktop and 3D page chrome |
| UI primitives | shadcn/ui on Radix | `Dialog` (project details), toasts, tooltip provider |
| Animation (DOM) | Framer Motion 12 | classic entrance animations, card stack, postcard flips |
| Email | @emailjs/browser 4 | classic contact postcard |
| Icons | lucide-react | classic site icons |
| Tests | Vitest 3 + Testing Library + jsdom | retro logic and desktop UI |
| Lint | ESLint 9 + typescript-eslint + react-hooks + react-refresh | `npm run lint` |

Backend: **none**. No server, database, auth or API routes.

---

## three.js

**What it is.** A JavaScript 3D library that wraps WebGL. It provides a scene graph (`Scene`,
`Group`, `Mesh`), cameras, geometries, materials, lights, loaders, maths (`Vector3`, `Quaternion`,
`Matrix4`, `Euler`) and the `WebGLRenderer`.

**Why this project uses it.** It's the engine under the 3D desk. R3F and drei are built on it.

**Where.** Directly imported in `src/retro/scene/*`:
- maths: `Vector3`, `Euler`, `Quaternion`, `MathUtils` (RetroScene, CameraRig, ProceduralComputer)
- geometry building: `BoxGeometry`, `SphereGeometry`, `ExtrudeGeometry` + `Shape`/`Path`, `TubeGeometry` + `CatmullRomCurve3`
- materials/textures: `MeshStandardMaterial`, `MeshBasicMaterial`, `CanvasTexture`, `SRGBColorSpace`, `RepeatWrapping`, `DoubleSide`
- instancing: `InstancedMesh`, `Object3D` (as a matrix "dummy"), `Color`
- types/disposal: `Mesh`, `Material`, `Texture` (GlbComputer)

**Core concepts to understand.** Scene graph, transforms, `Vector3` mutability, geometry vs material,
`dispose()` for GPU memory, colour spaces. All in [3D_GUIDE.md](3D_GUIDE.md).

**Important APIs here.** `vector.clone()/add/sub/lerp/normalize/addScaledVector/distanceToSquared`,
`vector.applyEuler`, `Quaternion.setFromUnitVectors`, `geometry.attributes.position` +
`computeVertexNormals()`, `instancedMesh.setMatrixAt/setColorAt` + `needsUpdate`, `camera.lookAt`, `object.traverse`.

**Interacts with.** R3F creates and owns three objects from JSX; drei builds on both; OrbitControls
(from three-stdlib) moves the three camera.

**Learn next.** [Discover three.js](https://discoverthreejs.com/) (book, free online) chapters on the
scene graph, transforms and lighting; the three.js manual pages on
[transformations](https://threejs.org/manual/#en/scenegraph), [materials](https://threejs.org/manual/#en/materials),
[textures](https://threejs.org/manual/#en/textures), [cleanup](https://threejs.org/manual/#en/cleanup).

---

## React Three Fiber (R3F)

**What it is.** A React renderer for three.js. Instead of rendering to the DOM, React renders to a
three.js scene. `<mesh position={[0,1,0]}>` creates a `THREE.Mesh` and sets `.position`.

**Why this project uses it.** The whole app is React; R3F lets the 3D scene be React components
with props and state (`poweredOn`, `active`) instead of a separate imperative engine (reasoning not
documented; INFERRED). It also provides pointer events with raycasting and a demand-driven render loop.

**Where.** `<Canvas>` in [RetroScene.tsx](../src/retro/scene/RetroScene.tsx); `useFrame`/`useThree` in
[CameraRig.tsx](../src/retro/scene/CameraRig.tsx); `ThreeEvent` handlers on the computer group;
lowercase JSX elements throughout the scene files.

**Core concepts.**
- **JSX ↔ three classes:** lowercase tags are three classes; `args` = constructor arguments; props = properties; dashed props set nested fields.
- **`<Canvas>`** creates renderer, scene, camera, and a render loop. Its config here: `frameloop="demand"`, `dpr`, `camera`, `gl`, `eventSource`, `eventPrefix`, `onCreated`.
- **`useFrame(cb, priority)`** runs `cb(state, delta)` before each rendered frame. Mutate refs here, never set state.
- **`useThree(selector)`** reads the store: `camera`, `controls` (set by `makeDefault`), `invalidate`, `size`, `gl`.
- **`invalidate()`** requests a frame (essential with `frameloop="demand"`).
- **Events:** `onClick`, `onPointerOver/Out/Move/Down/Up`, bubbling, `stopPropagation`, `e.delta`, `e.point`.
- **`<primitive object={…}>`** inserts an existing three object (used for GLB scenes).
- **Suspense** integration (`useGLTF` suspends while loading).

**Interacts with.** three.js (owns its objects), drei (helpers are R3F components), React (state flows in as props), the DOM (event source).

**Learn next.** R3F docs: [Your first scene](https://docs.pmnd.rs/react-three-fiber/getting-started/your-first-scene),
[Events](https://docs.pmnd.rs/react-three-fiber/api/events), [Hooks](https://docs.pmnd.rs/react-three-fiber/api/hooks),
[Performance pitfalls](https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls) (read this one early),
[Scaling performance / on-demand rendering](https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance).

---

## drei

**What it is.** A collection of R3F components and hooks for common needs.

**Why / where — every drei piece used here:**

| drei API | Where | What it does here |
|---|---|---|
| `OrbitControls` | RetroScene | idle camera orbit with limits and damping; `makeDefault` exposes it as `state.controls` for CameraRig |
| `Html` | ScreenSlot | mounts the DOM desktop onto the screen glass with CSS 3D transforms; `occlude="blending"` cuts the canvas hole |
| `Environment` + `Lightformer` | RetroScene | builds a tiny procedural environment map once for PBR reflections |
| `ContactShadows` | RetroScene | fake soft shadow under the desk props, rendered once |
| `RoundedBox` | ProceduralComputer | rounded-edge boxes |
| `useGLTF` | GlbComputer | loads/caches a `.glb` (only if configured) |

**Core concepts.** `Html` creates a *separate React root* (no outer context); `Environment frames={1}`
and `ContactShadows frames={1}` render once (static scene assumption); `OrbitControls` only updates
the camera while `enabled`.

**Learn next.** [drei docs/storybook](https://drei.docs.pmnd.rs/): read the pages for the six APIs above, then `Bounds`, `PresentationControls`, `useHelper`, `Stats` (handy for debugging).

---

## React 18 + TypeScript

**Role.** All UI, including the 3D scene's composition. TypeScript is configured **non-strict**
(`strict: false`, `strictNullChecks: false`, `noImplicitAny: false`), so the compiler won't catch
null/undefined mistakes. The retro code is still written carefully typed (discriminated unions in
`model.config.ts`, typed reducer actions, `as const` app ids).

**Patterns used that matter here.** `useReducer` with a pure reducer (desktop), context to bridge a
separate React root (DesktopContext), `React.lazy` + `Suspense` + an error boundary (3D chunk),
refs for anything high-frequency, `useLayoutEffect` for measuring/instance setup, `useId` for ARIA.

**Learn next.** React docs on [refs and effects ("You might not need an effect")](https://react.dev/learn/you-might-not-need-an-effect), `useReducer`, `lazy`/`Suspense`. Turning on `strictNullChecks` is a good TypeScript exercise (see [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md)).

---

## Vite

**Role.** Dev server on port 8080 with hot reload, production bundler. Notable config ([vite.config.ts](../vite.config.ts)):
`@` → `src` alias; `dedupe` for React and TanStack Query (prevents two React copies); the `lovable-tagger`
plugin in development mode only (tags components for the Lovable editor); HMR error overlay disabled.

**Things it does for you here.** Turns `React.lazy(() => import(...))` into a separate chunk
(`RetroScene-*.js`, which contains three/R3F/drei); fingerprints imported images and fonts; serves
`public/` as-is; exposes `import.meta.env.BASE_URL` (used in the GLB example URL).

**Note.** No `base` is configured, so the build assumes it's served from the domain root (see
[UNKNOWN.md](UNKNOWN.md) about the deployment target).

**Learn next.** Vite guide: [static asset handling](https://vitejs.dev/guide/assets), [build & base](https://vitejs.dev/guide/build), [env variables](https://vitejs.dev/guide/env-and-mode).

---

## react-router-dom v6

**Role.** `BrowserRouter` + `Routes` in `App.tsx`. `useLocation` picks the loader variant;
`useNavigate` in `Retro.tsx` is passed down into the 3D/2D desktop. Classic pages use `<Link>`.
No `basename` is set.

---

## Tailwind CSS + design tokens (classic only)

**Role.** Classic-site styling with utility classes. Colours are CSS variables in `index.css`
(`:root` and `.dark`), mapped to Tailwind names in `tailwind.config.ts`. Dark mode is `class`-based.
Explained in depth in [hiw.md §6–8, §12](../hiw.md).

**Not used by the retro desktop**, which has its own scoped stylesheet `src/retro/retro.css`
(variables prefixed `--r-`, everything under `.retro-desktop`/`.retro-page`, so the two sites don't
leak into each other; CONFIRMED by the comment at its top).

---

## shadcn/ui + Radix

**Role.** shadcn copies component source into `src/components/ui/`. Only four are used by app code:
`dialog` (ProjectDetailDialog), `toaster`/`toast` and `sonner` (mounted in App, no calls found), `tooltip` (provider only).
The rest (~45 files) are unused scaffolding. Radix provides the accessible behaviour (focus trap, Esc, ARIA) inside `Dialog`.

---

## Framer Motion

**Role (classic site only).** Entrance animations (`initial`/`whileInView`), the navbar slide-in,
the project card stack (`animate` with `y/scale/rotateX/zIndex`), event postcard flips (`rotateY`),
the postcard stamp wobble. **Not used in the 3D scene**: camera motion there is hand-written in `useFrame`.

**Distinction worth knowing.** Framer Motion animates **DOM/CSS** properties (including CSS 3D
transforms). It doesn't animate three.js objects. (A sibling library, `framer-motion-3d`/`motion` for R3F, exists but isn't used.)

---

## EmailJS

**Role.** `Postcard.tsx` calls `emailjs.send(service, template, params, publicKey)` so the classic
contact form sends real email with no backend. The IDs are hard-coded; EmailJS public keys are designed
to be exposed in the browser, and abuse is controlled from the EmailJS dashboard (allowed origins, rate limits).

---

## Testing: Vitest + Testing Library + jsdom

**Role.** `npm test` runs `src/**/*.{test,spec}.{ts,tsx}` in jsdom. `src/test/setup.ts` adds
jest-dom matchers and a `matchMedia` stub. The retro tests cover the reducer, terminal, mode decision,
icons, security data and desktop UI behaviour.

**Limit.** jsdom has no WebGL and no layout, so the 3D scene isn't covered by tests. `Desktop` falls back to
a fixed area size (`FALLBACK_AREA`) when it can't measure.

**Playwright** is a dev dependency with a config file, but the config imports
`lovable-agent-playwright-config` which isn't installed, and there are no e2e specs (CONFIRMED).

---

## Installed but not really used

| Package | Status |
|---|---|
| `@tanstack/react-query` | provider mounted in `App.tsx`, no queries |
| `recharts`, `embla-carousel-react`, `react-hook-form`, `@hookform/resolvers`, `zod`, `cmdk`, `vaul`, `input-otp`, `react-day-picker`, `date-fns`, `react-resizable-panels` | only referenced by unused shadcn components |
| `next-themes` | imported by `ui/sonner.tsx`; there's no `ThemeProvider`, and the real dark mode is the Navbar's class toggle |
| `gh-pages` | installed; no npm script uses it |

These are almost certainly from the Lovable/shadcn starter template (INFERRED: the package name is
`vite_react_shadcn_ts`). Vite tree-shakes unused imports, so they mostly cost install time, not bundle size.
