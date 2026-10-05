import { describe, expect, it } from "vitest";
import { decideRetroMode, type RetroModeInputs } from "@/retro/useRetroMode";
import { ICONS, PALETTE } from "@/retro/desktop/pixelIcons";
import { securityHighlights } from "@/data/security";

const base: RetroModeInputs = { smallViewport: false, reducedMotion: false, webgl: true, forced: null };

describe("decideRetroMode", () => {
  it("defaults to 3D on a capable desktop", () => {
    expect(decideRetroMode(base)).toEqual({ mode: "3d", reason: "default" });
  });

  it("falls back to 2D for small viewports, reduced motion and missing WebGL", () => {
    expect(decideRetroMode({ ...base, smallViewport: true }).mode).toBe("2d");
    expect(decideRetroMode({ ...base, reducedMotion: true }).mode).toBe("2d");
    expect(decideRetroMode({ ...base, webgl: false }).mode).toBe("2d");
  });

  it("respects an explicit choice, except when WebGL is missing", () => {
    expect(decideRetroMode({ ...base, forced: "2d" }).mode).toBe("2d");
    expect(decideRetroMode({ ...base, reducedMotion: true, forced: "3d" }).mode).toBe("3d");
    expect(decideRetroMode({ ...base, webgl: false, forced: "3d" })).toEqual({ mode: "2d", reason: "no-webgl" });
  });
});

describe("pixel icons", () => {
  it.each(Object.entries(ICONS))("%s is a 16x16 grid using palette colours", (_name, rows) => {
    expect(rows).toHaveLength(16);
    for (const row of rows) {
      expect(row).toHaveLength(16);
      for (const ch of row) expect(ch === "." || ch in PALETTE).toBe(true);
    }
  });
});

describe("security highlights", () => {
  it("resolves every referenced experience and project entry", () => {
    // If an entry in experience.ts / projects.ts is renamed, its highlight silently disappears.
    expect(securityHighlights.map((h) => h.title)).toEqual([
      "Project Safeweb",
      "IN Network",
      "IN Network",
      "PhishSTX",
      "INformed",
    ]);
  });
});
