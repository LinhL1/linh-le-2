import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  Material,
  MeshStandardMaterial,
  Object3D,
  Path,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import { PROCEDURAL_SCREEN, type Vec3 } from "./model.config";

// A beige 90s desktop built from primitives — no external assets. Layout (world units):
// desk top at y=0, base unit under the monitor, keyboard and mouse in front.
// The screen opening matches PROCEDURAL_SCREEN so the live desktop lines up with it.

const PALETTE = {
  beige: "#d8ceb0",
  beigeDark: "#bcb08e",
  beigeLight: "#e6dec6",
  charcoal: "#2b2924",
  glass: "#0b100c",
  wood: "#4f2e16",
  keyLight: "#ebe4cf",
  keyDark: "#a89e86",
  ledGreen: "#5dff7a",
  ledAmber: "#ffb340",
  mousepad: "#3f5a3a",
  // Pushed more saturated than they look on paper: the dim, warm night lighting washes pale colours to beige.
  noteYellow: "#fff08a",
  noteSage: "#9fc28c",
  terracotta: "#b5633b",
  terracottaDark: "#8e4a2c",
  soil: "#3a2a1e",
  leaf: "#4c7a3d",
  leafYoung: "#79a85a",
  // Light maple, kept a touch warmer than the beige case so the bird doesn't blend into it.
  bird: "#d8a872",
};

/** useMemo + dispose on unmount, for geometries/materials shared across meshes. */
function useDisposable<T extends Record<string, { dispose: () => void }>>(factory: () => T): T {
  const value = useMemo(factory, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => Object.values(value).forEach((v) => v.dispose()), [value]);
  return value;
}

/** Box whose back face is smaller than its front: the CRT tube housing. */
function taperedBox(wFront: number, hFront: number, wBack: number, hBack: number, depth: number) {
  const geo = new BoxGeometry(1, 1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const front = pos.getZ(i) > 0;
    pos.setXYZ(i, pos.getX(i) * (front ? wFront : wBack), pos.getY(i) * (front ? hFront : hBack), pos.getZ(i) * depth);
  }
  geo.computeVertexNormals();
  return geo;
}

