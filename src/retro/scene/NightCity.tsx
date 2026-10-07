import { useEffect, useMemo } from "react";
import { CanvasTexture, MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace } from "three";

// Back wall with a large open window onto a night skyline. Everything is generated at
// runtime on <canvas> (no image assets), from a fixed seed so the skyline is stable.

const WALL_Z = -1.95;
const WINDOW = { left: -3.4, right: 3.4, bottom: 1.05, top: 4.3 };
// Oversized so the wall fills the view at every orbit angle (no gaps at the edges).
const WALL = { left: -40, right: 40, bottom: -20, top: 30, depth: 0.15 };
/** Wall + frame colour. The page background in retro.css matches how this renders. */
export const ROOM_COLOR = "#141219";

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WINDOW_COLORS = ["#ffd27a", "#ffd27a", "#ffc061", "#ffe3a8", "#8fd3ff", "#ff9ccf"];

/** Lit-window opacity range. Kept low so the city reads as a backdrop, not a feature. */
const WINDOW_ALPHA = { min: 0.3, max: 0.7 };

/**
 * Cheap, portable blur: shrink the canvas by `factor` and stretch it back with smoothing.
 * Softens window edges and silhouettes so the city looks slightly out of focus behind the
 * computer (fake depth of field; a real DoF post-process would cost a full-screen pass per frame).
 */
function soften(canvas: HTMLCanvasElement, factor: number) {
  const small = document.createElement("canvas");
  small.width = Math.round(canvas.width / factor);
  small.height = Math.round(canvas.height / factor);
  const s = small.getContext("2d")!;
  s.imageSmoothingQuality = "high";
  s.drawImage(canvas, 0, 0, small.width, small.height);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
}

interface SkylineOptions {
  seed: number;
  /** Building height range as a fraction of the canvas height. */
  minH: number;
  maxH: number;
  /** Building width range in px (canvas is 2048 wide). */
  minW: number;
  maxW: number;
  /** Lit window size in px. */
  win: number;
  litChance: number;
  body: [number, number, number];
  /** Atmospheric haze laid over distant layers (0-1). */
  haze: number;
}

