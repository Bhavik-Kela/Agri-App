// Shared design tokens for the agri-app UI.
// Palette is grounded in the farming subject: deep forest + leaf greens,
// a harvest amber accent, and a warm cream surface (not a generic gradient default).

export const colors = {
  forest: "#1B4332",      // deep green - primary surfaces, headers
  forestDark: "#0D1F17",  // near-black ink - high-contrast text
  leaf: "#52B788",        // fresh leaf green - secondary gradient stop
  leafLight: "#95D5B2",   // pale leaf - subtle backgrounds, borders
  amber: "#F4A300",       // harvest amber - accents, CTAs, highlights
  amberDark: "#C97F00",   // pressed/active amber
  cream: "#FFFBF2",       // warm off-white - app background
  card: "#FFFFFF",        // card surfaces
  error: "#E63946",       // soft red - validation/errors
  textPrimary: "#16241D",
  textSecondary: "#5B6F64",
  textOnDark: "#F4F1EA",
  border: "#E3E8DF",
};

export const gradients = {
  primary: [colors.forest, colors.leaf],       // header / primary buttons
  accent: [colors.amber, colors.amberDark],     // role cards / CTA highlight
  sunrise: ["#FFE8B8", "#FFFBF2"],              // soft card-top glow
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
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const typography = {
  display: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  button: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cream,
    letterSpacing: 0.3,
  },
};

export default { colors, gradients, spacing, radius, typography };