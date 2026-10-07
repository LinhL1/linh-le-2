# Project structure

The git repository is `linh-le/` (remote `github.com/LinhL1/linh-le-2`). The folder above it
(`linh_le_2/`) only holds a `.claude/` settings folder.

```text
linh-le/
├── index.html                 HTML shell: <div id="root"> + module script
├── package.json               scripts + dependencies (npm is the active package manager)
├── vite.config.ts             dev server :8080, "@" alias → src, React dedupe, lovable-tagger in dev
├── vitest.config.ts           jsdom test environment, setup file, "@" alias
├── tailwind.config.ts         classic-site theme: colours from CSS variables, fonts, animations
├── eslint.config.js           flat config: TS + react-hooks + react-refresh
├── tsconfig*.json             non-strict TS (strict: false, strictNullChecks: false)
├── components.json            shadcn/ui generator config
├── playwright.config.ts       Lovable Playwright preset (package not installed; no e2e tests)
├── CREDITS.md                 fonts / model / library licences
├── hiw.md                     original build notes for the classic site
├── docs/                      ← you are here
├── public/                    copied verbatim to the build root (favicon, robots.txt)
└── src/
    ├── main.tsx               mounts <App/>
    ├── App.tsx                providers, router, RouteChrome (loader + cursor)
    ├── index.css              global CSS: Google Fonts, @font-face, design tokens, Tailwind layers
    ├── App.css                Vite template leftover, not imported anywhere
    ├── pages/
    │   ├── Retro.tsx          "/"         3D/2D switch, lazy scene, error boundary
    │   ├── Index.tsx          "/classic"  stacks the classic sections
    │   ├── AllProjects.tsx    "/projects" three carousels by category
    │   └── NotFound.tsx       "*"
    ├── retro/                 everything for the LINH-OS experience
    │   ├── useRetroMode.ts    decideRetroMode(), hasWebGL(), useMediaQuery()
    │   ├── retro.css          all retro styles, scoped under .retro-desktop / .retro-page
    │   ├── scene/             ← the 3D world (only loaded in 3D mode)
    │   └── desktop/           ← the window manager + apps (used in 2D and 3D)
    ├── components/            classic-site sections + shadcn/ui primitives
    ├── data/                  content shared by both sites
    ├── hooks/                 use-mobile, use-toast (shadcn)
    ├── lib/utils.ts           cn() = clsx + tailwind-merge
    ├── assets/                images + fonts (imported → fingerprinted by Vite)
    └── test/                  Vitest tests (retro/ has the meaningful ones)
```

## `src/retro/scene/`: the 3D world

| File | Responsibility | Key exports | Used by |
|---|---|---|---|
| [RetroScene.tsx](../src/retro/scene/RetroScene.tsx) | Builds the `<Canvas>`, all lights, environment, contact shadows, orbit controls; owns `zoomed`/`active` state; HUD buttons; click/hover on the computer; Esc to power off. Computes the idle camera distance from the viewport aspect. | `default RetroScene` | `pages/Retro.tsx` (lazy) |
| [CameraRig.tsx](../src/retro/scene/CameraRig.tsx) | Animates camera + orbit target between the idle view and a head-on close-up of the screen, every frame, with refs. Reports "arrived". | `CameraRig` | `RetroScene` |
| [model.config.ts](../src/retro/scene/model.config.ts) | Chooses procedural vs `.glb` computer; defines where the screen glass is (`ScreenRect`) and the desktop's pixel size (800×600). **The single place to edit when swapping models.** | `COMPUTER_MODEL`, `ACTIVE_SCREEN`, `PROCEDURAL_SCREEN`, `SCREEN_PIXELS`, types | scene files |
| [ProceduralComputer.tsx](../src/retro/scene/ProceduralComputer.tsx) | The desk, base unit, CRT monitor (extruded bezel with a hole, tapered tube), instanced keyboard, mouse, cords, floppies, vase. All geometry and materials made in code and disposed on unmount. | `ProceduralComputer` | `RetroScene` |
| [NightCity.tsx](../src/retro/scene/NightCity.tsx) | Back wall with a window, sky gradient, three parallax skyline layers and three Boston landmarks; textures painted on `<canvas>` with a seeded random generator. | `NightCity`, `ROOM_COLOR` | `RetroScene` |
| [ScreenSlot.tsx](../src/retro/scene/ScreenSlot.tsx) | Places the DOM `<Desktop mode="3d">` on the glass with drei `<Html transform occlude="blending">`. Computes `distanceFactor` so 800 CSS px = screen width. | `ScreenSlot` | `RetroScene` |
| [GlbComputer.tsx](../src/retro/scene/GlbComputer.tsx) | Loads and shows a downloaded `.glb` when `COMPUTER_MODEL.kind === "glb"`; hides named meshes; frees GPU memory on unmount. **Not used by default.** | `GlbComputer` | `RetroScene` |

## `src/retro/desktop/`: the window manager

