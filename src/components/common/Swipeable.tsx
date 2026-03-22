import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { colors, typography, spacing, borderRadius } from "../../config/theme";
import { useHaptics } from "../../hooks/useHaptics";

/**
 * Swipeable - Swipeable list item with configurable actions
 *
 * Features:
 * - Left and right swipe actions
 * - Configurable action buttons
 * - Animated reveal with spring physics
 * - Threshold-based activation
 * - Haptic feedback on action trigger
 * - Auto-close after action
 * - Accessibility support
 *
 * @example
 * <Swipeable
 *   rightActions={[
 *     { label: "Share", icon: "share", onPress: handleShare, color: colors.secondary.main },
 *     { label: "Delete", icon: "trash", onPress: handleDelete, color: colors.error },
 *   ]}
 * >
 *   <View style={styles.listItem}>
 *     <Text>Swipeable Item</Text>
 *   </View>
 * </Swipeable>
 */

export interface SwipeAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
  backgroundColor?: string;
}

export interface SwipeableProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number; // Percentage (0-1) to trigger action
  autoClose?: boolean;
  disabled?: boolean;
}

export function Swipeable({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 0.5,
  autoClose = true,
  disabled = false,
}: SwipeableProps) {
  const { swipeAction: hapticSwipe } = useHaptics();

  // Animation values
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);
  const actionTriggered = useRef(false);

  const maxLeftSwipe = leftActions.length * 80;
  const maxRightSwipe = rightActions.length * 80;

  const handleActionPress = (action: SwipeAction) => {
    hapticSwipe();
    action.onPress();

    if (autoClose) {
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      isOpen.value = false;
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((event) => {
      // Allow swiping in both directions based on available actions
      const newX = event.translationX;

      if (newX < 0 && rightActions.length > 0) {
        // Swiping left (showing right actions)
        translateX.value = Math.max(newX, -maxRightSwipe);
      } else if (newX > 0 && leftActions.length > 0) {
        // Swiping right (showing left actions)
        translateX.value = Math.min(newX, maxLeftSwipe);
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const translation = event.translationX;

      // Determine if action should be triggered based on threshold
      if (translation < 0 && rightActions.length > 0) {
        const swipePercentage = Math.abs(translation) / maxRightSwipe;

        if (swipePercentage >= threshold || velocity < -500) {
          // Open to show actions
          translateX.value = withSpring(-maxRightSwipe, {
            damping: 20,
            stiffness: 300,
          });
          isOpen.value = true;
          runOnJS(hapticSwipe)();
        } else {
          // Close
          translateX.value = withSpring(0, {
            damping: 20,
            stiffness: 300,
          });
          isOpen.value = false;
        }
      } else if (translation > 0 && leftActions.length > 0) {
        const swipePercentage = translation / maxLeftSwipe;

        if (swipePercentage >= threshold || velocity > 500) {
          // Open to show actions
          translateX.value = withSpring(maxLeftSwipe, {
            damping: 20,
            stiffness: 300,
          });
          isOpen.value = true;
          runOnJS(hapticSwipe)();
        } else {
          // Close
          translateX.value = withSpring(0, {
            damping: 20,
            stiffness: 300,
          });
          isOpen.value = false;
        }
      } else {
        // No valid swipe, close
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
        isOpen.value = false;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <View style={[styles.actionsContainer, styles.leftActions]}>
          {leftActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.backgroundColor || action.color,
                  width: 80,
                },
              ]}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Ionicons name={action.icon} size={24} color="#fff" />
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <View style={[styles.actionsContainer, styles.rightActions]}>
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.backgroundColor || action.color,
                  width: 80,
                },
              ]}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Ionicons name={action.icon} size={24} color="#fff" />
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Swipeable Content */}
      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={[styles.content, animatedStyle]}>
          {children}
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  actionsContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    flexDirection: "row",
  },
  leftActions: {
    left: 0,
  },
  rightActions: {
    right: 0,
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: "#fff",
    marginTop: spacing.xs,
  },
  content: {
    backgroundColor: colors.background.paper,
  },
});