function roundedRect<T extends Path>(path: T, w: number, h: number, r: number, cy = 0): T {
  const x = -w / 2;
  const y = cy - h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

// Monitor bezel: outer frame with a 4:3 opening, extruded with a soft bevel.
const BEZEL = { width: 1.66, height: 1.34, centerY: -0.06, depth: 0.06, bevel: 0.025 };
const OPENING = { width: PROCEDURAL_SCREEN.width + 0.03, height: PROCEDURAL_SCREEN.height + 0.03 };

function bezelGeometry() {
  const shape = roundedRect(new Shape(), BEZEL.width - BEZEL.bevel * 2, BEZEL.height - BEZEL.bevel * 2, 0.08);
  // The bevel grows the outline outward and shrinks holes inward, so pre-compensate.
  // The bezel mesh sits at BEZEL.centerY, so offset the opening to stay centred on the screen.
  const hole = roundedRect(new Path(), OPENING.width + BEZEL.bevel * 2, OPENING.height + BEZEL.bevel * 2, 0.04, -BEZEL.centerY);
  shape.holes.push(hole);
  return new ExtrudeGeometry(shape, {
    depth: BEZEL.depth,
    bevelEnabled: true,
    bevelThickness: BEZEL.bevel,
    bevelSize: BEZEL.bevel,
    bevelSegments: 3,
    curveSegments: 8,
  });
}

// Keyboard layout in key units (u): [x, row, width]. Rows run back (0) to front (5).
const KEY_U = 0.1;
function keyboardLayout(): [number, number, number][] {
  const keys: [number, number, number][] = [];
  const row = (r: number, widths: number[], startX = 0) => {
    let x = startX;
    for (const w of widths) {
      keys.push([x + w / 2, r, w]);
      x += w;
    }
  };
  const ones = (n: number) => Array<number>(n).fill(1);
  row(0, [1], 0);
  row(0, ones(4), 1.5);
  row(0, ones(4), 6);
  row(0, ones(4), 10.5);
  row(1.25, [...ones(13), 2]);
  row(2.25, [1.5, ...ones(12), 1.5]);
  row(3.25, [1.75, ...ones(11), 2.25]);
  row(4.25, [2.25, ...ones(10), 2.75]);
  row(5.25, [1.5, 1.5, 9, 1.5, 1.5]);
  // Numpad
  for (let r = 0; r < 5; r++) row(1.25 + r, ones(4), 15.5);
  return keys;
}

function Keyboard({ materials }: { materials: { keyLight: Material } }) {
  const ref = useRef<InstancedMesh>(null);
  const layout = useMemo(keyboardLayout, []);
  const cap = useDisposable(() => ({ geo: new BoxGeometry(KEY_U * 0.86, 0.04, KEY_U * 0.86) }));

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const light = new Color(PALETTE.keyLight);
    const dark = new Color(PALETTE.keyDark);
    const offsetX = -19.5 / 2;
    const offsetZ = -6.25 / 2;
    layout.forEach(([x, r, w], i) => {
      dummy.position.set((x + offsetX) * KEY_U, 0.055, (r + 0.5 + offsetZ) * KEY_U);
      dummy.scale.set(w === 1 ? 1 : (w * KEY_U - KEY_U * 0.14) / (KEY_U * 0.86), 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // Function row and wide modifier keys get the darker grey-beige.
      mesh.setColorAt(i, r === 0 || w !== 1 ? dark : light);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout]);

  return (
    <group position={[-0.05, 0, 1.5]} rotation={[0.05, 0, 0]}>
      <RoundedBox args={[2.12, 0.07, 0.8]} radius={0.025} smoothness={3} position={[0, 0.035, 0]}>
        <meshStandardMaterial color={PALETTE.beige} roughness={0.6} />
      </RoundedBox>
      <instancedMesh ref={ref} args={[cap.geo, materials.keyLight, layout.length]} />
    </group>
  );
}

function Cord({ points, material }: { points: [number, number, number][]; material: Material }) {
  const geo = useDisposable(() => ({
    // Centripetal Catmull-Rom keeps bends smooth without kinks or overshoot, like real cable slack.
    tube: new TubeGeometry(new CatmullRomCurve3(points.map((p) => new Vector3(...p)), false, "centripetal"), 120, 0.009, 6, false),
  }));
  return <mesh geometry={geo.tube} material={material} />;
}

/**
 * A unit leaf (1 long on +Y, 1 wide on X) built vertex by vertex: a strip of rows, each row being
 * left edge / midrib / right edge. Having a midrib vertex lets the leaf fold into a shallow V, and
 * many rows let it arch smoothly. The face points +Z; the tip curls toward +Z.
 */
function leafGeometry(rows = 10) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const half = 0.5 * Math.sin(Math.PI * Math.pow(t, 0.7)); // pointed at both ends, widest ~40% up
    const arch = 0.35 * t * t; // tip curls outward
    const fold = 0.25 * half; // edges lift toward -Z, cupping the leaf
    positions.push(-half, t, arch - fold, 0, t, arch, half, t, arch - fold);
    if (i < rows) {
      const a = i * 3; // this row: a (left), a+1 (midrib), a+2 (right); next row starts at b
      const b = a + 3;
      indices.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Outer leaves are long and lean far out; inner ones are shorter, more upright and lighter (newer growth).
const LEAVES = [
  ...Array.from({ length: 8 }, (_, i) => ({
    yaw: (i * 2 * Math.PI) / 8 + 0.2,
    tilt: 0.85 + (i % 3) * 0.08,
    length: 0.4 + (i % 2) * 0.05,
    width: 0.17,
    young: false,
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    yaw: (i * 2 * Math.PI) / 5 + 0.6,
    tilt: 0.3 + (i % 2) * 0.12,
    length: 0.34,
    width: 0.13,
    young: true,
  })),
];

const POT_TOP = 0.275;

function PottedPlant() {
  const res = useDisposable(() => ({
    leaf: leafGeometry(),
    // DoubleSide: a leaf is a single sheet, and both sides are visible from the camera.
    leafMat: new MeshStandardMaterial({ color: PALETTE.leaf, roughness: 0.55, side: DoubleSide }),
    youngLeafMat: new MeshStandardMaterial({ color: PALETTE.leafYoung, roughness: 0.55, side: DoubleSide }),
  }));

  return (
    <group position={[-1.75, 0, 0.35]}>
      {/* Saucer, pot, rim, soil */}
      <mesh position={[0, 0.0125, 0]}>
        <cylinderGeometry args={[0.13, 0.115, 0.025, 28]} />
        <meshStandardMaterial color={PALETTE.terracottaDark} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.145, 0]}>
        <cylinderGeometry args={[0.12, 0.09, 0.24, 28]} />
        <meshStandardMaterial color={PALETTE.terracotta} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.135, 0.13, 0.05, 28]} />
        <meshStandardMaterial color={PALETTE.terracotta} roughness={0.85} />
      </mesh>
      <mesh position={[0, POT_TOP, 0]}>
        <cylinderGeometry args={[0.118, 0.118, 0.01, 24]} />
        <meshStandardMaterial color={PALETTE.soil} roughness={1} />
      </mesh>
      {/* Each leaf: the outer group turns it around the pot (yaw), the mesh leans it outward (tilt).
          Child rotations apply first, so the leaf leans toward +Z and then gets swung into place. */}
      {LEAVES.map(({ yaw, tilt, length, width, young }, i) => (
        <group key={i} position={[0, POT_TOP, 0]} rotation={[0, yaw, 0]}>
          <mesh
            geometry={res.leaf}
            material={young ? res.youngLeafMat : res.leafMat}
            position={[0, 0, 0.02]}
            rotation={[tilt, 0, 0]}
            scale={[width, length, length]}
          />
        </group>
      ))}
    </group>
  );
}

