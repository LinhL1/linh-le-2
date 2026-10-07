import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { PixelIcon, type IconName } from "./icons";
import type { WindowState } from "./useDesktop";

interface WindowProps {
  win: WindowState;
  title: string;
  icon: IconName;
  width: number;
  height: number;
  /** Size of the desktop area, used to keep windows on screen. */
  area: { width: number; height: number };
  focused: boolean;
  /** Full-screen sheet layout for phones. */
  compact: boolean;
  /** Increments whenever the desktop wants keyboard focus moved into this window.
   *  Focus goes to the first `[data-autofocus]` element inside, else the window itself. */
  focusRequest: number;
  onClose: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  children: ReactNode;
  bodyClassName?: string;
}

// Pixel "×" as [x, y, width] runs on an 8×7 grid.
const CLOSE_GLYPH = [
  [0, 0, 2], [6, 0, 2],
  [1, 1, 2], [5, 1, 2],
  [2, 2, 4],
  [3, 3, 2],
  [2, 4, 4],
  [1, 5, 2], [5, 5, 2],
  [0, 6, 2], [6, 6, 2],
];

export function CloseGlyph() {
  return (
    <svg viewBox="0 0 8 7" width="10" height="9" shapeRendering="crispEdges" aria-hidden="true">
      {CLOSE_GLYPH.map(([cx, cy, cw], i) => (
        <rect key={i} x={cx} y={cy} width={cw} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}

const MARGIN = 8;
const TITLE_GRAB = 72; // px of the title bar that must stay visible when dragged off an edge

export function Window({
  win,
  title,
  icon,
  width,
  height,
  area,
  focused,
  compact,
  focusRequest,
  onClose,
  onFocus,
  onMove,
  children,
  bodyClassName,
}: WindowProps) {
  const titleId = useId();
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ startX: number; startY: number; x: number; y: number; scale: number } | null>(null);

  useEffect(() => {
    if (focusRequest === 0) return;
    // preventScroll matters in 3D: the desktop lives in a CSS-transformed, overflow-hidden
    // layer and a scroll-into-view would shift the whole screen.
    const target = ref.current?.querySelector<HTMLElement>("[data-autofocus]") ?? ref.current;
    target?.focus({ preventScroll: true });
  }, [focusRequest]);

  const w = Math.min(width, area.width - MARGIN * 2);
  const h = Math.min(height, area.height - MARGIN * 2);
  const x = Math.max(MARGIN - w + TITLE_GRAB, Math.min(win.x, area.width - TITLE_GRAB));
  const y = Math.max(0, Math.min(win.y, area.height - 28));

  const onTitlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (compact || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const el = ref.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return;
    // In 3D the desktop is scaled by a CSS matrix; convert screen px back to desktop px.
    const scale = parent.getBoundingClientRect().width / parent.offsetWidth || 1;
    drag.current = { startX: e.clientX, startY: e.clientY, x, y, scale };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onTitlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el) return;
    // Mutate the DOM directly while dragging and commit once on release, so a drag
    // doesn't re-render the desktop on every pointer event.
    const nx = Math.max(MARGIN - w + TITLE_GRAB, Math.min(d.x + (e.clientX - d.startX) / d.scale, area.width - TITLE_GRAB));
    const ny = Math.max(0, Math.min(d.y + (e.clientY - d.startY) / d.scale, area.height - 28));
    el.style.left = `${nx}px`;
    el.style.top = `${ny}px`;
  };

  const onTitlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!drag.current || !el) return;
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    onMove(parseFloat(el.style.left), parseFloat(el.style.top));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <section
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`retro-window${focused ? " is-focused" : ""}${compact ? " is-compact" : ""}`}
      style={compact ? { zIndex: win.z } : { left: x, top: y, width: w, height: h, zIndex: win.z }}
      onPointerDownCapture={onFocus}
      onFocusCapture={onFocus}
      onKeyDown={onKeyDown}
    >
      <div
        className="retro-window__titlebar"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onPointerCancel={onTitlePointerUp}
      >
        <PixelIcon name={icon} size={16} />
        <h2 id={titleId} className="retro-window__title">
          {title}
        </h2>
        <button type="button" className="retro-window__close" aria-label={`Close ${title}`} onClick={onClose}>
          <CloseGlyph />
        </button>
      </div>
      <div className={`retro-window__body${bodyClassName ? ` ${bodyClassName}` : ""}`}>{children}</div>
    </section>
  );
}
