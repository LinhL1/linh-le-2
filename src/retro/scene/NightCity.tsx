import { useEffect, useMemo } from "react";
import { CanvasTexture, DoubleSide, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";

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
          ctx.globalAlpha = 0.55 + rand() * 0.45;
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
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// Layers: far → near. Sizes keep the 4:1 canvas aspect and cover the window at all orbit angles.
// maxH keeps the generic towers below the Prudential / 111 Huntington rooflines in the default view.
const LAYERS: (SkylineOptions & { z: number; width: number; y: number })[] = [
  { z: -36, width: 100, y: 0.1, seed: 11, minH: 0.21, maxH: 0.3, minW: 24, maxW: 70, win: 2, litChance: 0.34, body: [26, 24, 48], haze: 0.55 },
  { z: -23, width: 66, y: 0.4, seed: 23, minH: 0.23, maxH: 0.33, minW: 34, maxW: 96, win: 3, litChance: 0.34, body: [18, 17, 34], haze: 0.25 },
  { z: -12.5, width: 40, y: 0.6, seed: 37, minH: 0.28, maxH: 0.385, minW: 60, maxW: 140, win: 4, litChance: 0.33, body: [12, 11, 22], haze: 0 },
];

// ─── Boston landmarks ────────────────────────────────────────────────────────
// Simplified Prudential Tower, 111 Huntington and John Hancock Tower, sitting between the
// nearest skyline layer and the wall. The default camera looks down at the desk, so only a
// thin band of the view is visible through the window; positions/heights are tuned so the
// Pru + 111 Huntington pair (crowns included) shows in the right pane and the Hancock in the left.

interface TowerTextureOptions {
  seed: number;
  cols: number;
  rows: number;
  body: string;
  litChance: number;
  /** Prudential-style continuous horizontal window bands. */
  bands?: boolean;
  colors?: string[];
}

function towerTexture(o: TowerTextureOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const rand = rng(o.seed);
  const colors = o.colors ?? ["#ffd27a", "#ffe3a8", "#ffc061"];
  ctx.fillStyle = o.body;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cw = canvas.width / o.cols;
  const rh = canvas.height / o.rows;
  for (let r = 0; r < o.rows; r++) {
    const floorLit = rand() < 0.8;
    for (let c = 0; c < o.cols; c++) {
      if (!floorLit || rand() > o.litChance) continue;
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.globalAlpha = 0.5 + rand() * 0.5;
      if (o.bands) ctx.fillRect(c * cw, r * rh + rh * 0.3, cw + 1, rh * 0.4);
      else ctx.fillRect(c * cw + cw * 0.2, r * rh + rh * 0.2, cw * 0.6, rh * 0.55);
      ctx.globalAlpha = 1;
    }
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

const CROWN_FINS = 18;
/** Landmarks sit in front of the nearest skyline layer, scaled down to read as distant towers. */
const LANDMARK_SCALE = 0.6;

function BostonLandmarks() {
  const m = useMemo(
    () => ({
      pru: new MeshBasicMaterial({
        map: towerTexture({ seed: 101, cols: 10, rows: 52, body: "#1b1d28", litChance: 0.4, bands: true }),
        toneMapped: false,
      }),
      pruTop: new MeshBasicMaterial({ color: "#14151d" }),
      huntington: new MeshBasicMaterial({
        map: towerTexture({ seed: 202, cols: 14, rows: 36, body: "#16222b", litChance: 0.38, colors: ["#d8f0ff", "#ffe3a8", "#a8dcff"] }),
        toneMapped: false,
      }),
      // 111 Huntington's glass crown glows at night.
      crown: new MeshBasicMaterial({ color: "#cfeaff", toneMapped: false }),
      dome: new MeshBasicMaterial({ color: "#9fd4ff", transparent: true, opacity: 0.75, side: DoubleSide, toneMapped: false }),
      hancock: new MeshBasicMaterial({
        map: towerTexture({ seed: 303, cols: 8, rows: 60, body: "#121a2e", litChance: 0.18, colors: ["#bcd8ff", "#ffe3a8"] }),
        toneMapped: false,
      }),
      beacon: new MeshBasicMaterial({ color: "#ff3b3b", toneMapped: false }),
      mast: new MeshBasicMaterial({ color: "#0f1016" }),
    }),
    [],
  );

  useEffect(
    () => () =>
      Object.values(m).forEach((mat) => {
        mat.map?.dispose();
        mat.dispose();
      }),
    [m],
  );

  return (
    <group>
      {/* Prudential Tower: square slab, penthouse and a tall mast */}
      <group position={[-0.4, -2.45, -11]} scale={LANDMARK_SCALE}>
        <mesh position={[0, -1, 0]} material={m.pru}>
          <boxGeometry args={[1.7, 12, 1.7]} />
        </mesh>
        <mesh position={[0, 5.3, 0]} material={m.pruTop}>
          <boxGeometry args={[1.25, 0.6, 1.25]} />
        </mesh>
        <mesh position={[0, 6.1, 0]} material={m.mast}>
          <cylinderGeometry args={[0.05, 0.07, 1.2, 6]} />
        </mesh>
        <mesh position={[0, 6.75, 0]} material={m.beacon}>
          <sphereGeometry args={[0.07, 8, 8]} />
        </mesh>
      </group>

      {/* 111 Huntington: rounded tower with the glowing finned crown and dome */}
      <group position={[0.35, -2.3, -10]} scale={LANDMARK_SCALE}>
        <mesh position={[0, -2.6, 0]} scale={[1, 1, 0.82]} material={m.huntington}>
          <cylinderGeometry args={[0.78, 0.78, 10, 32]} />
        </mesh>
        {Array.from({ length: CROWN_FINS }, (_, i) => {
          const a = (i / CROWN_FINS) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.72, 2.95, Math.sin(a) * 0.72 * 0.82]} rotation={[0, -a, 0]} material={m.crown}>
              <boxGeometry args={[0.04, 0.9, 0.04]} />
            </mesh>
          );
        })}
        <mesh position={[0, 3.35, 0]} scale={[1, 0.8, 0.82]} material={m.dome}>
          <sphereGeometry args={[0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 3.4, 0]} scale={[1, 1, 0.82]} material={m.crown}>
          <torusGeometry args={[0.72, 0.03, 6, 32]} />
        </mesh>
      </group>

      {/* John Hancock Tower: thin glass rhomboid slab, turned at an angle */}
      <group position={[-8.9, -2.34, -11.5]} rotation={[0, 0.55, 0]} scale={LANDMARK_SCALE}>
        <mesh position={[0, -0.6, 0]} material={m.hancock}>
          <boxGeometry args={[2.2, 13, 0.62]} />
        </mesh>
      </group>
    </group>
  );
}

export function NightCity() {
  const res = useMemo(() => {
    const layers = LAYERS.map((l) => {
      const map = skylineTexture(l);
      return new MeshBasicMaterial({ map, alphaTest: 0.5, toneMapped: false });
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
