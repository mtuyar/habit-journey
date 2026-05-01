import { createTamagui, createTokens, createFont } from "tamagui";
import { shorthands } from "@tamagui/shorthands";
import { themes as defaultThemes } from "@tamagui/themes";
import { createMedia } from "@tamagui/react-native-media-driver";
import { createAnimations } from "@tamagui/animations-react-native";

/**
 * Habit Journey palette
 *
 * Philosophy: neutral surfaces, teal reserved for primary brand moments.
 * Don't sprinkle teal across borders, text, and backgrounds — keep it for
 * CTAs, active states, and progress accents. Surfaces use slate.
 *
 * Status colors are semantic (success/warning/danger/locked), not teal-shaded.
 */
const palette = {
  // Brand — teal, used sparingly
  teal50: "#F0FDFA",
  teal100: "#CCFBF1",
  teal200: "#99F6E4",
  teal300: "#5EEAD4",
  teal400: "#2DD4BF",
  teal500: "#14B8A6",
  teal600: "#0D9488",
  teal700: "#0F766E",
  teal800: "#115E59",
  teal900: "#134E4A",

  // Neutral surfaces — slate
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",

  // Dark-mode teal-tinted surfaces (kept from existing approved look)
  darkBg: "#07211F",
  darkSurface: "#0E3330",
  darkSurfaceAlt: "#0A2A28",
  darkBorder: "#1B5E58",
  darkBorderStrong: "#2A7A72",
  darkText: "#CCFBF1",
  darkTextMuted: "#94B8B5",
  darkTextSubtle: "#5F8B8A",

  // Semantic
  success: "#059669",
  successSoft: "#05966918",
  warning: "#F59E0B",
  warningSoft: "#F59E0B18",
  danger: "#EF4444",
  dangerSoft: "#EF444418",

  // Transparent helpers
  transparent: "rgba(0,0,0,0)",
  scrimLight: "rgba(15,23,42,0.04)",
  scrimDark: "rgba(0,0,0,0.30)",
} as const;

const sizes = {
  $0: 0,
  $0_5: 2,
  $1: 4,
  $1_5: 6,
  $2: 8,
  $2_5: 10,
  $3: 12,
  $3_5: 14,
  $4: 16,
  $5: 20,
  $6: 24,
  $7: 28,
  $8: 32,
  $9: 36,
  $10: 40,
  $11: 44,
  $12: 48,
  $14: 56,
  $16: 64,
  $20: 80,
  $24: 96,
  $true: 16,
} as const;

const space = {
  ...sizes,
  "-1": -4,
  "-2": -8,
  "-3": -12,
  "-4": -16,
  "-6": -24,
  "-8": -32,
} as const;

const radius = {
  $0: 0,
  $1: 4,
  $2: 8,
  $3: 12,
  $4: 16,
  $5: 20,
  $6: 24,
  $7: 28,
  $8: 32,
  $round: 9999,
  $true: 16,
} as const;

const zIndex = {
  $0: 0,
  $1: 100,
  $2: 200,
  $3: 300,
  $4: 400,
  $5: 500,
  $true: 0,
} as const;

const tokens = createTokens({
  size: sizes,
  space,
  radius,
  zIndex,
  color: palette,
});

/**
 * Themes share the same token names. Components reference `$bg`, `$surface`,
 * `$text` etc. and Tamagui swaps the underlying value per theme.
 */
type AppTheme = Record<string, string>;

const lightTheme: AppTheme = {
  // Surfaces
  bg: palette.slate50,
  surface: "#FFFFFF",
  surfaceAlt: palette.slate100,

  // Borders
  border: palette.slate200,
  borderStrong: palette.slate300,

  // Text
  text: palette.slate900,
  textStrong: palette.slate900,
  textMuted: palette.slate500,
  textSubtle: palette.slate400,
  textInverse: "#FFFFFF",

  // Brand accent — used for CTAs, active states only
  accent: palette.teal600,
  accentHover: palette.teal700,
  accentSoft: "#0D948818",
  accentTint: palette.teal50,
  accentText: palette.teal900,

  // Semantic
  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,

  // Locked/disabled
  locked: palette.slate300,
  lockedSoft: palette.slate100,

  // Shadows
  shadowColor: "#0F172A",
  scrim: palette.scrimLight,
};

const darkTheme: AppTheme = {
  bg: palette.darkBg,
  surface: palette.darkSurface,
  surfaceAlt: palette.darkSurfaceAlt,

  border: palette.darkBorder,
  borderStrong: palette.darkBorderStrong,

  text: palette.darkText,
  textStrong: "#FFFFFF",
  textMuted: palette.darkTextMuted,
  textSubtle: palette.darkTextSubtle,
  textInverse: palette.slate900,

  accent: palette.teal500,
  accentHover: palette.teal400,
  accentSoft: "#14B8A626",
  accentTint: "#0D948818",
  accentText: palette.teal100,

  success: "#10B981",
  successSoft: "#10B98126",
  warning: "#FBBF24",
  warningSoft: "#FBBF2426",
  danger: "#F87171",
  dangerSoft: "#F8717126",

  locked: palette.slate700,
  lockedSoft: palette.darkSurfaceAlt,

  shadowColor: "#000000",
  scrim: palette.scrimDark,
};

const themes = {
  light: lightTheme,
  dark: darkTheme,
};

const headingFont = createFont({
  family: "System",
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 15,
    5: 17,
    6: 20,
    7: 24,
    8: 28,
    9: 34,
    10: 40,
    true: 15,
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 18,
    4: 20,
    5: 22,
    6: 26,
    7: 30,
    8: 34,
    9: 40,
    10: 46,
    true: 20,
  },
  weight: {
    4: "400",
    5: "500",
    6: "600",
    7: "700",
    8: "800",
    9: "900",
    true: "400",
  },
  letterSpacing: {
    1: 0.4,
    2: 0.2,
    3: 0,
    4: -0.1,
    5: -0.2,
    6: -0.3,
    7: -0.4,
    8: -0.5,
    9: -0.6,
    10: -0.8,
    true: 0,
  },
});

const bodyFont = createFont({
  family: "System",
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    7: 18,
    8: 20,
    true: 15,
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 18,
    4: 20,
    5: 22,
    6: 24,
    7: 26,
    8: 28,
    true: 22,
  },
  weight: {
    4: "400",
    5: "500",
    6: "600",
    7: "700",
    8: "800",
    true: "400",
  },
  letterSpacing: {
    1: 0.4,
    2: 0.2,
    3: 0,
    4: 0,
    5: -0.1,
    6: -0.2,
    7: -0.3,
    8: -0.4,
    true: 0,
  },
});

const animations = createAnimations({
  fast: { type: "timing", duration: 150 },
  medium: { type: "timing", duration: 250 },
  slow: { type: "timing", duration: 400 },
  bouncy: { type: "spring", damping: 12, mass: 0.9, stiffness: 180 },
});

const config = createTamagui({
  defaultFont: "body",
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  animations,
  themes,
  tokens,
  shorthands,
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: "none" },
    pointerCoarse: { pointer: "coarse" },
  }),
});

export type AppConfig = typeof config;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
