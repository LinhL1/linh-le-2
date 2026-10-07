# Project documentation

Living technical documentation for the Linh Le portfolio. It explains **how the site works and why**,
with extra depth on the 3D retro computer at `/`, written for a developer who knows web development
but is new to 3D.

> Last full audit: 2026-10-05, against branch `visuals` (commit `3a61d0e`, "night backdrop").
> If the code has moved on since then, trust the code and update these docs (see [CLAUDE.md](../CLAUDE.md)).

## Start here

| If you want to… | Read |
|---|---|
| Get the 30-second overview of the whole app | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Find where something lives | [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) |
| Learn 3D concepts (vectors, cameras, meshes…) tied to this code | [3D_GUIDE.md](3D_GUIDE.md) |
| Understand how the 3D scene is put together | [3D_ARCHITECTURE.md](3D_ARCHITECTURE.md) |
| Understand clicks, hover, orbit, zoom, the on-screen desktop | [INTERACTION_GUIDE.md](INTERACTION_GUIDE.md) |
| See how content and state move through the app | [DATA_FLOW.md](DATA_FLOW.md) |
| Change something specific ("move the camera", "add an app"…) | [CHANGE_GUIDE.md](CHANGE_GUIDE.md) |
| Fix something that looks wrong | [DEBUGGING.md](DEBUGGING.md) |
| Check performance risks | [PERFORMANCE.md](PERFORMANCE.md) |
| Install, run, test, build | [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) |
| Understand each library and what to learn next | [TECH_STACK.md](TECH_STACK.md) |
| See every tool and dependency, by category | [TOOLS_AND_DEPENDENCIES.md](TOOLS_AND_DEPENDENCIES.md) |
| Know why things were built this way | [DECISIONS.md](DECISIONS.md) |
| See what is known vs inferred vs unknown | [UNKNOWN.md](UNKNOWN.md) |
| See known code issues found while documenting | [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md) |

## Suggested reading order if you're new to 3D

1. [ARCHITECTURE.md](ARCHITECTURE.md): the big picture (15 min)
2. [3D_GUIDE.md](3D_GUIDE.md) sections 1–6: coordinates, vectors, transforms, camera (45 min)
3. [3D_ARCHITECTURE.md](3D_ARCHITECTURE.md): the real scene, piece by piece
4. [INTERACTION_GUIDE.md](INTERACTION_GUIDE.md): from a mouse click to a camera zoom
5. [3D_GUIDE.md](3D_GUIDE.md) remaining sections, then [CHANGE_GUIDE.md](CHANGE_GUIDE.md)

## Other docs in the repo

- [`hiw.md`](../hiw.md): the original build notes for the **classic** site (Tailwind, dark mode,
  Framer Motion, postcard). Still useful for the classic site; some details are out of date (see the
  banner at its top and [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md)).
- [`CREDITS.md`](../CREDITS.md): fonts, 3D model and library licences.

## Confidence labels used in these docs

- **CONFIRMED**: read directly in the code, config, git history or a library's source.
- **INFERRED**: a reasonable reading of the implementation; the author didn't write the reason down.
- **UNKNOWN**: couldn't be determined from the repository.

Reasons for decisions are only stated as fact when a code comment, commit or doc says so.
