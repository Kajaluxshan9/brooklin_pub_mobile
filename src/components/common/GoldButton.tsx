import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../config/theme";
import { useHaptics } from "../../hooks/useHaptics";

/**
 * GoldButton - Filled or outlined button with gold accent
 *
 * Features:
 * - Two variants: filled (gold background) and outline (gold border)
 * - Ghost variant (transparent with minimal styling)
 * - Haptic feedback on press
 * - Scale-down press animation
 * - Loading state with spinner
 * - Icon support with configurable position
 * - Disabled state
 * - Small size variant
 * - Accessibility support
 *
 * @example
 * <GoldButton
 *   title="View Menu"
 *   onPress={() => navigate('Menu')}
 *   variant="filled"
 *   icon={<Icon name="menu" />}
 * />
 */

export interface GoldButtonProps {
  title: string;
  onPress: () => void;
  variant?: "filled" | "outline" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export function GoldButton({
  title,
  onPress,
  variant = "filled",
  disabled = false,
  loading = false,
  small = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
}: GoldButtonProps) {
  const { light: hapticLight } = useHaptics();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isFilled = variant === "filled";
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handlePress = () => {
    hapticLight();
    onPress();
  };

  return (
    <Animated.View
      style={[
        fullWidth && { width: "100%" },
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.base,
          isFilled && styles.filled,
          isOutline && styles.outline,
          isGhost && styles.ghost,
          small && styles.small,
          disabled && styles.disabled,
          fullWidth && { width: "100%" },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        accessibilityLabel={title}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isFilled ? "#fff" : colors.secondary.main}
          />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === "left" && (
              <View style={[styles.iconWrap, styles.iconLeft]}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                isFilled && styles.filledText,
                isOutline && styles.outlineText,
                isGhost && styles.ghostText,
                small && styles.smallText,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === "right" && (
              <View style={[styles.iconWrap, styles.iconRight]}>{icon}</View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    minHeight: 44,
    ...shadows.sm,
  },
  filled: {
    backgroundColor: colors.secondary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.secondary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md - 1,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    shadowOpacity: 0,
    elevation: 0,
    minHeight: 44,
  },
  small: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  text: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    letterSpacing: 0.5,
  },
  filledText: {
    color: colors.primary.dark,
  },
  outlineText: {
    color: colors.secondary.main,
  },
  ghostText: {
    color: colors.text.primary,
  },
  smallText: {
    fontSize: typography.fontSize.sm,
  },
});
