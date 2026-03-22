import { useWindowDimensions } from "react-native";

export const BREAKPOINTS = {
  sm: 375,   // small phones (iPhone SE, small Androids)
  md: 414,   // standard phones
  lg: 600,   // large phones / small tablets
  xl: 768,   // tablets / iPads
  xxl: 1024, // iPad Pro / large tablets
} as const;

/**
 * Reactive responsive hook — updates on orientation change, multi-window resize,
 * and foldable device unfold. Use this instead of Dimensions.get('window').
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < BREAKPOINTS.sm;
  const isPhone = width < BREAKPOINTS.lg;
  const isTablet = width >= BREAKPOINTS.lg;
  const isLargeTablet = width >= BREAKPOINTS.xl;

  // Number of columns for grid layouts
  const columns = width >= BREAKPOINTS.xxl ? 3 : width >= BREAKPOINTS.lg ? 2 : 1;

  // Horizontal content padding — more padding on larger screens
  const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : 16;

  // Max content width cap for tablet readability
  const contentMaxWidth = isLargeTablet ? 900 : isTablet ? 720 : undefined;

  // Specials card width — capped so it doesn't become poster-sized on tablets
  const specialsCardWidth = Math.min(width * 0.82, 360);

  // Hero height — taller on tablets
  const heroHeight = isLargeTablet ? 420 : isTablet ? 360 : 320;

  return {
    width,
    height,
    isSmallPhone,
    isPhone,
    isTablet,
    isLargeTablet,
    columns,
    horizontalPadding,
    contentMaxWidth,
    specialsCardWidth,
    heroHeight,
  };
}
