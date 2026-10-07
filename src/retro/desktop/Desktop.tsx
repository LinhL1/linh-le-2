import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { APPS, APP_BY_ID } from "./apps";
import { DesktopContext, type DesktopContextValue } from "./DesktopContext";
import { PixelIcon } from "./icons";
import { Taskbar } from "./Taskbar";
import { topWindow, useDesktop, type AppId } from "./useDesktop";
import { CloseGlyph, Window } from "./Window";
import "../retro.css";

export interface DesktopProps {
  mode: "3d" | "2d";
  /** When false (3D, zoomed out) the desktop is visible but inert. */
  active?: boolean;
  /** Phone layout: icon grid + full-screen windows. */
  compact?: boolean;
  /** Router navigation, passed in because drei's <Html> renders outside the router context. */
  navigate: (path: string) => void;
  onPowerOff?: () => void;
  onSwitchTo3d?: () => void;
  /** Move focus to the first icon each time the desktop becomes active (3D zoom-in). */
  focusOnActivate?: boolean;
}

// Used until the desktop has been measured (and in jsdom, which has no layout).
const FALLBACK_AREA = { width: 800, height: 564 };

const LINE_HEIGHT_PX = 16;

/** Nearest ancestor of `target` (up to `root`) that can still scroll vertically in the wheel's direction. */
function findScroller(target: EventTarget | null, deltaY: number, root: HTMLElement): HTMLElement | null {
  for (let el = target instanceof Element ? target : null; el && el !== root; el = el.parentElement) {
    if (!(el instanceof HTMLElement)) continue;
    const { overflowY } = getComputedStyle(el);
    if (overflowY !== "auto" && overflowY !== "scroll") continue;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) continue;
    if ((deltaY < 0 && el.scrollTop > 0) || (deltaY > 0 && el.scrollTop < max)) return el;
  }
  return null;
}

export function Desktop({
  mode,
  active = true,
  compact = false,
  navigate,
  onPowerOff,
  onSwitchTo3d,
  focusOnActivate = false,
}: DesktopProps) {
  const [state, dispatch] = useDesktop();
  const [area, setArea] = useState(FALLBACK_AREA);
  const [focusRequests, setFocusRequests] = useState<Partial<Record<AppId, number>>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLUListElement>(null);
  const openers = useRef(new Map<AppId, HTMLElement | null>());
  const focused = topWindow(state);

  // Measure the layout size (not the CSS-transformed size, which is what we want in 3D too).
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const update = (width: number, height: number) => {
      if (width > 0 && height > 0) setArea({ width, height });
    };
    update(el.offsetWidth, el.offsetHeight);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // In 3D the desktop sits inside drei's `transform-style: preserve-3d` layer, and Chromium won't
  // wheel-scroll anything in a preserve-3d context. So scroll the element under the cursor ourselves.
  useEffect(() => {
    const root = rootRef.current;
    if (mode !== "3d" || !root) return;
    const onWheel = (e: WheelEvent) => {
      const unit = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? LINE_HEIGHT_PX : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? root.clientHeight : 1;
      const dy = e.deltaY * unit;
      const scroller = findScroller(e.target, dy, root);
      if (!scroller) return;
      // preventDefault so browsers that *can* scroll here natively don't scroll twice.
      e.preventDefault();
      scroller.scrollTop += dy;
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [mode]);

  // `inert` isn't in React 18's prop types, so set it directly.
  useEffect(() => {
    rootRef.current?.toggleAttribute("inert", !active);
  }, [active]);

  useEffect(() => {
    if (active && focusOnActivate) {
      iconsRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    }
  }, [active, focusOnActivate]);

  const requestFocus = (id: AppId) => setFocusRequests((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));

  const openApp = useCallback((id: AppId) => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Keep the original opener if the window is merely being re-focused.
    if (!openers.current.has(id)) openers.current.set(id, opener);
    dispatch({ type: "open", id });
    requestFocus(id);
  }, [dispatch]);

  const closeApp = useCallback((id: AppId) => {
    const opener = openers.current.get(id);
    openers.current.delete(id);
    // Move focus before the window unmounts so it never falls back to <body>.
    const fallback = iconsRef.current?.querySelector<HTMLElement>(`[data-app="${id}"]`);
    const target = opener?.isConnected && !opener.closest(".retro-window") ? opener : fallback;
    target?.focus({ preventScroll: true });
    dispatch({ type: "close", id });
  }, [dispatch]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    const top = topWindow(state);
    if (top) closeApp(top.id);
    else if (onPowerOff) onPowerOff();
    else if (mode === "2d") onSwitchTo3d?.();
  };

  const ctx = useMemo<DesktopContextValue>(
    () => ({ mode, compact, openApp, closeApp, navigate, powerOff: onPowerOff }),
    [mode, compact, openApp, closeApp, navigate, onPowerOff],
  );

  return (
    <DesktopContext.Provider value={ctx}>
      <div
        ref={rootRef}
        className={`retro-desktop retro-desktop--${mode}${compact ? " is-compact" : ""}${active ? "" : " is-idle"}`}
        onKeyDown={onKeyDown}
      >
        <div ref={areaRef} className="retro-desktop__area">
          <p className="retro-desktop__wallpaper" aria-hidden="true">
            linh le
          </p>
          <nav aria-label="Desktop">
            <ul ref={iconsRef} className="retro-icons">
              {APPS.map((app) => (
                <li key={app.id}>
                  <button type="button" className="retro-icon" data-app={app.id} onClick={() => openApp(app.id)}>
                    <PixelIcon name={app.icon} />
                    <span className="retro-icon__label">{app.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {mode === "2d" && onSwitchTo3d && (
            <button
              type="button"
              className="retro-desktop__exit"
              aria-label="Exit 2D mode"
              title="Exit 2D mode (Esc)"
              onClick={onSwitchTo3d}
            >
              <CloseGlyph />
            </button>
          )}

          {state.windows.map((win) => {
            const app = APP_BY_ID[win.id];
            return (
              <Window
                key={win.id}
                win={win}
                title={app.title}
                icon={app.icon}
                width={app.width}
                height={app.height}
                area={area}
                compact={compact}
                focused={focused?.id === win.id}
                focusRequest={focusRequests[win.id] ?? 0}
                onClose={() => closeApp(win.id)}
                onFocus={() => dispatch({ type: "focus", id: win.id })}
                onMove={(x, y) => dispatch({ type: "move", id: win.id, x, y })}
                bodyClassName={app.bodyClassName}
              >
                <app.Component />
              </Window>
            );
          })}
        </div>

        {/* Outside the area (which stops at the taskbar) so it centres on the whole screen. */}
        {!active && (
          <p className="retro-desktop__idle" aria-hidden="true">
            click the screen to start
          </p>
        )}

        <Taskbar
          windows={state.windows}
          focusedId={focused?.id}
          onSelect={(id) => {
            dispatch({ type: "focus", id });
            requestFocus(id);
          }}
          onPowerOff={onPowerOff}
          onSwitchTo3d={onSwitchTo3d}
          compact={compact}
        />
        <div className="retro-crt" aria-hidden="true" />
      </div>
    </DesktopContext.Provider>
  );
}
