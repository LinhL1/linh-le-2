import { useCallback, useEffect, useState } from "react";

export type RetroMode = "3d" | "2d";
export type RetroModeReason = "forced" | "no-webgl" | "reduced-motion" | "default";

export interface RetroModeInputs {
  reducedMotion: boolean;
  webgl: boolean;
  forced: RetroMode | null;
}

/** Below these sizes the 800×600 desktop on the monitor is too small to read once zoomed in, so the
 *  3D scene shows it full-screen instead (see RetroScene). Phones still get the 3D desk. */
export const SMALL_VIEWPORT_QUERY = "(max-width: 899px), (max-height: 599px)";
/** Phone layout for the desktop itself: icon grid + full-screen windows. */
export const COMPACT_QUERY = "(max-width: 639px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const STORAGE_KEY = "retro-mode";

export function decideRetroMode({ reducedMotion, webgl, forced }: RetroModeInputs): {
  mode: RetroMode;
  reason: RetroModeReason;
} {
  if (!webgl) return { mode: "2d", reason: "no-webgl" };
  if (forced) return { mode: forced, reason: "forced" };
  if (reducedMotion) return { mode: "2d", reason: "reduced-motion" };
  return { mode: "3d", reason: "default" };
}

let webglSupport: boolean | undefined;

export function hasWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglSupport = !!ctx;
    // Free the probe context right away instead of waiting for GC.
    (ctx as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

const parseMode = (value: string | null): RetroMode | null => (value === "2d" || value === "3d" ? value : null);

function readForcedMode(): RetroMode | null {
  const fromUrl = parseMode(new URLSearchParams(window.location.search).get("mode"));
  if (fromUrl) return fromUrl;
  try {
    return parseMode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export function useRetroMode() {
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [forced, setForced] = useState<RetroMode | null>(readForcedMode);
  const [webgl, setWebgl] = useState(hasWebGL);

  const { mode, reason } = decideRetroMode({ reducedMotion, webgl, forced });

  /** Remember the visitor's explicit choice (e.g. the "2D mode" / "3D view" buttons). */
  const chooseMode = useCallback((next: RetroMode) => {
    setForced(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for this visit.
    }
  }, []);

  /** Called when the 3D scene fails at runtime (context creation, chunk load...). */
  const reportWebglFailure = useCallback(() => setWebgl(false), []);

  return {
    mode,
    reason,
    reducedMotion,
    /** Whether offering a "3D view" button makes sense. */
    canUse3d: webgl,
    chooseMode,
    reportWebglFailure,
  };
}