| File | Responsibility | Used by |
|---|---|---|
| [Desktop.tsx](../src/retro/desktop/Desktop.tsx) | Root of LINH-OS: measures its area, renders icons, windows, taskbar, CRT overlay; owns focus management; sets `inert` when inactive; Esc closes top window, else powers off (3D) or exits 2D mode; 2D-only corner × exit button; 3D-only manual wheel scrolling. Provides `DesktopContext`. | `ScreenSlot`, `Retro.tsx` |
| [useDesktop.ts](../src/retro/desktop/useDesktop.ts) | Pure reducer: `open`/`close`/`focus`/`move`/`closeAll`; cascade positions; z-order via a counter; `topWindow()`. | `Desktop` |
| [Window.tsx](../src/retro/desktop/Window.tsx) | A draggable dialog: clamps to the desktop area, converts pointer movement from screen px to desktop px (matters in 3D), moves the DOM directly during drag and commits on release. | `Desktop` |
| [Taskbar.tsx](../src/retro/desktop/Taskbar.tsx) | Power-off / 3D-view button, one button per open window, a clock (updates every 30 s). | `Desktop` |
| [apps.tsx](../src/retro/desktop/apps.tsx) | Registry: id → title, label, icon, window size, component. Order = icon order. | `Desktop`, `Taskbar` |
| [DesktopContext.ts](../src/retro/desktop/DesktopContext.ts) | Context so apps can open/close windows and navigate without the router. | apps |
| [icons.tsx](../src/retro/desktop/icons.tsx), [pixelIcons.ts](../src/retro/desktop/pixelIcons.ts) | 16×16 pixel-art icons as strings → merged SVG rects. | desktop, taskbar, windows |
| [apps/](../src/retro/desktop/apps/) | `AboutApp`, `ExperienceApp`, `CommunityApp`, `ProjectsApp`, `ContactApp`, `TerminalApp`: each reads `src/data`. | registry |
| [terminal/commands.ts](../src/retro/desktop/terminal/commands.ts) | Pure command interpreter: `runCommand(input, history) → { lines, action }`. Aliases, file-style `ls`/`cat`. | `TerminalApp`, tests |

## `src/data/`: content

| File | Contains | Notes |
|---|---|---|
| [profile.ts](../src/data/profile.ts) | bio, fun fact, stats, contact email, socials | shared by classic + retro |
| [projects.ts](../src/data/projects.ts) | `Project[]` with images, tools, `featured`, `category`, optional `caseStudy` | `featured` → classic carousel |
| [experience.ts](../src/data/experience.ts) | work history | |
| [events.ts](../src/data/events.ts) | community events with photos | |
| [security.ts](../src/data/security.ts) | security framing derived from experience/projects by **exact title match** | contains a `TODO(linh)` |

## `src/components/`: classic site

| File | Role |
|---|---|
| `Navbar.tsx` | fixed nav, scroll-to-section, dark-mode toggle (`.dark` on `<html>`) |
| `HeroSection.tsx` | full-screen hero; both light/dark backgrounds mounted, CSS picks one |
| `AboutSection.tsx`, `ExperienceSection.tsx`, `CommunitySection.tsx`, `ContactSection.tsx`, `Footer.tsx` | sections |
| `ProjectsSection.tsx` → `ProjectCarousel.tsx` | wheel/swipe-driven card stack (CSS 3D via Framer Motion) |
| `ProjectDetailDialog.tsx` | shadcn `Dialog` with project details / case study |
| `EventPostcard.tsx` | flip card (CSS 3D `rotateY`) for community events |
| `Postcard.tsx` | contact form that sends email via EmailJS |
| `Loader.tsx` (+ `Loader.css`) | classic sketch-frame loader and retro BIOS loader |
| `cursorEffect.tsx` | dot + lagging ring cursor using `requestAnimationFrame` and lerp |
| `ui/` | ~50 shadcn/ui primitives. Only `dialog`, `toast`/`toaster`, `sonner`, `tooltip` are imported by app code. |

## Tests: `src/test/`

| File | Covers |
|---|---|
| `retro/desktopState.test.ts` | reducer: cascade, re-open focuses, focus no-ops, move/close |
| `retro/commands.test.ts` | terminal commands, aliases, errors, actions |
| `retro/Desktop.test.tsx` | rendered desktop: open/close/focus return, Esc, terminal → open window, 2D exit (× and Esc), inert when inactive |
| `retro/retroMode.test.ts` | 3D/2D decision table, pixel icon grids, security highlight resolution |
| `example.test.ts` | placeholder |

There are **no tests for the 3D scene** (jsdom has no WebGL). 3D behaviour has to be checked in a browser.

## Files you can mostly ignore

- `src/components/ui/*` except the four listed above: generated shadcn components, unused.
- `bun.lock`, `bun.lockb`: stale (they predate the 3D dependencies). See [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md).
- `.next/dev/logs`: stray folder, not part of this Vite app (see [UNKNOWN.md](UNKNOWN.md)).
- `src/assets/me1.jpg`, `me2.jpg`, `me3.jpg`: not imported anywhere.
