/**
 * Brooklin Pub Mobile Theme
 * Exact match of the web frontend's MUI theme translated to React Native
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    main: "#6A3A1E",
    dark: "#3C1F0E",
    light: "#8B5A2B",
  },

  // Secondary/Accent Colors (Gold)
  secondary: {
    main: "#D9A756",
    dark: "#B8923F",
    light: "#E8C078",
    lighter: "#F5D699",
  },

  // Background Colors
  background: {
    default: "#FDF8F3",
    paper: "#FFFDFB",
    dark: "#1A0D0A",
    card: "rgba(255,255,255,0.98)",
  },

  // Text Colors
  text: {
    primary: "#3C1F0E",
    secondary: "#6A3A1E",
    muted: "rgba(106, 58, 30, 0.7)",
    light: "#F3E3CC",
    lightMuted: "rgba(243, 227, 204, 0.9)",
    gold: "#D9A756",
  },

  // Semantic Colors
  error: "#8A2A2A",
  success: "#22C55E",
  warning: "#F59E0B",

  // Decorative
  cream: "#F3E3CC",
  olive: "#7C8B48",
  wine: "#8A2A2A",

  // Glass Effects
  glass: {
    white: "rgba(255,255,255,0.69)",
    dark: "rgba(0,0,0,0.25)",
    gold: "rgba(217,167,86,0.15)",
    goldBorder: "rgba(217,167,86,0.3)",
  },

  // Overlay Colors
  overlay: {
    dark: "rgba(0,0,0,0.75)",
    medium: "rgba(0,0,0,0.5)",
    light: "rgba(0,0,0,0.25)",
    warmDark: "rgba(60,31,14,0.7)",
    warmMedium: "rgba(60,31,14,0.5)",
    creamLight: "rgba(253,248,243,0.88)",
    creamMedium: "rgba(253,248,243,0.92)",
    creamStrong: "rgba(253,248,243,0.95)",
    white80: "rgba(255,253,251,0.7)",
    white50: "rgba(255,253,251,0.5)",
  },

  // Border colors
  border: {
    gold: "rgba(217,167,86,0.3)",
    goldStrong: "rgba(217,167,86,0.6)",
    light: "rgba(217,167,86,0.15)",
  },
} as const;

export const typography = {
  fontFamily: {
    heading: "CormorantGaramond-Bold", // Loaded via expo-font, fallback serif
    headingSemibold: "CormorantGaramond-SemiBold",
    headingMedium: "CormorantGaramond-Medium",
    body: "Inter-Regular", // Loaded via expo-font, fallback system
    bodyMedium: "Inter-Medium",
    bodySemibold: "Inter-SemiBold",
    bodyBold: "Inter-Bold",
    accent: "GreatVibes-Regular", // Cursive accent font
    display: "PlayfairDisplay-Bold", // Display font
  },

  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 42,
    "6xl": 48,
  },

  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
} as const;

export const borderRadius = {
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#6A3A1E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  gold: {
    shadowColor: "#D9A756",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: "#6A3A1E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;

const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} as const;

export default theme;
