# Build notes

> **Note (2026-10-05):** the maintained documentation now lives in [`docs/`](docs/README.md). These notes are
> still a good guide to the classic site (Tailwind, design tokens, Framer Motion, postcard), but some
> sections are out of date: project structure (§3), routes (§9, §15), hero dark-mode swap (§12.4) and
> deployment (§16). See [docs/DEVELOPMENT_NOTES.md](docs/DEVELOPMENT_NOTES.md) #7.

---

## Table of Contents
1. [The Big Picture](#1-the-big-picture)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [HTML, CSS & How Browsers Render Pages](#4-html-css--how-browsers-render-pages)
5. [TypeScript & React](#5-typescript--react)
6. [Tailwind CSS — Utility-First Styling](#6-tailwind-css--utility-first-styling)
7. [The Design System (CSS Variables + Tokens)](#7-the-design-system-css-variables--tokens)
8. [Custom Fonts](#8-custom-fonts)
9. [Component Architecture](#9-component-architecture)
10. [Animations with Framer Motion](#10-animations-with-framer-motion)
11. [State & Interactivity](#11-state--interactivity)
12. [Dark Mode](#12-dark-mode)
13. [The Postcard / Email Feature](#13-the-postcard--email-feature)
14. [The Custom Cursor](#14-the-custom-cursor)
15. [Routing](#15-routing)
16. [Build & Deployment](#16-build--deployment)
17. [Concepts to Master Next](#17-concepts-to-master-next)
18. [The Retro Desktop (`/`)](#18-the-retro-desktop-)

---

## 1. The Big Picture

A portfolio site is a **single-page application (SPA)**. Unlike traditional websites where clicking a link loads an entirely new HTML page from a server, an SPA loads *one* HTML file and then JavaScript dynamically swaps out what's shown on screen.

```
Browser requests linh-le → Server returns one index.html → 
JavaScript (React) takes over → React renders all sections → 
Scrolling/clicking changes what's visible without page reloads
```

The site is structured as a vertical scroll with named sections:
`Hero → About → Experience → Projects → Contact → Footer`

Each section is its own **React component** — a self-contained piece of UI with its own logic, styles, and markup.

---

## 2. Technology Stack

| Tool | What it does | Why this project uses it |
|---|---|---|
| **React 18** | Builds the UI from reusable components | Industry standard; makes complex UIs manageable |
| **TypeScript** | JavaScript + type safety | Catches bugs before you run the code |
| **Vite** | Development server + build tool | Extremely fast; replaces older tools like webpack |
| **Tailwind CSS** | Utility-class styling system | Write styles directly in HTML/JSX, no separate CSS files needed |
| **Framer Motion** | Animation library | Declarative, powerful animations with minimal code |
| **Radix UI** | Accessible UI primitives | Handles keyboard nav, ARIA, focus trapping so you don't have to |
| **shadcn/ui** | Pre-built component library built on Radix | Copy-paste components you fully own and can edit |
| **React Router** | Client-side routing | Handles `/`, `/about`, etc. without page reloads |
| **EmailJS** | Send emails from the frontend | No backend needed — the contact form sends real emails |
| **React Hook Form + Zod** | Form state + validation | Clean form handling with schema-based validation |
| **GitHub Pages + gh-pages** | Free static site hosting | Deploys directly from your git repo |

---

## 3. Project Structure

```
linh-le/
├── src/
│   ├── assets/              ← Images, fonts, static files
│   │   ├── fonts/           ← ZT Formom, ZT Bros Oskon 90s (local font files)
│   │   ├── projects/        ← Project screenshots
│   │   ├── background.png   ← Hero background (light mode)
│   │   ├── background_dark.png
│   │   ├── closed_envelope.png
│   │   └── open_envelope.png
│   │
│   ├── components/          ← Every visual section of the site
│   │   ├── ui/              ← shadcn/ui components (Button, Dialog, etc.)
│   │   ├── HeroSection.tsx  ← "Fancy seeing you here" landing screen
│   │   ├── AboutSection.tsx ← Bio, photo, postcard, envelope
│   │   ├── ExperienceSection.tsx
│   │   ├── ProjectsSection.tsx ← The card-stack flip interaction
│   │   ├── ContactSection.tsx  ← Links + postcard form
│   │   ├── Postcard.tsx        ← The interactive email postcard
│   │   ├── Navbar.tsx          ← Fixed navigation bar
│   │   ├── Footer.tsx
│   │   └── cursorEffect.tsx    ← Custom mouse cursor (desktop only)
│   │
│   ├── pages/
│   │   ├── Index.tsx        ← The "page" that composes all sections together
│   │   └── NotFound.tsx     ← 404 page
│   │
│   ├── hooks/
│   │   └── use-mobile.tsx   ← Custom hook to detect mobile screen size
│   │
│   ├── App.tsx              ← Root component, sets up routing
│   ├── main.tsx             ← Entry point — mounts React into the DOM
│   └── index.css            ← Global styles, CSS variables, Tailwind directives
│
├── public/                  ← Files served as-is (favicon, robots.txt)
├── tailwind.config.ts       ← Tailwind customization (colors, fonts, breakpoints)
├── vite.config.ts           ← Vite dev server + build configuration
├── tsconfig.json            ← TypeScript compiler settings
└── package.json             ← Dependencies and npm scripts
```

---

## 4. HTML, CSS & How Browsers Render Pages

Even though you write React (`.tsx` files), everything ultimately becomes plain **HTML + CSS + JavaScript** in the browser. React is just a tool that generates that HTML automatically.

### The entry point
`index.html` in the project root has one key line:
```html
<div id="root"></div>
```
React finds this `div` and renders everything inside it. You never edit `index.html` directly.

`main.tsx` is the JavaScript entry point:
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```
This is what "mounts" React — it tells React to take over that `#root` div.

### How CSS works
CSS rules target HTML elements and apply styles. The browser reads styles from top to bottom and applies the last matching rule (the "cascade").

Key CSS concepts used in this project:
- **`position: absolute/relative/fixed`** — how elements are positioned in space
  - `relative`: positioned relative to its normal flow position; also acts as an anchor for `absolute` children
  - `absolute`: removed from flow, positioned relative to the nearest `relative` parent
  - `fixed`: stays in place as the page scrolls (used for the navbar and cursor)
- **`z-index`**: controls which element appears "on top" when elements overlap (higher number = on top)
- **`overflow: hidden`**: clips content that extends outside an element's bounds
- **`transform: translate/scale/rotate`**: moves/scales/rotates elements without affecting layout flow
- **CSS Custom Properties (variables)**: `--background: 40 33% 96%` — reusable values defined once, used everywhere

---

## 5. TypeScript & React

### Why TypeScript?
TypeScript is JavaScript with type annotations. Instead of finding out a variable is `undefined` when your site crashes in the browser, TypeScript tells you at the moment you write the code.

```ts
// JavaScript — no error until runtime
const name = getUser().name.toUpperCase() // crashes if getUser() returns null

// TypeScript — error immediately in your editor
const name = getUser()?.name.toUpperCase() // forces you to handle the null case
```

### React fundamentals used in this project

**Components** are functions that return JSX (HTML-like syntax):
```tsx
const HeroSection = () => {
  return (
    <section className="min-h-screen">
      <h1>Fancy seeing you here</h1>
    </section>
  )
}
```

**Props** pass data into components (not used heavily here since sections are self-contained).

**State** (`useState`) stores values that can change — when they change, React re-renders the component:
```tsx
const [envelopeOpen, setEnvelopeOpen] = useState(false)
// envelopeOpen starts as false
// setEnvelopeOpen(true) changes it → component re-renders showing the open envelope
```

**Effects** (`useEffect`) run code after a render, or when values change:
```tsx
useEffect(() => {
  // runs once when component mounts
  const observer = new MutationObserver(...)
  return () => observer.disconnect() // cleanup when component unmounts
}, []) // empty array = only run once
```

**Refs** (`useRef`) give direct access to a DOM element without causing re-renders:
```tsx
const cardRef = useRef(null)
// later: cardRef.current.offsetHeight gives the element's height in pixels
```

---

## 6. Tailwind CSS — Utility-First Styling

Tailwind replaces writing separate CSS files. Instead of:
```css
/* styles.css */
.hero { display: flex; align-items: center; min-height: 100vh; padding-top: 5rem; }
```

You write classes directly in JSX:
```tsx
<section className="flex items-center min-h-screen pt-20">
```

### How Tailwind classes map to CSS
| Tailwind class | CSS equivalent |
|---|---|
| `flex` | `display: flex` |
| `items-center` | `align-items: center` |
| `min-h-screen` | `min-height: 100vh` |
| `pt-20` | `padding-top: 5rem` (20 × 0.25rem) |
| `text-background` | `color: hsl(var(--background))` |
| `hidden` | `display: none` |
| `absolute` | `position: absolute` |
| `z-10` | `z-index: 10` |
| `w-2/3` | `width: 66.666%` |

### Responsive prefixes
Classes prefixed with a breakpoint only apply at that screen size and above:
```tsx
<h1 className="text-7xl md:text-4xl lg:text-9xl">
{/* Mobile: 7xl | Tablet (768px+): 4xl | Desktop (1024px+): 9xl */}
```
Breakpoints: `sm` = 640px, `md` = 768px, `lg` = 1024px, `xl` = 1280px

### Dark mode prefix
`dark:` applies a class only when the dark mode class is active on `<html>`:
```tsx
<em className="text-sage dark:text-butter/80">
{/* Light: sage green | Dark: butter yellow at 80% opacity */}
```

### Opacity modifier
`/XX` appends opacity to any color:
```tsx
text-background/70   →  color: hsl(var(--background) / 0.7)
bg-foreground/20     →  background: hsl(var(--foreground) / 0.2)
```

---

## 7. The Design System (CSS Variables + Tokens)

`index.css` defines all colors as **CSS custom properties** in HSL format. This is what makes dark mode work — you change one set of variables instead of rewriting every component.

```css
:root {
  --background: 40 33% 96%;   /* warm cream */
  --foreground: 160 10% 12%;  /* near-black */
  --sage: 84 44% 34%;         /* muted green */
  --butter: 49 68% 71%;       /* warm yellow */
}

.dark {
  --background: 160 25% 7%;   /* deep dark */
  --foreground: 40 25% 90%;   /* warm light */
  --taro: 272 18% 48%;        /* muted purple, dark mode only */
}
```

HSL stands for **Hue, Saturation, Lightness**:
- **Hue** (0–360): the color on the color wheel (0=red, 120=green, 240=blue, 270=purple)
- **Saturation** (0–100%): how vivid the color is (0% = gray, 100% = pure color)
- **Lightness** (0–100%): how light or dark (0% = black, 50% = true color, 100% = white)

Tailwind is configured in `tailwind.config.ts` to read these variables:
```ts
colors: {
  background: "hsl(var(--background))",
  sage: "hsl(var(--sage))",
  butter: "hsl(var(--butter))",
}
```

This is why you can write `text-background`, `bg-sage`, `text-butter` — Tailwind knows to look up the CSS variable.

---

## 8. Custom Fonts

Three font roles are defined in `index.css`:

```css
--font-display: 'ZTOskon', Georgia, serif;   /* headings, display text */
--font-body:    'Source Serif 4', Georgia, serif;  /* paragraphs */
--font-sans:    'Inter', system-ui, sans-serif;    /* labels, small UI text */
```

**Local fonts** (ZT Bros Oskon 90s) are loaded with `@font-face` — this tells the browser where to find the font file:
```css
@font-face {
  font-family: 'ZTOskon';
  src: url('./assets/fonts/oksan/.../ZTBrosOskon90s-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
}
```

**Google Fonts** (Source Serif 4, Inter) are loaded via a URL import from Google's CDN — faster because they're cached across sites.

In `tailwind.config.ts`, these CSS variables are wired to Tailwind font families:
```ts
fontFamily: {
  display: ["var(--font-display)"],
  body:    ["var(--font-body)"],
  sans:    ["var(--font-sans)"],
}
```

So `font-display`, `font-body`, `font-sans` become valid Tailwind classes.

---

## 9. Component Architecture

### How sections connect
`Index.tsx` is the "page" — it imports and stacks every section:
```tsx
const Index = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <HeroSection />
    <AboutSection />
    <ExperienceSection />
    <ProjectsSection />
    <ContactSection />
    <Footer />
  </div>
)
```

`App.tsx` wraps this with a router:
```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

### The `@` import alias
`vite.config.ts` sets up `@` as a shortcut for the `src/` folder:
```ts
resolve: { alias: { "@": path.resolve(__dirname, "./src") } }
```
So `import myPhoto from "@/assets/me.jpg"` instead of `"../../../assets/me.jpg"`.

### The hero section background
The hero uses a positioned `<img>` instead of a CSS `background-image` — this lets `object-fit: cover` scale the image correctly without distortion:
```tsx
<section className="relative min-h-screen">
  <div className="absolute inset-6 overflow-hidden">
    <img src={isDark ? backgroundDarkImg : backgroundImg} className="w-full h-full object-cover" />
  </div>
  <div className="relative z-10 ...content...">
```
`inset-6` = top/right/bottom/left all set to 1.5rem, creating the "bordered" effect.

### The projects card stack
`ProjectsSection.tsx` implements a stacked card deck that flips on scroll/swipe:
- An array of project objects defines all content
- `useState(0)` tracks which card is on top (`current`)
- `getCardStyle(rel)` takes the **relative index** (`i - current`) and returns transform values:
  - `rel === 0` = front card (full scale, full opacity)
  - `rel === 1` = second card (slightly scaled down, offset behind)
  - `rel < 0` = already-seen cards (hidden above, rotated out)
- Framer Motion animates between these states smoothly
- `useRef` + event listeners handle both mouse wheel and touch swipe

---

## 10. Animations with Framer Motion

Framer Motion replaces manual CSS transitions and `requestAnimationFrame` loops with declarative code.

### Entrance animations
```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}   // start: invisible, 40px down
  whileInView={{ opacity: 1, y: 0 }} // end: visible, normal position
  viewport={{ once: true }}          // only trigger once, not on re-scroll
  transition={{ duration: 0.8, delay: 0.2 }}
>
```
`whileInView` fires when the element enters the viewport (scroll-triggered).

### The navbar entrance
```tsx
<motion.nav
  initial={{ y: -100 }}   // starts 100px above viewport
  animate={{ y: 0 }}       // slides down to position
  transition={{ duration: 0.6, ease: "easeOut" }}
>
```

### Spring physics
A spring transition bounces naturally, like a real spring:
```tsx
transition={{ type: "spring", stiffness: 700, damping: 22 }}
// stiffness: how tight the spring is (higher = snappier)
// damping: how quickly it stops bouncing (higher = less bounce)
```

### The `useCallback` + `useRef` pattern in ProjectsSection
```tsx
const locked = useRef(false) // ref doesn't cause re-render when changed

const goTo = useCallback((next: number) => {
  if (locked.current) return  // prevent rapid flipping
  locked.current = true
  setCurrent(next)
  setTimeout(() => { locked.current = false }, 700)
}, [current])
```
`useRef` is used for `locked` because changing it shouldn't trigger a re-render — it's just a guard value.

---

## 11. State & Interactivity

### The navbar scroll behavior
The navbar detects when the about section reaches the top:
```tsx
const handleScroll = () => {
  const about = document.getElementById("about")
  const threshold = about ? about.offsetTop - 80 : window.innerHeight * 0.9
  setScrolled(window.scrollY >= threshold)
}
```
- `offsetTop` = distance of the element from the top of the document
- When you've scrolled past that point, `scrolled` becomes `true`
- The navbar class changes based on `scrolled`: transparent → frosted glass + moves from `top-6` to `top-0`

### Dark mode toggle
The Navbar toggles a `dark` class on `<html>`:
```tsx
document.documentElement.classList.toggle("dark", isDark)
```
This is what triggers all `dark:` Tailwind variants and CSS variable overrides simultaneously.

### The envelope interaction
```tsx
const [envelopeOpen, setEnvelopeOpen] = useState(false)

<a
  onMouseEnter={() => setEnvelopeOpen(true)}
  onMouseLeave={() => setEnvelopeOpen(false)}
>
  <img className={envelopeOpen ? "hidden" : ""} src={closedEnvelope} />
  <img className={envelopeOpen ? "" : "hidden"} src={openEnvelope} />
</a>
```
No animation library needed — just conditional `hidden` class for an instant swap.

---

## 12. Dark Mode

Dark mode involves three coordinated layers:

**1. CSS variables** — `index.css` defines two sets:
```css
:root { --background: 40 33% 96%; }   /* light */
.dark { --background: 160 25% 7%; }   /* dark */
```

**2. Tailwind dark mode config** — `tailwind.config.ts`:
```ts
darkMode: ["class"]  // use .dark class on <html>, not prefers-color-scheme
```

**3. The toggle** in Navbar:
```tsx
document.documentElement.classList.toggle("dark", isDark)
```

**4. React state in HeroSection** — the background image can't swap via CSS alone (it's an `<img>` element), so a MutationObserver watches for the `.dark` class:
```tsx
useEffect(() => {
  const check = () => setIsDark(document.documentElement.classList.contains("dark"))
  const observer = new MutationObserver(check)
  observer.observe(document.documentElement, { attributeFilter: ["class"] })
  return () => observer.disconnect()
}, [])
```

---

## 13. The Postcard / Email Feature

`Postcard.tsx` sends real emails from the browser using **EmailJS** — no server required.

```tsx
await emailjs.send(
  "service_hhcqstc",   // your EmailJS service ID
  "template_v3jut8s",  // your EmailJS template ID
  { name, email, message },
  "6c5-lTchA_jm6cYT0"  // your public key
)
```

EmailJS acts as a bridge: it takes your template, fills in the variables, and sends the email from their server using your connected email provider (Gmail, Outlook, etc.).

The `stamped` state triggers a CSS animation on the stamp and a shake on the card:
```tsx
<motion.div
  animate={stamped ? { rotate: [0, -1, 1, 0], scale: [1, 0.98, 1] } : {}}
>
```
`[0, -1, 1, 0]` is a keyframe sequence — Framer Motion animates through each value in order.

---

## 14. The Custom Cursor

`cursorEffect.tsx` replaces the browser's default cursor with two custom elements:
- A small **dot** that follows the mouse instantly
- A larger **ring** that lags behind smoothly (using lerp — linear interpolation)

```tsx
// Lerp formula: moves "a" toward "b" by fraction "t" each frame
const lerp = (a, b, t) => a + (b - a) * t

// In the animation loop:
ringX = lerp(ringX, mouseX, 0.14) // moves 14% of the remaining distance each frame
```

`requestAnimationFrame` runs this 60 times per second, creating the smooth trailing effect.

The CSS hides the real cursor on desktop:
```css
@media (min-width: 768px) {
  * { cursor: none !important; }
}
```

On mobile (`pointer: coarse` = touch screen), the component exits early — you don't need a custom cursor when there's no mouse.

---

## 15. Routing

`react-router-dom` handles navigation between pages without reloading:

```tsx
// App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

The `*` route catches any URL that doesn't match — showing the 404 page.

Within-page navigation (clicking "About", "Projects" etc. in the navbar) doesn't use React Router — it uses the native browser `scrollIntoView`:
```tsx
document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
```

---

## 16. Build & Deployment

### Development
```bash
npm run dev
```
Vite starts a local server at `localhost:8080`. It uses **Hot Module Replacement (HMR)** — when you save a file, only that component updates in the browser instantly without a full page reload.

### Building for production
```bash
npm run build
```
Vite:
1. Bundles all TypeScript/JSX into optimized JavaScript
2. Processes Tailwind — removes any classes you didn't use (tree-shaking)
3. Optimizes and hashes asset filenames for caching
4. Outputs everything to `dist/`

### Deploying to GitHub Pages
```bash
npm run build && npx gh-pages -d dist
```
`gh-pages` pushes the `dist/` folder to a `gh-pages` branch on your GitHub repo. GitHub then serves it at `LinhL1.github.io/linh-le`.

`package.json` sets the homepage URL so Vite knows the base path:
```json
"homepage": "https://LinhL1.github.io/linh-le"
```

---

## 17. Concepts to Master Next

Now that you understand what's in this project, here's a progression to deepen your skills:

### Solidify the fundamentals
- **CSS layout**: learn Flexbox and Grid deeply — every layout decision uses these
- **The box model**: `padding`, `margin`, `border`, `box-sizing` — how space is calculated
- **Positioning**: spend time with `absolute`/`relative`/`fixed`/`sticky`
- **CSS specificity**: why some styles override others

### React patterns
- **`useReducer`** — better than multiple `useState` when state is complex
- **`useContext`** — share state across components without prop-drilling (dark mode is a classic use case)
- **`useMemo`/`useCallback`** — performance optimization for expensive calculations
- **Custom hooks** — extract reusable logic (like the scroll detection) into `useScrollPosition()`

### TypeScript
- **Interfaces and types**: define the shape of your data
- **Generic types**: write functions that work for multiple types
- **Union types**: `"light" | "dark"` instead of just `string`

### Animation
- **CSS transitions and keyframes**: understand the underlying mechanics before relying on Framer Motion
- **Framer Motion layout animations**: `layoutId` for shared element transitions between pages
- **Scroll-driven animations**: `useScroll` + `useTransform` from Framer Motion

### Performance
- **Lazy loading**: `React.lazy()` + `Suspense` to load components only when needed
- **Image optimization**: `loading="lazy"`, proper sizing, WebP format
- **Core Web Vitals**: LCP, CLS, FID — what Google measures for SEO

### Backend basics (when you're ready)
- **REST APIs**: how frontend and backend communicate with JSON
- **Fetch / Axios**: making HTTP requests from React
- **Authentication**: how login/session management works
- Everything in this portfolio is "frontend-only" — real apps need a server for private data, databases, and auth

### Tools to get familiar with
- **Git / GitHub**: version control — always commit before big changes
- **Chrome DevTools**: inspect elements, debug CSS, monitor network requests
- **Figma**: design before you build — saves enormous refactoring time
- **Storybook**: develop and test components in isolation

---

## 18. The Retro Desktop (`/`)

`/` is a 3D beige computer whose screen runs a real React "LINH-OS" desktop. The editorial site moved to `/classic`, and `/projects` is unchanged.

**Where things live**
- `src/data/experience.ts`, `profile.ts` (bio, stats, contact, socials) and `security.ts` (cyber framing) are shared by both sites, so edit content there.
- `src/retro/desktop/` holds the desktop, windows, taskbar, the six apps and the terminal (`terminal/commands.ts` is a pure function, so it's easy to test).
- `src/retro/scene/` holds the three.js scene. It's lazy-loaded, so three.js only downloads when the 3D view is used.
- `src/retro/useRetroMode.ts` decides between 3D and 2D: 2D on viewports under 900×600, with `prefers-reduced-motion`, without WebGL, or with `?mode=2d`.

**How the screen works**
drei's `<Html transform occlude="blending">` places the desktop DOM behind the WebGL canvas and cuts a transparent hole where the glass is. The text stays crisp and fully interactive. Because the canvas then ignores pointer events, the `<Canvas>` uses `eventSource` (the wrapper div) for clicks and orbiting. Nothing in the model may sit at exactly the screen's depth, or it z-fights with the hole and the screen goes pale and dithered.

**Swapping in a downloaded model**
Put the `.glb` in `public/models/`, change `COMPUTER_MODEL` in `src/retro/scene/model.config.ts` (an example is commented there), tune `screen` until the desktop lines up with the glass, and credit the model in `CREDITS.md`.

**Cursor**
`CursorEffect` only runs on the classic routes and toggles `html.custom-cursor`, which is what hides the system cursor. The retro desktop has its own pixel arrow.

---

*This site was built iteratively — start with structure, get the layout right, then layer in styles, then add animations. That order matters. Good luck!*