function skylineTexture(o: SkylineOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const rand = rng(o.seed);
  const H = canvas.height;

  let x = -20;
  while (x < canvas.width) {
    const w = o.minW + rand() * (o.maxW - o.minW);
    const h = H * (o.minH + rand() * (o.maxH - o.minH));
    const top = H - h;
    const shade = 0.75 + rand() * 0.5;
    const [r, g, b] = o.body.map((c) => Math.round(c * shade));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, top, w, h);

    // Stepped crown on some towers.
    if (rand() < 0.35) {
      const cw = w * (0.4 + rand() * 0.3);
      const ch = h * (0.05 + rand() * 0.08);
      ctx.fillRect(x + (w - cw) / 2, top - ch, cw, ch);
    }
    // Antenna with a red beacon.
    if (rand() < 0.18) {
      const ax = x + w * (0.3 + rand() * 0.4);
      const ah = 10 + rand() * 30;
      ctx.fillRect(ax, top - ah, 2, ah);
      ctx.fillStyle = "#ff4a4a";
      ctx.fillRect(ax - 1, top - ah - 3, 4, 4);
    }

    // Window grid.
    const gap = o.win * 1.1;
    for (let wy = top + gap; wy < H - o.win; wy += o.win + gap) {
      // Whole floors occasionally go dark, like real towers at night.
      const floorLit = rand() < 0.85;
      for (let wx = x + gap; wx < x + w - o.win; wx += o.win + gap) {
        if (floorLit && rand() < o.litChance) {
          ctx.fillStyle = WINDOW_COLORS[Math.floor(rand() * WINDOW_COLORS.length)];
          ctx.globalAlpha = WINDOW_ALPHA.min + rand() * (WINDOW_ALPHA.max - WINDOW_ALPHA.min);
          ctx.fillRect(wx, wy, o.win, o.win * 1.3);
          ctx.globalAlpha = 1;
        }
      }
    }
    x += w + rand() * 6;
  }

  if (o.haze > 0) {
    // Tint only the building pixels, keeping the sky transparent.
    ctx.globalCompositeOperation = "source-atop";
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgba(70, 50, 110, ${o.haze * 0.6})`);
    grad.addColorStop(1, `rgba(120, 60, 110, ${o.haze})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, H);
    ctx.globalCompositeOperation = "source-over";
  }

  soften(canvas, 3);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function skyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#05060f");
  grad.addColorStop(0.45, "#0c1030");
  grad.addColorStop(0.75, "#2a1a45");
  grad.addColorStop(1, "#6a3060");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // A few faint stars that survive the light pollution.
  const rand = rng(7);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + rand() * 0.45})`;
    ctx.fillRect(rand() * canvas.width, rand() * canvas.height * 0.55, 1.5, 1.5);
  }
  soften(canvas, 2);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// Layers: far → near. Sizes keep the 4:1 canvas aspect and cover the window at all orbit angles.
// maxH keeps the generic towers below the Prudential / 111 Huntington rooflines in the default view.
const LAYERS: (SkylineOptions & { z: number; width: number; y: number })[] = [
  { z: -36, width: 100, y: 0.1, seed: 11, minH: 0.21, maxH: 0.3, minW: 24, maxW: 70, win: 2, litChance: 0.34, body: [26, 24, 48], haze: 0.55 },
  { z: -23, width: 66, y: 0.4, seed: 23, minH: 0.23, maxH: 0.33, minW: 34, maxW: 96, win: 2.5, litChance: 0.34, body: [18, 17, 34], haze: 0.25 },
  { z: -12.5, width: 40, y: 0.6, seed: 37, minH: 0.28, maxH: 0.385, minW: 60, maxW: 140, win: 2.5, litChance: 0.33, body: [12, 11, 22], haze: 0 },
];

// ─── Boston landmarks ────────────────────────────────────────────────────────
// Simplified Prudential Tower, 111 Huntington and John Hancock Tower, sitting between the
// nearest skyline layer and the wall. The default camera looks down at the desk, so only a
// thin band of the view is visible through the window; positions/heights are tuned so the
// Pru + 111 Huntington pair (crowns included) shows in the right pane and the Hancock in the left.
//
// Each landmark is a flat painted cutout (a transparent plane at the tower's real position and depth),
// not 3D geometry, so it can be blurred with soften() like the skyline layers. At ~14 units from the
// camera a cutout is indistinguishable from the old boxes, and keeping each at its own depth keeps
// the parallax against the skyline when orbiting. Coordinates below are world units.

/** Texel density of the cutouts: matches the nearest skyline layer (2048 px over 40 units) so the blur matches too. */
const CUTOUT_PX_PER_UNIT = 2048 / 40;
/** Transparent margin so the blur can spread past the tower's edges. */
const CUTOUT_PAD = 0.15;

interface Bounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

type Ctx = CanvasRenderingContext2D;

/** Lit windows on a facade. Draws in world units (y up). */
function paintWindows(
  ctx: Ctx,
  rand: () => number,
  [x, y, w, h]: [number, number, number, number],
  o: { cols: number; rows: number; litChance: number; colors: string[]; bands?: boolean },
) {
  const cw = w / o.cols;
  const rh = h / o.rows;
  for (let r = 0; r < o.rows; r++) {
    const floorLit = rand() < 0.8;
    for (let c = 0; c < o.cols; c++) {
      if (!floorLit || rand() > o.litChance) continue;
      ctx.fillStyle = o.colors[Math.floor(rand() * o.colors.length)];
      ctx.globalAlpha = WINDOW_ALPHA.min + rand() * (WINDOW_ALPHA.max - WINDOW_ALPHA.min);
      // Prudential-style continuous bands, or separate windows.
      if (o.bands) ctx.fillRect(x + c * cw, y + r * rh + rh * 0.3, cw, rh * 0.4);
      else ctx.fillRect(x + c * cw + cw * 0.2, y + r * rh + rh * 0.25, cw * 0.6, rh * 0.55);
      ctx.globalAlpha = 1;
    }
  }
}

interface Landmark {
  name: string;
  seed: number;
  z: number;
  bounds: Bounds;
  paint: (ctx: Ctx, rand: () => number) => void;
}

const WARM = ["#ffd27a", "#ffe3a8", "#ffc061"];
const CROWN = "#64788a";

const LANDMARKS: Landmark[] = [
  {
    // Prudential Tower: square slab (front + a sliver of the right side), penthouse, mast and beacon.
    name: "prudential",
    seed: 101,
    z: -11,
    bounds: { x0: -0.91, x1: 0.225, y0: -6.65, y1: 1.65 },
    paint(ctx, rand) {
      ctx.fillStyle = "#1b1d28";
      ctx.fillRect(-0.91, -6.65, 1.02, 7.2);
      ctx.fillStyle = "#232636";
      ctx.fillRect(0.11, -6.65, 0.115, 7.2);
      paintWindows(ctx, rand, [-0.91, -6.65, 1.02, 7.2], { cols: 14, rows: 90, litChance: 0.4, colors: WARM, bands: true });
      paintWindows(ctx, rand, [0.11, -6.65, 0.115, 7.2], { cols: 2, rows: 90, litChance: 0.3, colors: WARM, bands: true });
      ctx.fillStyle = "#14151d";
      ctx.fillRect(-0.775, 0.55, 0.75, 0.36);
      ctx.fillStyle = "#0f1016";
      ctx.fillRect(-0.435, 0.85, 0.07, 0.72);
      ctx.fillStyle = "#ff3b3b";
      ctx.beginPath();
      ctx.arc(-0.4, 1.6, 0.045, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    // 111 Huntington: rounded tower with a finned crown (a ring of vertical fins) around a glass dome.
    name: "111-huntington",
    seed: 202,
    z: -10,
    bounds: { x0: -0.118, x1: 0.818, y0: -6.86, y1: 0.02 },
    paint(ctx, rand) {
      const cx = 0.35;
      ctx.fillStyle = "#16222b";
      ctx.fillRect(-0.118, -6.86, 0.936, 6);
      paintWindows(ctx, rand, [-0.118, -6.86, 0.936, 6], {
        cols: 22,
        rows: 60,
        litChance: 0.38,
        colors: ["#d8f0ff", "#ffe3a8", "#a8dcff"],
      });
      // Darken toward the sides so the flat cutout reads as a cylinder.
      const shade = ctx.createLinearGradient(-0.118, 0, 0.818, 0);
      shade.addColorStop(0, "rgba(5, 8, 14, 0.6)");
      shade.addColorStop(0.45, "rgba(5, 8, 14, 0)");
      shade.addColorStop(1, "rgba(5, 8, 14, 0.7)");
      ctx.fillStyle = shade;
      ctx.fillRect(-0.118, -6.86, 0.936, 6);

      const fins = Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2);
      const fin = (a: number) => ctx.fillRect(cx + Math.cos(a) * 0.432 - 0.012, -0.8, 0.024, 0.54);
      ctx.fillStyle = CROWN;
      fins.filter((a) => Math.sin(a) < 0).forEach(fin); // back half of the ring, behind the dome
      ctx.fillStyle = "rgba(95, 127, 156, 0.35)";
      ctx.beginPath();
      ctx.ellipse(cx, -0.29, 0.372, 0.298, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = CROWN;
      fins.filter((a) => Math.sin(a) >= 0).forEach(fin);
      ctx.strokeStyle = CROWN;
      ctx.lineWidth = 0.03;
      ctx.beginPath();
      ctx.ellipse(cx, -0.26, 0.432, 0.07, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  {
    // John Hancock Tower: thin dark-glass slab, seen almost face-on.
    name: "hancock",
    seed: 303,
    z: -11.5,
    bounds: { x0: -9.55, x1: -8.25, y0: -6.6, y1: 1.2 },
    paint(ctx, rand) {
      ctx.fillStyle = "#121a2e";
      ctx.fillRect(-9.55, -6.6, 1.3, 7.8);
      paintWindows(ctx, rand, [-9.55, -6.6, 1.3, 7.8], { cols: 14, rows: 100, litChance: 0.18, colors: ["#bcd8ff", "#ffe3a8"] });
      // Faint sky reflection on the glass, stronger near the top.
      const sheen = ctx.createLinearGradient(0, -6.6, 0, 1.2);
      sheen.addColorStop(0, "rgba(120, 150, 210, 0)");
      sheen.addColorStop(1, "rgba(120, 150, 210, 0.12)");
      ctx.fillStyle = sheen;
      ctx.fillRect(-9.55, -6.6, 1.3, 7.8);
    },
  },
];

/** Paints a landmark onto a canvas sized to its bounds, softens it, and returns the texture and plane placement. */
function landmarkCutout(l: Landmark) {
  const x0 = l.bounds.x0 - CUTOUT_PAD;
  const y1 = l.bounds.y1 + CUTOUT_PAD;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((l.bounds.x1 + CUTOUT_PAD - x0) * CUTOUT_PX_PER_UNIT);
  canvas.height = Math.ceil((y1 - (l.bounds.y0 - CUTOUT_PAD)) * CUTOUT_PX_PER_UNIT);
  const ctx = canvas.getContext("2d")!;
  // Let the paint functions work in world units with y up: scale by px/unit, flip y, origin at (x0, y1).
  ctx.setTransform(CUTOUT_PX_PER_UNIT, 0, 0, -CUTOUT_PX_PER_UNIT, -x0 * CUTOUT_PX_PER_UNIT, y1 * CUTOUT_PX_PER_UNIT);
  l.paint(ctx, rng(l.seed));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  soften(canvas, 3);

  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  // Size the plane from the (rounded-up) canvas so texels stay exactly CUTOUT_PX_PER_UNIT apart.
  const width = canvas.width / CUTOUT_PX_PER_UNIT;
  const height = canvas.height / CUTOUT_PX_PER_UNIT;
  return {
    name: l.name,
    material: new MeshBasicMaterial({ map, transparent: true, toneMapped: false }),
    size: [width, height] as [number, number],
    position: [x0 + width / 2, y1 - height / 2, l.z] as [number, number, number],
  };
}

function BostonLandmarks() {
  const cutouts = useMemo(() => LANDMARKS.map(landmarkCutout), []);

  useEffect(
    () => () =>
      cutouts.forEach(({ material }) => {
        material.map?.dispose();
        material.dispose();
      }),
    [cutouts],
  );

  return (
    <group>
      {cutouts.map((c) => (
        <mesh key={c.name} position={c.position} material={c.material}>
          <planeGeometry args={c.size} />
        </mesh>
      ))}
    </group>
  );
}

export function NightCity() {
  const res = useMemo(() => {
    const layers = LAYERS.map((l) => {
      const map = skylineTexture(l);
      // Blended (not alphaTest) so the softened silhouettes keep their soft edges.
      return new MeshBasicMaterial({ map, transparent: true, toneMapped: false });
    });
    const sky = new MeshBasicMaterial({ map: skyTexture(), toneMapped: false });
    const frame = new MeshStandardMaterial({ color: ROOM_COLOR, roughness: 0.8 });
    return { layers, sky, frame };
  }, []);

  useEffect(
    () => () => {
      [...res.layers, res.sky].forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      res.frame.dispose();
    },
    [res],
  );

  const wallW = WINDOW.right - WINDOW.left;
  const wallPieces: [number, number, number, number][] = [
    // [centerX, centerY, width, height]
    [(WALL.left + WINDOW.left) / 2, (WALL.bottom + WALL.top) / 2, WINDOW.left - WALL.left, WALL.top - WALL.bottom],
    [(WINDOW.right + WALL.right) / 2, (WALL.bottom + WALL.top) / 2, WALL.right - WINDOW.right, WALL.top - WALL.bottom],
    [0, (WINDOW.top + WALL.top) / 2, wallW, WALL.top - WINDOW.top],
    [0, (WALL.bottom + WINDOW.bottom) / 2, wallW, WINDOW.bottom - WALL.bottom],
  ];
  const frameZ = WALL_Z + WALL.depth / 2 + 0.04;
  const winMidY = (WINDOW.top + WINDOW.bottom) / 2;
  const winH = WINDOW.top - WINDOW.bottom;

  return (
    <group>
      <mesh position={[0, 8, -46]} material={res.sky}>
        <planeGeometry args={[150, 64]} />
      </mesh>
      {LAYERS.map((l, i) => (
        <mesh key={l.seed} position={[0, l.y, l.z]} material={res.layers[i]}>
          <planeGeometry args={[l.width, l.width / 4]} />
        </mesh>
      ))}

      <BostonLandmarks />

      {wallPieces.map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, WALL_Z]} material={res.frame}>
          <boxGeometry args={[w, h, WALL.depth]} />
        </mesh>
      ))}

      {/* Window frame, mullions and sill */}
      <mesh position={[0, WINDOW.top, frameZ]} material={res.frame}>
        <boxGeometry args={[wallW + 0.16, 0.08, 0.12]} />
      </mesh>
      {[WINDOW.left, WINDOW.right].map((x) => (
        <mesh key={x} position={[x, winMidY, frameZ]} material={res.frame}>
          <boxGeometry args={[0.08, winH, 0.12]} />
        </mesh>
      ))}
      {[-wallW / 6, wallW / 6].map((x) => (
        <mesh key={x} position={[x, winMidY, frameZ]} material={res.frame}>
          <boxGeometry args={[0.05, winH, 0.06]} />
        </mesh>
      ))}
      <mesh position={[0, WINDOW.bottom - 0.02, WALL_Z + 0.2]} material={res.frame}>
        <boxGeometry args={[wallW + 0.3, 0.06, 0.4]} />
      </mesh>
    </group>
  );
}
