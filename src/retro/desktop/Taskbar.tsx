import { useEffect, useState } from "react";
import { APP_BY_ID } from "./apps";
import { PixelIcon } from "./icons";
import type { AppId, WindowState } from "./useDesktop";

interface TaskbarProps {
  windows: WindowState[];
  focusedId: AppId | undefined;
  onSelect: (id: AppId) => void;
  /** 3D: zoom back out. */
  onPowerOff?: () => void;
  /** 2D with WebGL available: switch to the 3D desk. */
  onSwitchTo3d?: () => void;
  compact: boolean;
}

const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time className="retro-taskbar__clock" dateTime={now.toISOString()}>
      {formatTime(now)}
    </time>
  );
}

export function Taskbar({ windows, focusedId, onSelect, onPowerOff, onSwitchTo3d, compact }: TaskbarProps) {
  // Taskbar buttons stay in the order windows were opened, like the real thing.
  return (
    <div className="retro-taskbar">
      {onPowerOff && (
        <button type="button" className="retro-btn retro-taskbar__power" onClick={onPowerOff}>
          <PowerGlyph />
          <span>Power off</span>
        </button>
      )}
      {onSwitchTo3d && (
        <button type="button" className="retro-btn retro-taskbar__power" onClick={onSwitchTo3d}>
          <PowerGlyph />
          <span>3D view</span>
        </button>
      )}
      <ul className="retro-taskbar__tasks" aria-label="Open windows">
        {windows.map((w) => {
          const app = APP_BY_ID[w.id];
          return (
            <li key={w.id}>
              <button
                type="button"
                className="retro-btn retro-taskbar__task"
                aria-pressed={w.id === focusedId}
                onClick={() => onSelect(w.id)}
                title={app.title}
              >
                <PixelIcon name={app.icon} size={16} />
                {!compact && <span>{app.title}</span>}
                {compact && <span className="sr-only">{app.title}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <Clock />
    </div>
  );
}

function PowerGlyph() {
  return (
    <svg viewBox="0 0 9 9" width="12" height="12" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="4" y="0" width="1" height="4" fill="currentColor" />
      <rect x="2" y="1" width="1" height="1" fill="currentColor" />
      <rect x="6" y="1" width="1" height="1" fill="currentColor" />
      <rect x="1" y="2" width="1" height="1" fill="currentColor" />
      <rect x="7" y="2" width="1" height="1" fill="currentColor" />
      <rect x="0" y="3" width="1" height="3" fill="currentColor" />
      <rect x="8" y="3" width="1" height="3" fill="currentColor" />
      <rect x="1" y="6" width="1" height="1" fill="currentColor" />
      <rect x="7" y="6" width="1" height="1" fill="currentColor" />
      <rect x="2" y="7" width="5" height="1" fill="currentColor" />
    </svg>
  );
}
