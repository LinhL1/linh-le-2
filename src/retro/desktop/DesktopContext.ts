import { createContext, useContext } from "react";
import type { AppId } from "./useDesktop";

// The desktop can be rendered inside drei's <Html>, which mounts a separate React root —
// so router/app contexts from the page are NOT available in here. Anything the apps need
// from the outside world (navigation, power off...) is passed in through this context.
export interface DesktopContextValue {
  mode: "3d" | "2d";
  /** Phone layout: windows are full-screen sheets. */
  compact: boolean;
  openApp: (id: AppId) => void;
  closeApp: (id: AppId) => void;
  navigate: (path: string) => void;
  powerOff?: () => void;
}

export const DesktopContext = createContext<DesktopContextValue | null>(null);

export function useDesktopContext() {
  const ctx = useContext(DesktopContext);
  if (!ctx) throw new Error("useDesktopContext must be used inside <Desktop>");
  return ctx;
}
