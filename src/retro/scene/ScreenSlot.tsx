import { Html } from "@react-three/drei";
import { Desktop, type DesktopProps } from "../desktop/Desktop";
import { SCREEN_PIXELS, type ScreenRect } from "./model.config";

interface ScreenSlotProps extends Omit<DesktopProps, "mode" | "compact"> {
  screen: ScreenRect;
}

/**
 * Mounts the real DOM desktop onto the monitor glass with a CSS 3D transform.
 * `occlude="blending"` punches a hole in the WebGL canvas so the DOM (layered behind it)
 * shows through exactly where the glass is, and the bezel correctly covers its edges.
 */
export function ScreenSlot({ screen, active, ...desktopProps }: ScreenSlotProps) {
  // drei maps 1 world unit to 400 / distanceFactor CSS px for transformed Html.
  const distanceFactor = (screen.width * 400) / SCREEN_PIXELS.width;

  return (
    <Html
      transform
      occlude="blending"
      position={screen.position}
      rotation={screen.rotation}
      distanceFactor={distanceFactor}
      pointerEvents={active ? "auto" : "none"}
      zIndexRange={[100, 0]}
    >
      <Desktop mode="3d" active={active} {...desktopProps} />
    </Html>
  );
}
