import { useReducer } from "react";

export const APP_IDS = ["about", "experience", "community", "projects", "contact", "terminal"] as const;
export type AppId = (typeof APP_IDS)[number];

export interface WindowState {
  id: AppId;
  x: number;
  y: number;
  z: number;
}

export interface DesktopState {
  windows: WindowState[];
  nextZ: number;
}

export type DesktopAction =
  | { type: "open"; id: AppId }
  | { type: "close"; id: AppId }
  | { type: "focus"; id: AppId }
  | { type: "move"; id: AppId; x: number; y: number }
  | { type: "closeAll" };

export const initialDesktopState: DesktopState = { windows: [], nextZ: 1 };

/** New windows cascade from the top-left so they never stack exactly on top of each other. */
const CASCADE = { x: 132, y: 20, step: 26, slots: 6 };

export function desktopReducer(state: DesktopState, action: DesktopAction): DesktopState {
  switch (action.type) {
    case "open": {
      if (state.windows.some((w) => w.id === action.id)) {
        return desktopReducer(state, { type: "focus", id: action.id });
      }
      const slot = state.windows.length % CASCADE.slots;
      const win: WindowState = {
        id: action.id,
        x: CASCADE.x + slot * CASCADE.step,
        y: CASCADE.y + slot * CASCADE.step,
        z: state.nextZ,
      };
      return { windows: [...state.windows, win], nextZ: state.nextZ + 1 };
    }
    case "close":
      return { ...state, windows: state.windows.filter((w) => w.id !== action.id) };
    case "focus": {
      const top = topWindow(state);
      if (!top || top.id === action.id || !state.windows.some((w) => w.id === action.id)) return state;
      return {
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, z: state.nextZ } : w)),
        nextZ: state.nextZ + 1,
      };
    }
    case "move":
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, x: action.x, y: action.y } : w)),
      };
    case "closeAll":
      return { ...state, windows: [] };
  }
}

export function topWindow(state: DesktopState): WindowState | undefined {
  return state.windows.reduce<WindowState | undefined>((top, w) => (!top || w.z > top.z ? w : top), undefined);
}

export function useDesktop() {
  return useReducer(desktopReducer, initialDesktopState);
}
