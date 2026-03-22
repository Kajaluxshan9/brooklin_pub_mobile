import React from "react";
import { View, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { colors, borderRadius, shadows, spacing } from "../../config/theme";

/**
 * GlassCard - Glassmorphism card matching frontend style
 *
 * Features:
 * - Glassmorphic background with blur effect
 * - Customizable blur intensity (light, medium, strong)
 * - Shadow variants (sm, base, md, lg)
 * - Pressable variant with ripple effect
 * - Border gradient option
 * - Accessibility support
 *
 * @example
 * <GlassCard blurIntensity="medium" shadowVariant="md">
 *   <Text>Card content</Text>
 * </GlassCard>
 */

export interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: "light" | "medium" | "strong" | "none";
  shadowVariant?: "sm" | "base" | "md" | "lg";
  pressable?: boolean;
  onPress?: () => void;
  borderGradient?: boolean;
}

export function GlassCard({
  children,
  style,
  blurIntensity = "medium",
  shadowVariant = "base",
  pressable = false,
  onPress,
  borderGradient = false,
}: GlassCardProps) {
  const blurIntensityMap = {
    none: 0,
    light: 10,
    medium: 20,
    strong: 40,
  };

  const shadowStyleMap = {
    sm: shadows.sm,
    base: shadows.base,
    md: shadows.md,
    lg: shadows.lg,
  };

  const cardContent = (
    <View
      style={[
        styles.card,
        shadowStyleMap[shadowVariant],
        borderGradient && styles.borderGradient,
        style,
      ]}
    >
      {blurIntensity !== "none" ? (
        <BlurView
          intensity={blurIntensityMap[blurIntensity]}
          tint="light"
          style={styles.blurContainer}
        >
          <View style={styles.contentWrap}>{children}</View>
        </BlurView>
      ) : (
        <View style={styles.contentWrap}>{children}</View>
      )}
    </View>
  );

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.gold,
    overflow: "hidden",
  },
  borderGradient: {
    borderWidth: 2,
    borderColor: colors.border.goldStrong,
  },
  blurContainer: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  contentWrap: {
    padding: spacing.base,
  },
});
