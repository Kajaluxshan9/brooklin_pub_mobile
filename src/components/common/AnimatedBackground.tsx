import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

/**
 * AnimatedBackground - Floating particles matching frontend
 *
 * Features:
 * - Floating particle system with random movement
 * - Two variants: dark and light
 * - Configurable particle count
 * - Intensity control
 * - Optimized animations using Animated API
 * - Non-interactive (pointer events disabled)
 *
 * NOTE: This version uses the legacy Animated API.
 * Future migration to Reanimated 3 planned for better performance.
 *
 * @example
 * <View style={styles.container}>
 *   <AnimatedBackground variant="dark" particleCount={12} />
 *   <Text>Content with animated background</Text>
 * </View>
 */

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  size: number;
  color: string;
  duration: number;
}

export interface AnimatedBackgroundProps {
  variant?: "dark" | "light";
  particleCount?: number;
  intensity?: "low" | "medium" | "high";
}

export function AnimatedBackground({
  variant = "dark",
  particleCount = 12,
  intensity = "medium",
}: AnimatedBackgroundProps) {
  const particlesRef = useRef<Particle[]>([]);

  // Adjust particle count based on intensity
  const intensityCountMap = {
    low: Math.floor(particleCount * 0.5),
    medium: particleCount,
    high: Math.floor(particleCount * 1.5),
  };

  const finalParticleCount = intensityCountMap[intensity];

  if (particlesRef.current.length === 0) {
    const particleColors =
      variant === "dark"
        ? [
            "rgba(217,167,86,0.12)",
            "rgba(217,167,86,0.08)",
            "rgba(176,128,48,0.10)",
            "rgba(255,253,251,0.06)",
          ]
        : [
            "rgba(217,167,86,0.10)",
            "rgba(106,58,30,0.06)",
            "rgba(176,128,48,0.08)",
            "rgba(74,44,23,0.04)",
          ];

    particlesRef.current = Array.from({ length: finalParticleCount }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_W),
      y: new Animated.Value(Math.random() * SCREEN_H),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3 + Math.random() * 0.7),
      size: 4 + Math.random() * 8,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      duration: 6000 + Math.random() * 8000,
    }));
  }

  useEffect(() => {
    const animations = particlesRef.current.map((p) => {
      const floatUp = () => {
        const startX = Math.random() * SCREEN_W;
        const startY = SCREEN_H + 20;
        p.x.setValue(startX);
        p.y.setValue(startY);
        p.opacity.setValue(0);

        Animated.sequence([
          // Fade in while floating up
          Animated.parallel([
            Animated.timing(p.y, {
              toValue: -30,
              duration: p.duration,
              useNativeDriver: true,
            }),
            Animated.timing(p.x, {
              toValue: startX + (Math.random() - 0.5) * 80,
              duration: p.duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.opacity, {
                toValue: 0.6 + Math.random() * 0.4,
                duration: p.duration * 0.2,
                useNativeDriver: true,
              }),
              Animated.timing(p.opacity, {
                toValue: 0.6 + Math.random() * 0.4,
                duration: p.duration * 0.6,
                useNativeDriver: true,
              }),
              Animated.timing(p.opacity, {
                toValue: 0,
                duration: p.duration * 0.2,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(() => floatUp());
      };

      // Stagger start
      const delay = Math.random() * 4000;
      const timeout = setTimeout(floatUp, delay);
      return timeout;
    });

    return () => animations.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <View
      style={styles.container}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {particlesRef.current.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
              opacity: p.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
  },
});
