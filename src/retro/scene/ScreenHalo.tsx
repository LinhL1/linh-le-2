import { useEffect, useMemo } from "react";
import { AdditiveBlending, CanvasTexture, MeshBasicMaterial, SRGBColorSpace } from "three";
import type { ScreenRect } from "./model.config";

// Soft glow around the monitor glass: a fake bloom, so the light visibly radiates from the screen into the dark.
// A real bloom post-process can't see the screen (it's DOM behind the canvas, not WebGL pixels) and would cost a
// full-screen pass every frame; this is one transparent plane painted once at load.

/** How far the glow spreads past the glass on each side, in world units. */
const SPREAD = 0.55;
/** Plane distance in front of the glass: just clear of the bezel's front face (~0.1 in front). */
const OFFSET_Z = 0.13;
const PX_PER_UNIT = 256;

/** The screen rect's blurred shadow in `color`, with the glass itself cut out so the desktop isn't tinted. */
function haloTexture(screen: ScreenRect, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((screen.width + SPREAD * 2) * PX_PER_UNIT);
  canvas.height = Math.round((screen.height + SPREAD * 2) * PX_PER_UNIT);
  const ctx = canvas.getContext("2d")!;
  const x = SPREAD * PX_PER_UNIT;
  const y = SPREAD * PX_PER_UNIT;
  const w = screen.width * PX_PER_UNIT;
  const h = screen.height * PX_PER_UNIT;

  // Draw the rect far off-canvas and offset its shadow back into place, so only the soft shadow lands.
  const away = canvas.width * 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = SPREAD * PX_PER_UNIT * 0.7;
  ctx.shadowOffsetX = away;
  ctx.fillStyle = "#000";
  ctx.fillRect(x - away, y, w, h);

  ctx.shadowColor = "transparent";
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillRect(x, y, w, h);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

interface ScreenHaloProps {
  screen: ScreenRect;
  color: string;
  opacity: number;
}

export function ScreenHalo({ screen, color, opacity }: ScreenHaloProps) {
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: haloTexture(screen, color),
        transparent: true,
        // Adds light to whatever is behind it (bezel, desk, the dark page) instead of painting over it.
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [screen, color],
  );

  useEffect(
    () => () => {
      material.map?.dispose();
      material.dispose();
    },
    [material],
  );

  const [px, py, pz] = screen.position;
  return (
    <mesh
      position={[px, py, pz + OFFSET_Z]}
      rotation={screen.rotation}
      material={material}
      material-opacity={opacity}
      // Purely visual: never the target of clicks or hover.
      raycast={() => null}
    >
      <planeGeometry args={[screen.width + SPREAD * 2, screen.height + SPREAD * 2]} />
    </mesh>
  );
}
