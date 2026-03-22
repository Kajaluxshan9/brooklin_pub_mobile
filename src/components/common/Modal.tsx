import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../config/theme";
import { useHaptics } from "../../hooks/useHaptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Modal - Full-featured modal component with animations and gestures
 *
 * Features:
 * - Three variants: fullscreen, centered, bottom
 * - Animated entrance/exit with Reanimated 3
 * - Backdrop blur effect
 * - Swipe-to-dismiss gesture (bottom variant)
 * - Keyboard avoiding behavior
 * - Haptic feedback
 * - Accessibility support
 * - Safe area aware
 *
 * @example
 * <Modal
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   variant="bottom"
 *   enableGesture
 * >
 *   <Text>Modal content</Text>
 * </Modal>
 */

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: "fullscreen" | "centered" | "bottom";
  showCloseButton?: boolean;
  backdropOpacity?: number;
  dismissible?: boolean;
  enableGesture?: boolean;
  animationType?: "slide" | "fade" | "scale";
  title?: string;
}

export function Modal({
  visible,
  onClose,
  children,
  variant = "centered",
  showCloseButton = true,
  backdropOpacity = 0.5,
  dismissible = true,
  enableGesture = true,
  animationType = "slide",
  title,
}: ModalProps) {
  const insets = useSafeAreaInsets();
  const { modalOpen: hapticOpen, modalClose: hapticClose } = useHaptics();

  // Animation values
  const translateY = useSharedValue(variant === "bottom" ? SCREEN_HEIGHT : 0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  // Gesture state
  const gestureTranslateY = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  useEffect(() => {
    if (visible) {
      hapticOpen();

      // Entrance animation
      opacity.value = withTiming(1, { duration: 200 });

      if (animationType === "slide" && variant === "bottom") {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      } else if (animationType === "scale") {
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 200,
        });
      } else if (animationType === "fade") {
        translateY.value = 0;
        scale.value = 1;
      }
    } else {
      // Exit animation
      opacity.value = withTiming(0, { duration: 150 });

      if (animationType === "slide" && variant === "bottom") {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          damping: 20,
          stiffness: 300,
        });
      } else if (animationType === "scale") {
        scale.value = withTiming(0.9, { duration: 150 });
      }
    }
  }, [visible, variant, animationType]);

  const handleClose = () => {
    if (dismissible) {
      hapticClose();
      onClose();
    }
  };

  // Swipe down gesture (bottom variant only)
  const panGesture = Gesture.Pan()
    .enabled(enableGesture && variant === "bottom")
    .onStart(() => {
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      // Only allow downward swipes
      if (event.translationY > 0) {
        gestureTranslateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      isGestureActive.value = false;

      // Dismiss if swiped down more than 100px or velocity is high
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          damping: 20,
          stiffness: 300,
        });
        runOnJS(handleClose)();
      } else {
        // Snap back
        gestureTranslateY.value = withSpring(0);
      }
    });

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * backdropOpacity,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => {
    let transform = [];

    if (variant === "bottom") {
      transform.push({
        translateY: translateY.value + gestureTranslateY.value,
      });
    }

    if (animationType === "scale") {
      transform.push({ scale: scale.value });
    }

    return {
      opacity: opacity.value,
      transform,
    };
  });

  if (!visible) {
    return null;
  }

  return (
    <RNModal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleClose}
        disabled={!dismissible}
      >
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Modal Content */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.container,
              variant === "fullscreen" && styles.fullscreenContainer,
              variant === "centered" && styles.centeredContainer,
              variant === "bottom" && [
                styles.bottomContainer,
                { paddingBottom: Math.max(insets.bottom, spacing.base) },
              ],
              containerAnimatedStyle,
            ]}
            accessibilityViewIsModal={true}
            accessible={true}
            aria-modal="true"
          >
            {/* Drag handle (bottom variant only) */}
            {variant === "bottom" && enableGesture && (
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                {title && (
                  <Text style={styles.title} accessibilityRole="header">
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    accessibilityHint="Close the modal"
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.text.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.background.paper,
    ...shadows.lg,
  },
  fullscreenContainer: {
    flex: 1,
  },
  centeredContainer: {
    marginHorizontal: spacing.base,
    marginVertical: "auto",
    borderRadius: borderRadius.lg,
    maxHeight: "90%",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: "95%",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.text.muted,
    borderRadius: borderRadius.full,
    opacity: 0.3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  content: {
    padding: spacing.base,
  },
});
