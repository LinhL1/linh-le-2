// Hand-drawn 16×16 pixel icons, rendered as crisp SVG rects so there are no image assets.
// Each row is 16 characters; "." is transparent and every other character maps to PALETTE.

export const PALETTE: Record<string, string> = {
  K: "#1d1b16", // outline
  W: "#fbf8ee", // paper white
  B: "#e9dfc0", // beige
  D: "#a8996f", // dark beige / metal
  L: "#a7cfe6", // sky
  N: "#2f4b7c", // navy
  S: "#5f8a35", // sage
  G: "#8dff8d", // phosphor green
  T: "#10140f", // terminal black
  M: "#8a5a33", // leather brown
  Y: "#f0c24b", // brass / sun
  P: "#8b3a72", // plum
  R: "#c9564a", // stamp red
};

const BLANK = "................";

export const ICONS = {
  about: [
    BLANK,
    BLANK,
    ".KKKKKKKKKKKKKK.",
    ".KNNNNNNNNNNNNK.",
    ".KWWWWWWWWWWWWK.",
    ".KWLLLLWWWWWWWK.",
    ".KWLKKLWKKKKKWK.",
    ".KWLKKLWWWWWWWK.",
    ".KWLLLLWKKKKWWK.",
    ".KWKKKKWWWWWWWK.",
    ".KWKKKKWKKKKKWK.",
    ".KWWWWWWWWWWWWK.",
    ".KWWWWWWWWWWWWK.",
    ".KKKKKKKKKKKKKK.",
    BLANK,
    BLANK,
  ],
  experience: [
    BLANK,
    BLANK,
    BLANK,
    "......KKKK......",
    ".....KK..KK.....",
    ".KKKKKKKKKKKKKK.",
    ".KMMMMMMMMMMMMK.",
    ".KMMMMMMMMMMMMK.",
    ".KKKKKKYYKKKKKK.",
    ".KMMMMMYYMMMMMK.",
    ".KMMMMMMMMMMMMK.",
    ".KMMMMMMMMMMMMK.",
    ".KMMMMMMMMMMMMK.",
    ".KKKKKKKKKKKKKK.",
    BLANK,
    BLANK,
  ],
  community: [
    BLANK,
    BLANK,
    "....KKK.........",
    "...KBBBK..KKK...",
    "...KBBBK.KBBBK..",
    "...KBBBK.KBBBK..",
    "....KKK...KKK...",
    "..KKKKKKKKKKKK..",
    ".KSSSSSSKPPPPPK.",
    ".KSSSSSSKPPPPPK.",
    ".KSSSSSSKPPPPPK.",
    ".KSSSSSSKPPPPPK.",
    ".KKKKKKKKKKKKKK.",
    BLANK,
    BLANK,
    BLANK,
  ],
  projects: [
    BLANK,
    ".KKKKKKKKKKKKK..",
    ".KNNKDDDDDKNNNK.",
    ".KNNKDDKDDKNNNK.",
    ".KNNKDDKDDKNNNK.",
    ".KNNKKKKKKKNNNK.",
    ".KNNNNNNNNNNNNK.",
    ".KNWWWWWWWWWWNK.",
    ".KNWKKKKKKKKWNK.",
    ".KNWWWWWWWWWWNK.",
    ".KNWKKKKKKWWWNK.",
    ".KNWWWWWWWWWWNK.",
    ".KNWWWWWWWWWWNK.",
    ".KKKKKKKKKKKKKK.",
    BLANK,
    BLANK,
  ],
  contact: [
    BLANK,
    BLANK,
    BLANK,
    ".KKKKKKKKKKKKKK.",
    ".KWKWWWWWWWWKWK.",
    ".KWWKWWWWWWKWWK.",
    ".KWWWKWWWWKWWWK.",
    ".KWWWWKWWKWWWWK.",
    ".KWWWWWKKWWWWWK.",
    ".KWWWWWWWWWRRWK.",
    ".KWWWWWWWWWRRWK.",
    ".KWWWWWWWWWWWWK.",
    ".KKKKKKKKKKKKKK.",
    BLANK,
    BLANK,
    BLANK,
  ],
  terminal: [
    BLANK,
    ".KKKKKKKKKKKKKK.",
    ".KDDDDDDDDDRYSK.",
    ".KKKKKKKKKKKKKK.",
    ".KTTTTTTTTTTTTK.",
    ".KTGTTTTTTTTTTK.",
    ".KTTGTTTTTTTTTK.",
    ".KTTTGTTTTTTTTK.",
    ".KTTGTTTTTTTTTK.",
    ".KTGTTGGGGTTTTK.",
    ".KTTTTTTTTTTTTK.",
    ".KTTTTTTTTTTTTK.",
    ".KKKKKKKKKKKKKK.",
    BLANK,
    BLANK,
    BLANK,
  ],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;
