import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { colors } from "../../config/theme";

/**
 * CornerAccents - Decorative L-shaped corner accents
 *
 * Features:
 * - Four corner L-shaped borders
 * - Customizable size and color
 * - Thickness variants (thin, base, thick)
 * - Individually configurable corners
 * - Animated entrance option
 * - Accessibility support
 *
 * @example
 * <View style={styles.container}>
 *   <CornerAccents size={20} color={colors.secondary.main} animated />
 *   <Text>Content with decorative corners</Text>
 * </View>
 */

export interface CornerAccentsProps {
  size?: number;
  color?: string;
  thickness?: "thin" | "base" | "thick";
  animated?: boolean;
  showTopLeft?: boolean;
  showTopRight?: boolean;
  showBottomLeft?: boolean;
  showBottomRight?: boolean;
  opacity?: number;
}

export function CornerAccents({
  size = 16,
  color = colors.secondary.main,
  thickness = "base",
  animated = false,
  showTopLeft = true,
  showTopRight = true,
  showBottomLeft = true,
  showBottomRight = true,
  opacity = 0.4,
}: CornerAccentsProps) {
  const scaleAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [animated]);

  const thicknessMap = {
    thin: 1,
    base: 2,
    thick: 3,
  };

  const borderWidth = thicknessMap[thickness];

  const accentStyle = {
    position: "absolute" as const,
    borderColor: color,
    opacity,
  };

  return (
    <>
      {/* Top Left */}
      {showTopLeft && (
        <Animated.View
          style={[
            accentStyle,
            styles.topLeft,
            {
              width: size,
              height: size,
              borderTopWidth: borderWidth,
              borderLeftWidth: borderWidth,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}

      {/* Top Right */}
      {showTopRight && (
        <Animated.View
          style={[
            accentStyle,
            styles.topRight,
            {
              width: size,
              height: size,
              borderTopWidth: borderWidth,
              borderRightWidth: borderWidth,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}

      {/* Bottom Left */}
      {showBottomLeft && (
        <Animated.View
          style={[
            accentStyle,
            styles.bottomLeft,
            {
              width: size,
              height: size,
              borderBottomWidth: borderWidth,
              borderLeftWidth: borderWidth,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}

      {/* Bottom Right */}
      {showBottomRight && (
        <Animated.View
          style={[
            accentStyle,
            styles.bottomRight,
            {
              width: size,
              height: size,
              borderBottomWidth: borderWidth,
              borderRightWidth: borderWidth,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
});
