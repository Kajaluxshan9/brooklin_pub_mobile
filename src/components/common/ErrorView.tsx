import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../../config/theme";
import { useHaptics } from "../../hooks/useHaptics";

/**
 * ErrorView - Full-width error display with retry functionality
 *
 * Features:
 * - Animated entrance (fade + slide)
 * - Haptic feedback on retry
 * - Accessibility support with proper labels
 * - Customizable error message
 * - Optional retry callback
 *
 * @example
 * <ErrorView
 *   message="Failed to load menu items"
 *   onRetry={() => refetch()}
 * />
 */

export interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({
  message = "Something went wrong",
  onRetry,
}: ErrorViewProps) {
  const { error: hapticError } = useHaptics();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Entrance animation: fade in + slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRetry = () => {
    hapticError(); // Haptic feedback
    onRetry?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.iconContainer} accessibilityLabel="Error icon">
        <Ionicons name="alert-circle" size={28} color="#fff" />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        Oops!
      </Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          accessibilityHint="Tap to retry the operation"
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["3xl"],
    backgroundColor: colors.background.default,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.base,
    minWidth: 120,
    alignItems: "center",
  },
  retryText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: "#fff",
  },
});
