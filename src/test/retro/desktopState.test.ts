import { describe, expect, it } from "vitest";
import { desktopReducer, initialDesktopState, topWindow } from "@/retro/desktop/useDesktop";

describe("desktopReducer", () => {
  it("opens windows on top, cascading their positions", () => {
    let s = desktopReducer(initialDesktopState, { type: "open", id: "about" });
    s = desktopReducer(s, { type: "open", id: "projects" });
    expect(s.windows.map((w) => w.id)).toEqual(["about", "projects"]);
    expect(topWindow(s)?.id).toBe("projects");
    expect(s.windows[1].x).toBeGreaterThan(s.windows[0].x);
  });

  it("re-opening an open window focuses it instead of duplicating", () => {
    let s = desktopReducer(initialDesktopState, { type: "open", id: "about" });
    s = desktopReducer(s, { type: "open", id: "contact" });
    s = desktopReducer(s, { type: "open", id: "about" });
    expect(s.windows).toHaveLength(2);
    expect(topWindow(s)?.id).toBe("about");
  });

  it("ignores focus for the top window or a closed window", () => {
    const s = desktopReducer(initialDesktopState, { type: "open", id: "about" });
    expect(desktopReducer(s, { type: "focus", id: "about" })).toBe(s);
    expect(desktopReducer(s, { type: "focus", id: "terminal" })).toBe(s);
  });

  it("moves and closes windows", () => {
    let s = desktopReducer(initialDesktopState, { type: "open", id: "terminal" });
    s = desktopReducer(s, { type: "move", id: "terminal", x: 300, y: 40 });
    expect(s.windows[0]).toMatchObject({ x: 300, y: 40 });
    s = desktopReducer(s, { type: "close", id: "terminal" });
    expect(s.windows).toEqual([]);
    expect(topWindow(s)).toBeUndefined();
  });
});
