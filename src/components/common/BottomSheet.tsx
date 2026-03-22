import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
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
 * BottomSheet - Gesture-driven bottom sheet with snap points
 *
 * Features:
 * - Snap points (percentages of screen height)
 * - Gesture-driven drag with spring physics
 * - Dynamic height calculation
 * - Backdrop with blur
 * - Handle indicator
 * - Scrollable content
 * - Haptic feedback on snap
 * - Keyboard aware
 * - Accessibility support
 *
 * @example
 * <BottomSheet
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   snapPoints={[0.5, 0.9]}
 *   title="Filter Options"
 * >
 *   <Text>Bottom sheet content</Text>
 * </BottomSheet>
 */

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // Percentages of screen height (0.5 = 50%)
  initialSnapPoint?: number; // Index of snap point to start at
  title?: string;
  showHandle?: boolean;
  dismissible?: boolean;
  backdropOpacity?: number;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  snapPoints = [0.5, 0.9],
  initialSnapPoint = 0,
  title,
  showHandle = true,
  dismissible = true,
  backdropOpacity = 0.5,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { snapPoint: hapticSnap, modalOpen, modalClose } = useHaptics();

  // Convert snap points to pixel values
  const snapPointsPixels = snapPoints.map(
    (point) => SCREEN_HEIGHT * (1 - point),
  );

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacityAnim = useSharedValue(0);
  const currentSnapIndex = useSharedValue(initialSnapPoint);

  // Gesture state
  const gestureTranslateY = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  useEffect(() => {
    if (visible) {
      modalOpen();
      // Animate to the initial snap point
      translateY.value = withSpring(snapPointsPixels[initialSnapPoint], {
        damping: 20,
        stiffness: 300,
      });
      backdropOpacityAnim.value = withTiming(1, { duration: 200 });
    } else {
      // Animate out
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 20,
        stiffness: 300,
      });
      backdropOpacityAnim.value = withTiming(0, { duration: 150 });
    }
  }, [visible, initialSnapPoint]);

  const handleClose = useCallback(() => {
    if (dismissible) {
      modalClose();
      onClose();
    }
  }, [dismissible, onClose, modalClose]);

  const snapToPoint = useCallback(
    (index: number) => {
      "worklet";
      if (index >= 0 && index < snapPointsPixels.length) {
        translateY.value = withSpring(snapPointsPixels[index], {
          damping: 20,
          stiffness: 300,
        });
        currentSnapIndex.value = index;
        runOnJS(hapticSnap)();
      }
    },
    [snapPointsPixels, hapticSnap],
  );

  const snapToClosest = useCallback(
    (currentY: number, velocityY: number) => {
      "worklet";
      // Find closest snap point considering velocity
      let closestIndex = 0;
      let closestDistance = Math.abs(currentY - snapPointsPixels[0]);

      for (let i = 1; i < snapPointsPixels.length; i++) {
        const distance = Math.abs(currentY - snapPointsPixels[i]);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      // If swiping down quickly, dismiss or go to higher snap point
      if (velocityY > 500 && closestIndex < snapPointsPixels.length - 1) {
        closestIndex++;
      }

      // If below last snap point with velocity, dismiss
      if (
        currentY > snapPointsPixels[snapPointsPixels.length - 1] + 50 ||
        velocityY > 1000
      ) {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          damping: 20,
          stiffness: 300,
        });
        runOnJS(handleClose)();
      } else {
        snapToPoint(closestIndex);
      }
    },
    [snapPointsPixels, snapToPoint, handleClose],
  );

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      // Allow both up and down dragging
      const newY = translateY.value + event.translationY;
      // Constrain to top snap point and allow some over-drag
      if (newY >= snapPointsPixels[0] - 50) {
        gestureTranslateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      isGestureActive.value = false;
      const currentY = translateY.value + gestureTranslateY.value;

      snapToClosest(currentY, event.velocityY);

      gestureTranslateY.value = 0;
    });

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacityAnim.value * backdropOpacity,
  }));

  const sheetStyle = useAnimatedStyle(() => {
    const y = translateY.value + gestureTranslateY.value;
    return {
      transform: [{ translateY: y }],
    };
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal
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

      {/* Bottom Sheet */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, spacing.base),
              },
              sheetStyle,
            ]}
            accessibilityModal={true}
            accessibilityViewIsModal={true}
            accessible={true}
            aria-modal="true"
          >
            {/* Handle */}
            {showHandle && (
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            )}

            {/* Title */}
            {title && (
              <View style={styles.titleContainer}>
                <Text style={styles.title} accessibilityRole="header">
                  {title}
                </Text>
              </View>
            )}

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadows.lg,
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
  titleContainer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.base,
  },
});