// Low-poly geometric bird (a faceted wren), sitting on the base unit to the right of the monitor.
// Designed in a unit frame: faces +X, sits on y = 0, about 1.3 long; BIRD_SCALE sizes it.
const BIRD_SCALE = 0.17;

/** Deterministic pseudo-random number in [-1, 1], so the facets are irregular but identical on every load. */
function wobble(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** A sparse, slightly jittered cloud of points on an ellipsoid: a top point plus staggered rings. */
function ellipsoidPoints(center: Vec3, radii: Vec3, ringAngles: number[], perRing: number, seed: number) {
  const [cx, cy, cz] = center;
  const [rx, ry, rz] = radii;
  const points = [new Vector3(cx, cy + ry, cz)];
  ringAngles.forEach((phi, ring) => {
    for (let i = 0; i < perRing; i++) {
      // Every other ring is rotated half a step, so the hull gets triangles rather than long strips.
      const theta = ((i + (ring % 2) * 0.5) / perRing) * Math.PI * 2;
      const k = 1 + 0.08 * wobble(seed + ring * 31 + i);
      points.push(
        new Vector3(
          cx + rx * Math.sin(phi) * Math.cos(theta) * k,
          cy + ry * Math.cos(phi) * k,
          cz + rz * Math.sin(phi) * Math.sin(theta) * k,
        ),
      );
    }
  });
  return points;
}

/**
 * Three convex hulls (body, head + beak, tail), each shrink-wrapped around a few points. Separate
 * hulls keep the neck crease and the dip before the raised tail, which a single hull would fill in.
 */
function geoBirdGeometries() {
  const p = (...xyz: Vec3) => new Vector3(...xyz);
  const body = [
    // Plump and a little longer than tall.
    ...ellipsoidPoints([0, 0.36, 0], [0.46, 0.32, 0.31], [0.5, 1.0, 1.5, 2.0, 2.5], 7, 1),
    // Small foot pad, so it sits flat like a figurine.
    ...Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return p(0.04 + 0.17 * Math.cos(a), 0, 0.12 * Math.sin(a));
    }),
  ];
  const head = [
    // Up and forward, overlapping the front of the body.
    ...ellipsoidPoints([0.33, 0.67, 0], [0.22, 0.21, 0.19], [0.6, 1.2, 1.9, 2.5], 6, 50),
    // Short pointed beak.
    p(0.71, 0.68, 0),
    p(0.52, 0.74, 0.05),
    p(0.52, 0.74, -0.05),
    p(0.52, 0.62, 0),
  ];
  const tail = [
    // Base, buried in the back of the body...
    p(-0.15, 0.55, 0.14),
    p(-0.15, 0.55, -0.14),
    p(-0.25, 0.32, 0.1),
    p(-0.25, 0.32, -0.1),
    // ...rising up and back to a thin, cocked tip.
    p(-0.6, 0.98, 0.06),
    p(-0.6, 0.98, -0.06),
    p(-0.7, 0.9, 0),
    p(-0.52, 1.02, 0),
  ];
  return { body: new ConvexGeometry(body), head: new ConvexGeometry(head), tail: new ConvexGeometry(tail) };
}

function GeoBird({ position, yaw }: { position: Vec3; yaw: number }) {
  const res = useDisposable(() => ({
    ...geoBirdGeometries(),
    // flatShading: one normal per triangle, so every facet catches the light differently (the low-poly look).
    mat: new MeshStandardMaterial({ color: PALETTE.bird, roughness: 0.65, flatShading: true }),
  }));

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={BIRD_SCALE}>
      <mesh geometry={res.body} material={res.mat} />
      <mesh geometry={res.head} material={res.mat} />
      <mesh geometry={res.tail} material={res.mat} />
    </group>
  );
}

