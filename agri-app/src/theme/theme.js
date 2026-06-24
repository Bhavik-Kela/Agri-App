// Monochrome design tokens — premium black/white/grey
// Inspired by Apple, Linear, Notion

export const colors = {
  // Core surfaces
  bg: "#0A0A0A",
  surface: "#111111",
  surfaceRaised: "#1A1A1A",
  surfaceSunken: "#080808",

  // Borders
  border: "#222222",
  borderStrong: "#333333",
  hairline: "#1E1E1E",

  // Text
  textPrimary: "#F5F5F5",
  textSecondary: "#888888",
  textTertiary: "#555555",
  textInverse: "#0A0A0A",

  // Accent
  accent: "#FFFFFF",
  accentMuted: "#E0E0E0",

  // Status (desaturated)
  statusPendingBg: "#1C1A12",
  statusPendingText: "#B8A050",
  statusAcceptedBg: "#0F1C14",
  statusAcceptedText: "#5BB880",
  statusRejectedBg: "#1C1010",
  statusRejectedText: "#C06060",
  statusCompletedBg: "#111520",
  statusCompletedText: "#6080C8",

  // Utility
  error: "#C05050",
  white: "#FFFFFF",
  black: "#000000",

  // ─── Legacy aliases (keep old components working) ───
  cream: "#0A0A0A",
  card: "#111111",
  forest: "#FFFFFF",
  forestDark: "#F5F5F5",
  leaf: "#FFFFFF",
  leafLight: "#1A1A1A",
  amber: "#FFFFFF",
  amberDark: "#CCCCCC",
  amberLight: "#1A1A1A",
  textOnDark: "#0A0A0A",
  ink: "#F5F5F5",
  inkSoft: "#888888",        // ← was missing, now present
  chipBg: "#1A1A1A",
  surfaceSunkenLegacy: "#080808",

  faint: "#141414",
danger: "#C05050",
overlay: "rgba(0,0,0,0.6)",
};

export const gradients = {
  primary: ["#1A1A1A", "#0A0A0A"],
  accent:  ["#FFFFFF", "#D0D0D0"],
  sunrise: ["#1A1A1A", "#111111"],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.8,
    color: "#F5F5F5",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: "#F5F5F5",
  },
  body: {
    fontSize: 14,
    fontWeight: "400",
    color: "#888888",
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#555555",
  },
  button: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0A0A0A",
    letterSpacing: -0.1,
  },
  mono: {
    fontSize: 13,
    fontFamily: "monospace",
    color: "#888888",
  },
};

// Default export so `import theme from "../theme/theme"` also works
const theme = { colors, gradients, spacing, radius, typography };
export default theme;