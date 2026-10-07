// ─────────────────────────────────────────────────────────────────────────────
// Which computer model the 3D scene renders. This is the ONLY file to edit when
// swapping in a downloaded .glb (see the example at the bottom and CREDITS.md).
// ─────────────────────────────────────────────────────────────────────────────

export type Vec3 = [number, number, number];

/** Where the interactive desktop sits, in world units. Width:height should be 4:3. */
export interface ScreenRect {
  position: Vec3;
  rotation: Vec3;
  width: number;
  height: number;
}

export type ComputerModelConfig =
  | { kind: "procedural" }
  | {
      kind: "glb";
      /** URL of the model, e.g. `${import.meta.env.BASE_URL}models/crt.glb` (file in public/models/). */
      url: string;
      position: Vec3;
      rotation: Vec3;
      scale: number;
      /** Glass rectangle of the model's monitor, after position/rotation/scale are applied. */
      screen: ScreenRect;
      /** Mesh names to hide, e.g. the model's own baked screen so the live desktop shows through. */
      hideMeshes?: string[];
    };

/** Screen rect of the built-in procedural computer (see ProceduralComputer.tsx). */
export const PROCEDURAL_SCREEN: ScreenRect = {
  position: [0, 1.36, 0.36],
  rotation: [0, 0, 0],
  width: 1.28,
  height: 0.96,
};

// `as` keeps the union type, so the GLB branches below still type-check.
export const COMPUTER_MODEL = { kind: "procedural" } as ComputerModelConfig;

// Example — a CC-licensed CRT from Sketchfab, exported as .glb into public/models/:
//
// export const COMPUTER_MODEL = {
//   kind: "glb",
//   url: `${import.meta.env.BASE_URL}models/crt.glb`,
//   position: [0, 0, 0],
//   rotation: [0, 0, 0],
//   scale: 1,
//   screen: { position: [0, 1.36, 0.36], rotation: [0, 0, 0], width: 1.28, height: 0.96 },
//   hideMeshes: ["Screen"],
// } as ComputerModelConfig;
//
// Tune `screen` until the desktop lines up with the glass, then add the model's
// author, source URL and license to CREDITS.md.

export const ACTIVE_SCREEN: ScreenRect = COMPUTER_MODEL.kind === "glb" ? COMPUTER_MODEL.screen : PROCEDURAL_SCREEN;

/** Pixel size of the desktop DOM rendered onto the screen (4:3). Must match `.retro-desktop--3d` in retro.css.
 *  800×600 (the classic Win98 resolution) rather than more pixels, so text stays readable once the
 *  screen is scaled down on small laptops. */
export const SCREEN_PIXELS = { width: 800, height: 600 };