// Rounded two-button mouse with a scroll wheel. Front points to -z (toward the computer).
const MOUSE = { rx: 0.106, ry: 0.068, rz: 0.15, cy: 0.01, frontNarrow: 0.1 };

/** Half-width of the egg-shaped body at depth z (narrower toward the front). */
const mouseHalfWidth = (z: number) => MOUSE.rx * (1 - MOUSE.frontNarrow * Math.max(0, -z / MOUSE.rz));

/** Height of the shell surface at (x, z), used to lay the seams onto the dome. */
function mouseSurfaceY(x: number, z: number) {
  const nx = x / mouseHalfWidth(z);
  const nz = z / MOUSE.rz;
  return MOUSE.cy + MOUSE.ry * Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz));
}

function seamTube(points: [number, number][]) {
  const pts = points.map(([x, z]) => new Vector3(x, mouseSurfaceY(x, z) + 0.0012, z));
  return new TubeGeometry(new CatmullRomCurve3(pts), 48, 0.0017, 5, false);
}

function Mouse({
  position,
  rotationY,
  materials,
}: {
  position: [number, number, number];
  rotationY: number;
  materials: { charcoal: Material };
}) {
  const res = useDisposable(() => {
    // Ellipsoid, narrowed toward the front so it reads as an egg rather than a pill.
    const body = new SphereGeometry(1, 40, 24);
    const pos = body.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i) * MOUSE.rz;
      pos.setXYZ(i, pos.getX(i) * mouseHalfWidth(z), pos.getY(i) * MOUSE.ry, z);
    }
    body.computeVertexNormals();

    // Transverse seam bowing back around the wheel, then the left/right split to the front.
    const across: [number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const x = (t * 2 - 1) * mouseHalfWidth(-0.02) * 0.97;
      across.push([x, -0.02 + 0.03 * (1 - Math.abs(t * 2 - 1))]);
    }
    const split: [number, number][] = [[0, -0.075], [0, -0.11], [0, -0.14]];

    return {
      body,
      across: seamTube(across),
      split: seamTube(split),
      bodyMat: new MeshStandardMaterial({ color: "#e3ded2", roughness: 0.42 }),
      skirtMat: new MeshStandardMaterial({ color: "#b7b1a4", roughness: 0.6 }),
      wheelMat: new MeshStandardMaterial({ color: "#c9a57a", roughness: 0.5 }),
    };
  });

  const wheelZ = -0.045;
  const wheelTop = mouseSurfaceY(0, wheelZ);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={res.body} material={res.bodyMat} position={[0, MOUSE.cy, 0]} />
      {/* Darker band around the base */}
      <mesh position={[0, 0.006, 0.004]} scale={[MOUSE.rx * 1.02, 0.012, MOUSE.rz * 1.01]} material={res.skirtMat}>
        <cylinderGeometry args={[1, 1, 1, 40]} />
      </mesh>
      <mesh geometry={res.across} material={materials.charcoal} />
      <mesh geometry={res.split} material={materials.charcoal} />
      {/* Scroll wheel in its slot, between the buttons */}
      <mesh position={[0, wheelTop - 0.001, wheelZ]} rotation={[-0.25, 0, 0]} material={materials.charcoal}>
        <boxGeometry args={[0.02, 0.006, 0.04]} />
      </mesh>
      <mesh position={[0, wheelTop - 0.003, wheelZ]} rotation={[0, 0, Math.PI / 2]} material={res.wheelMat}>
        <cylinderGeometry args={[0.012, 0.012, 0.011, 20]} />
      </mesh>
    </group>
  );
}

interface ProceduralComputerProps {
  /** Power LED on the monitor chin glows while the screen is "on" (zoomed in). */
  poweredOn: boolean;
}

