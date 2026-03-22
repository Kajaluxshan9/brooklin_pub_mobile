import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors, typography, spacing } from "../../config/theme";

/**
 * SectionHeader - Decorative section title with gold dividers
 *
 * Features:
 * - Gold divider lines with diamond accent
 * - Optional overline text
 * - Optional subtitle
 * - Three variants: default, compact, minimal
 * - Entrance animation (fade + slide)
 * - Light/dark theme support
 * - Accessibility support
 *
 * @example
 * <SectionHeader
 *   title="Our Menu"
 *   subtitle="Crafted with love and tradition"
 *   overline="◆ What's Cooking ◆"
 *   variant="default"
 * />
 */

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  overline?: string;
  light?: boolean;
  variant?: "default" | "compact" | "minimal";
  showDividers?: boolean;
  animated?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  overline,
  light = false,
  variant = "default",
  showDividers = true,
  animated = false,
}: SectionHeaderProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 10 : 0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 7,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated]);

  const isCompact = variant === "compact";
  const isMinimal = variant === "minimal";

  return (
    <Animated.View
      style={[
        styles.container,
        isCompact && styles.compactContainer,
        isMinimal && styles.minimalContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="header"
    >
      {/* Overline text */}
      {overline && !isMinimal && (
        <Text
          style={[
            styles.overline,
            light && { color: colors.secondary.light },
            isCompact && styles.compactOverline,
          ]}
        >
          {overline}
        </Text>
      )}

      {/* Top gold divider */}
      {showDividers && !isMinimal && (
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerDiamond}>◆</Text>
          <View style={styles.dividerLine} />
        </View>
      )}

      {/* Main title */}
      <Text
        style={[
          styles.title,
          light && { color: colors.text.light },
          isCompact && styles.compactTitle,
          isMinimal && styles.minimalTitle,
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            light && { color: "rgba(245,239,230,0.7)" },
            isCompact && styles.compactSubtitle,
          ]}
        >
          {subtitle}
        </Text>
      )}

      {/* Bottom gold divider */}
      {showDividers && !isMinimal && (
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerDiamond}>◆</Text>
          <View style={styles.dividerLine} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  compactContainer: {
    paddingVertical: spacing.md,
  },
  minimalContainer: {
    paddingVertical: spacing.sm,
  },
  overline: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: colors.secondary.main,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  compactOverline: {
    fontSize: typography.fontSize.xs - 1,
    letterSpacing: 2,
    marginBottom: spacing.xs - 2,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.secondary.main,
    opacity: 0.4,
  },
  dividerDiamond: {
    fontSize: 6,
    color: colors.secondary.main,
    marginHorizontal: spacing.sm,
    opacity: 0.6,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    textAlign: "center",
    marginVertical: spacing.xs,
  },
  compactTitle: {
    fontSize: typography.fontSize["2xl"],
    marginVertical: spacing.xs - 2,
  },
  minimalTitle: {
    fontSize: typography.fontSize.xl,
    marginVertical: 0,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.base,
  },
  compactSubtitle: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    marginTop: spacing.xs - 2,
  },
});
