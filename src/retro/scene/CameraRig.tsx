import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Euler, MathUtils, PerspectiveCamera, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { ScreenRect } from "./model.config";

/** How much of the viewport the zoomed-in screen fills. */
const FILL = { height: 0.86, width: 0.92 };

/** Camera position that frames the screen head-on. */
function zoomPose(screen: ScreenRect, camera: PerspectiveCamera, aspect: number) {
  const tanHalf = Math.tan(MathUtils.degToRad(camera.fov / 2));
  const byHeight = screen.height / FILL.height / (2 * tanHalf);
  const byWidth = screen.width / FILL.width / (2 * tanHalf * aspect);
  const normal = new Vector3(0, 0, 1).applyEuler(new Euler(...screen.rotation));
  const target = new Vector3(...screen.position);
  return { position: target.clone().addScaledVector(normal, Math.max(byHeight, byWidth)), target };
}

type Phase = "idle" | "zooming-in" | "zoomed" | "zooming-out";

interface CameraRigProps {
  zoomed: boolean;
  screen: ScreenRect;
  idleTarget: Vector3;
  /** Called once each time a transition finishes. */
  onSettled: (zoomed: boolean) => void;
}

/**
 * Tweens the camera between the orbitable desk view and the screen close-up.
 * All per-frame work happens on refs inside useFrame (no React state), and the
 * canvas only renders while something is moving (frameloop="demand").
 */
export function CameraRig({ zoomed, screen, idleTarget, onSettled }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const phase = useRef<Phase>("idle");
  const returnTo = useRef(new Vector3());
  const goal = useRef({ position: new Vector3(), target: new Vector3() });
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    if (!controls) return;
    if (zoomed) {
      if (phase.current === "idle") returnTo.current.copy(camera.position);
      controls.enabled = false;
      goal.current = zoomPose(screen, camera, size.width / size.height);
      phase.current = "zooming-in";
    } else if (phase.current !== "idle") {
      goal.current = { position: returnTo.current.clone(), target: idleTarget.clone() };
      phase.current = "zooming-out";
    }
    invalidate();
    // Re-run on resize too, so the close-up re-frames when the window changes size.
  }, [zoomed, controls, camera, screen, idleTarget, size.width, size.height, invalidate]);

  useFrame((_, delta) => {
    if (!controls || phase.current === "idle" || phase.current === "zoomed") return;
    // Frame-rate independent exponential ease; clamp delta so a slow first frame doesn't jump.
    const t = 1 - Math.exp(-Math.min(delta, 1 / 30) * 5.5);
    const { position, target } = goal.current;
    camera.position.lerp(position, t);
    controls.target.lerp(target, t);
    camera.lookAt(controls.target);

    if (camera.position.distanceToSquared(position) < 1e-6 && controls.target.distanceToSquared(target) < 1e-6) {
      camera.position.copy(position);
      controls.target.copy(target);
      camera.lookAt(target);
      if (phase.current === "zooming-in") {
        phase.current = "zoomed";
        onSettledRef.current(true);
      } else {
        phase.current = "idle";
        controls.enabled = true;
        controls.update();
        onSettledRef.current(false);
      }
    }
    invalidate();
  });

  return null;
}