export function ProceduralComputer({ poweredOn }: ProceduralComputerProps) {
  const mats = useDisposable(() => ({
    beige: new MeshStandardMaterial({ color: PALETTE.beige, roughness: 0.55 }),
    beigeDark: new MeshStandardMaterial({ color: PALETTE.beigeDark, roughness: 0.6 }),
    beigeLight: new MeshStandardMaterial({ color: PALETTE.beigeLight, roughness: 0.5 }),
    charcoal: new MeshStandardMaterial({ color: PALETTE.charcoal, roughness: 0.7 }),
    glass: new MeshStandardMaterial({ color: PALETTE.glass, roughness: 0.2, metalness: 0.1 }),
    keyLight: new MeshStandardMaterial({ color: "#ffffff", roughness: 0.55 }),
    ledAmber: new MeshStandardMaterial({ color: PALETTE.ledAmber, emissive: PALETTE.ledAmber, emissiveIntensity: 0.6 }),
    cord: new MeshStandardMaterial({ color: "#3a3730", roughness: 0.8 }),
  }));
  const geos = useDisposable(() => ({
    bezel: bezelGeometry(),
    housing: taperedBox(1.44, 1.14, 0.84, 0.62, 0.78),
  }));

  const monitorZ = PROCEDURAL_SCREEN.position[2];
  const ledColor = poweredOn ? PALETTE.ledGreen : "#2f4a33";

  const shadowProps = (receive = false) => ({ castShadow: false, receiveShadow: receive });

  return (
    <group>
      {/* Desk */}
      <mesh position={[0, -0.06, 0.45]} {...shadowProps(true)}>
        <boxGeometry args={[7.5, 0.12, 3.9]} />
        <meshStandardMaterial color={PALETTE.wood} roughness={0.78} />
      </mesh>

      {/* Base unit */}
      <group position={[0, 0, -0.25]}>
        <RoundedBox args={[2.1, 0.42, 1.7]} radius={0.03} smoothness={3} position={[0, 0.21, 0]} material={mats.beige} />
        {/* front panel details (front face at z = 0.85) */}
        <group position={[0, 0, 0.852]}>
          <mesh position={[0.48, 0.29, 0]} material={mats.beigeDark}>
            <boxGeometry args={[0.66, 0.11, 0.008]} />
          </mesh>
          <mesh position={[0.48, 0.29, 0.005]} material={mats.charcoal}>
            <boxGeometry args={[0.46, 0.022, 0.006]} />
          </mesh>
          <mesh position={[0.48, 0.13, 0]} material={mats.beigeDark}>
            <boxGeometry args={[0.66, 0.15, 0.008]} />
          </mesh>
          <mesh position={[0.48, 0.13, 0.005]} material={mats.charcoal}>
            <boxGeometry args={[0.52, 0.02, 0.006]} />
          </mesh>
          {[-0.34, -0.29, -0.24, -0.19, -0.14, -0.09].map((x) => (
            <mesh key={x} position={[x, 0.2, 0.002]} material={mats.charcoal}>
              <boxGeometry args={[0.014, 0.2, 0.004]} />
            </mesh>
          ))}
          <RoundedBox args={[0.13, 0.08, 0.03]} radius={0.01} position={[-0.78, 0.2, 0.012]} material={mats.beigeLight} />
          <mesh position={[-0.6, 0.27, 0.004]}>
            <boxGeometry args={[0.03, 0.015, 0.008]} />
            <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={poweredOn ? 1.4 : 0.2} />
          </mesh>
          <mesh position={[-0.54, 0.27, 0.004]} material={mats.ledAmber}>
            <boxGeometry args={[0.03, 0.015, 0.008]} />
          </mesh>
        </group>
      </group>

      {/* Monitor swivel stand */}
      <mesh position={[0, 0.445, -0.05]} material={mats.beigeDark}>
        <cylinderGeometry args={[0.46, 0.5, 0.05, 40]} />
      </mesh>
      <mesh position={[0, 0.55, -0.05]} material={mats.beige}>
        <boxGeometry args={[0.6, 0.18, 0.5]} />
      </mesh>

      {/* Monitor — origin at screen centre height, front of the bezel near z = monitorZ */}
      <group position={[0, PROCEDURAL_SCREEN.position[1], 0]}>
        <mesh geometry={geos.bezel} material={mats.beige} position={[0, BEZEL.centerY, monitorZ + 0.01]} />
        {/* Dark recess between the glass and the bezel */}
        <mesh position={[0, 0, monitorZ - 0.02]} material={mats.charcoal}>
          <boxGeometry args={[OPENING.width + 0.06, OPENING.height + 0.06, 0.02]} />
        </mesh>
        {/* Glass (only visible if the HTML layer is missing) */}
        <mesh position={[0, 0, monitorZ - 0.006]} material={mats.glass}>
          <planeGeometry args={[PROCEDURAL_SCREEN.width, PROCEDURAL_SCREEN.height]} />
        </mesh>
        {/* Front housing and tapered tube */}
        {/* Keep every face clear of the screen plane (monitorZ) to avoid z-fighting with the HTML hole. */}
        <mesh position={[0, BEZEL.centerY, monitorZ - 0.2]} material={mats.beige}>
          <boxGeometry args={[1.58, 1.28, 0.3]} />
        </mesh>
        <mesh geometry={geos.housing} material={mats.beige} position={[0, -0.12, monitorZ - 0.34 - 0.39]} />
        <mesh position={[0, -0.12, monitorZ - 1.15]} material={mats.beigeDark}>
          <boxGeometry args={[0.7, 0.48, 0.06]} />
        </mesh>
        {/* Vent grooves on top */}
        {[0.06, 0.12, 0.18, 0.24].map((dz) => (
          <mesh key={dz} position={[0, BEZEL.centerY + 0.641, monitorZ - 0.34 + dz]} material={mats.charcoal}>
            <boxGeometry args={[1.1, 0.004, 0.022]} />
          </mesh>
        ))}
        {/* Chin: badge, knobs, power button and LED */}
        <group position={[0, -0.6, monitorZ + 0.1]}>
          <mesh position={[-0.56, 0, 0]} material={mats.beigeDark}>
            <boxGeometry args={[0.3, 0.06, 0.006]} />
          </mesh>
          {[0.22, 0.32].map((x) => (
            <mesh key={x} position={[x, 0, 0.006]} rotation={[Math.PI / 2, 0, 0]} material={mats.beigeDark}>
              <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
            </mesh>
          ))}
          <mesh position={[0.5, 0, 0.004]}>
            <boxGeometry args={[0.028, 0.014, 0.008]} />
            <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={poweredOn ? 1.6 : 0.2} />
          </mesh>
          <RoundedBox args={[0.1, 0.06, 0.03]} radius={0.01} position={[0.62, 0, 0.008]} material={mats.beigeLight} />
        </group>
      </group>

      <Keyboard materials={mats} />
      {/* Keyboard cord: leaves the back-left of the keyboard, lies slack on the desk in a loose
          S-curve, then runs along the left side of the base unit (x = -1.05) into the back. */}
      <Cord
        material={mats.cord}
        points={[
          [-0.55, 0.04, 1.1],
          [-0.57, 0.012, 1.02],
          [-0.72, 0.011, 0.95],
          [-0.98, 0.011, 0.97],
          [-1.22, 0.011, 0.88],
          [-1.3, 0.011, 0.68],
          [-1.2, 0.011, 0.45],
          [-1.17, 0.011, 0.1],
          [-1.21, 0.011, -0.35],
          [-1.17, 0.025, -0.85],
          [-0.95, 0.09, -1.13],
        ]}
      />

      {/* Mouse on its pad */}
      <mesh position={[1.62, 0.006, 1.45]} rotation={[0, -0.08, 0]}>
        <boxGeometry args={[0.6, 0.012, 0.52]} />
        <meshStandardMaterial color={PALETTE.mousepad} roughness={0.9} />
      </mesh>
      <Mouse position={[1.62, 0.012, 1.48]} rotationY={-0.12} materials={mats} />
      {/* Mouse cord runs along the desk beside the base unit (right side ends at x = 1.05) and plugs in at the back. */}
      <Cord
        material={mats.cord}
        points={[
          [1.635, 0.016, 1.325],
          [1.6, 0.011, 1.05],
          [1.4, 0.011, 0.72],
          [1.24, 0.011, 0.3],
          [1.22, 0.011, -0.4],
          [1.16, 0.03, -0.95],
          [0.9, 0.1, -1.13],
        ]}
      />

      {/* Two sticky-note pads: sage green underneath, light yellow on top */}
      <group position={[-1.65, 0.008, 1.35]} rotation={[0, 0.35, 0]}>
        {[PALETTE.noteSage, PALETTE.noteYellow].map((color, i) => (
          <mesh key={color} position={[i * 0.03, i * 0.012, i * -0.02]} rotation={[0, i * 0.2, 0]}>
            <boxGeometry args={[0.3, 0.01, 0.3]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        ))}
      </group>

      <PottedPlant />

      {/* On the base unit's top (y = 0.42), in the gap between the monitor (x ≤ 0.83) and the case edge (x = 1.05).
          Head to the left, turned slightly toward the camera so it reads in near-profile. */}
      <GeoBird position={[0.94, 0.42, 0.24]} yaw={-2.8} />
    </group>
  );
}
