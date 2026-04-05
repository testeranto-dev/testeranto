/**
 * Accessible Low-Blue Graph Visualization Palette
 * Accommodates Protanopia, Deuteranopia, and Tritanopia.
 */

export const Palette = {
  // Base & Canvas
  black: "#000000",
  ivory: "#FFFDF0",
  obsidian: "#1A1918",
  silver: "#BDC0C3",

  // Success (Greens)
  oliveDark: "#004949",
  oliveDarkSubtle: "#E6F4EA",
  oliveDeep: "#002D2D",
  bluishGreen: "#009E73",

  // Warning (Ambers/Yellows)
  amberGold: "#F5C710",
  amberGoldSubtle: "#FFF8E1",
  amberDeep: "#332B00",
  amberDark: "#856404",

  // Error (Oranges/Reds)
  deepOrange: "#D55E00",
  deepOrangeSubtle: "#FCE8E6",
  deepOrangeDeep: "#331600",
  vermillionLight: "#FFB07C",

  // Neutral (Greys)
  charcoal: "#494949",
  charcoalSubtle: "#F5F5F5",
  charcoalDeep: "#1A1A1A",

  // Progress (Rust/Purples)
  rust: "#882255",
  rustSubtle: "#F3E5F5",
  rustDeep: "#2D0015",
  reddishPurple: "#CC79A7",

  // Muted (Warm Greys)
  warmGrey: "#706A63",
  warmGreySubtle: "#EFEBE7",
  warmGreyDeep: "#2A2826",
  warmGreyLight: "#A8A199",
} as const;

export type PaletteKey = keyof typeof Palette;

export interface StateFlavor {
  bg: PaletteKey;
  fg: PaletteKey;
}

export type ThemeName = "light" | "dark";
export type StateName =

  | "canvas"
  | "success"
  | "warning"

  | "error"
  | "neutral"
  | "inProgress"

  | "muted";

export const Flavors: Record<ThemeName, Record<StateName, StateFlavor>> = {
  light: {
    canvas: { bg: "ivory", fg: "black" },
    success: { bg: "oliveDarkSubtle", fg: "oliveDark" },
    warning: { bg: "amberGoldSubtle", fg: "amberDark" },
    error: { bg: "deepOrangeSubtle", fg: "deepOrange" },
    neutral: { bg: "charcoalSubtle", fg: "charcoal" },
    inProgress: { bg: "rustSubtle", fg: "rust" },
    muted: { bg: "warmGreySubtle", fg: "warmGrey" },
  },
  dark: {
    canvas: { bg: "obsidian", fg: "silver" },
    success: { bg: "oliveDeep", fg: "bluishGreen" },
    warning: { bg: "amberDeep", fg: "amberGold" },
    error: { bg: "deepOrangeDeep", fg: "vermillionLight" },
    neutral: { bg: "charcoalDeep", fg: "silver" },
    inProgress: { bg: "rustDeep", fg: "reddishPurple" },
    muted: { bg: "warmGreyDeep", fg: "warmGreyLight" },
  },
};

/**
 * Helper to get the hex code for a specific state and theme
 */
export const getColor = (
  theme: ThemeName,
  state: StateName,
  type: "bg" | "fg"
): string => {
  const key = Flavors[theme][state][type];
  return Palette[key];
};
