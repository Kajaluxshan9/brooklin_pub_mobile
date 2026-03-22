import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../../config/theme";

/**
 * InfoChip - Small info pill matching frontend style
 *
 * Features:
 * - Three color variants: gold, brown, muted
 * - Icon support (left or right position)
 * - Pressable variant with onPress callback
 * - Close button variant
 * - Selection state support
 * - Accessibility support
 *
 * @example
 * <InfoChip label="Vegetarian" variant="gold" />
 * <InfoChip
 *   label="Gluten Free"
 *   variant="brown"
 *   icon={<Icon name="leaf" />}
 *   onPress={() => filter('gluten-free')}
 * />
 */

export interface InfoChipProps {
  label: string;
  variant?: "gold" | "brown" | "muted";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  onPress?: () => void;
  onClose?: () => void;
  selected?: boolean;
}

export function InfoChip({
  label,
  variant = "gold",
  icon,
  iconPosition = "left",
  onPress,
  onClose,
  selected = false,
}: InfoChipProps) {
  const chipColors = {
    gold: {
      bg: colors.glass.gold,
      text: colors.secondary.dark,
      border: colors.border.gold,
      selectedBg: colors.secondary.main,
      selectedText: colors.primary.dark,
    },
    brown: {
      bg: "rgba(106,58,30,0.1)",
      text: colors.primary.main,
      border: "rgba(106,58,30,0.2)",
      selectedBg: colors.primary.main,
      selectedText: "#fff",
    },
    muted: {
      bg: "rgba(0,0,0,0.05)",
      text: colors.text.muted,
      border: "rgba(0,0,0,0.08)",
      selectedBg: colors.text.muted,
      selectedText: "#fff",
    },
  };

  const c = chipColors[variant];

  const chipContent = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? c.selectedBg : c.bg,
          borderColor: selected ? c.selectedBg : c.border,
        },
      ]}
    >
      {icon && iconPosition === "left" && (
        <View style={styles.iconLeft}>{icon}</View>
      )}

      <Text
        style={[
          styles.chipText,
          {
            color: selected ? c.selectedText : c.text,
          },
        ]}
      >
        {label}
      </Text>

      {icon && iconPosition === "right" && (
        <View style={styles.iconRight}>{icon}</View>
      )}

      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Remove chip"
        >
          <Ionicons
            name="close-circle"
            size={14}
            color={selected ? c.selectedText : c.text}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
      >
        {chipContent}
      </TouchableOpacity>
    );
  }

  return chipContent;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  chipText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    letterSpacing: 0.5,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
  closeButton: {
    marginLeft: spacing.xs,
  },
});
