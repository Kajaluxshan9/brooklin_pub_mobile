import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colors, spacing } from "../../config/theme";

/**
 * GoldDivider - Horizontal or vertical gold divider line
 *
 * Features:
 * - Horizontal and vertical orientations
 * - Customizable width/height
 * - Customizable margin
 * - Gradient variant (solid or gradient)
 * - Animated appearance option
 * - Accessibility support
 *
 * @example
 * <GoldDivider width="60%" marginVertical={16} />
 * <GoldDivider orientation="vertical" height={40} />
 */

export interface GoldDividerProps {
  width?: number | string;
  height?: number | string;
  marginVertical?: number;
  marginHorizontal?: number;
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "gradient";
  animated?: boolean;
  opacity?: number;
}

export function GoldDivider({
  width = "60%",
  height = 1,
  marginVertical = spacing.base,
  marginHorizontal = 0,
  orientation = "horizontal",
  variant = "solid",
  animated = false,
  opacity = 0.3,
}: GoldDividerProps) {
  const scaleAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [animated]);

  const isHorizontal = orientation === "horizontal";

  return (
    <View
      style={[
        styles.container,
        {
          marginVertical: isHorizontal ? marginVertical : 0,
          marginHorizontal: !isHorizontal ? marginHorizontal : 0,
        },
      ]}
      accessible={false}
      importantForAccessibility="no"
    >
      <Animated.View
        style={[
          styles.line,
          {
            width: isHorizontal ? (width as any) : (height as any),
            height: isHorizontal ? (height as any) : (width as any),
            opacity,
            transform: isHorizontal
              ? [{ scaleX: scaleAnim }]
              : [{ scaleY: scaleAnim }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    backgroundColor: colors.secondary.main,
  },
});
