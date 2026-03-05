import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing } from "../../config/theme";

const FLOATING_SHAPES = [
  { size: 100, round: true, top: "10%", left: "5%", rotation: 0 },
  { size: 150, round: false, top: "60%", left: "80%", rotation: 15 },
  { size: 80, round: true, top: "30%", left: "70%", rotation: 30 },
  { size: 120, round: false, top: "70%", left: "10%", rotation: 45 },
  { size: 90, round: true, top: "15%", left: "85%", rotation: 60 },
  { size: 140, round: false, top: "50%", left: "30%", rotation: 75 },
];

interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingScreen({
  fullScreen = false,
  message,
}: LoadingScreenProps) {
  // Rotating rings
  const ring0 = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  // Logo scale pulse
  const logoPulse = useRef(new Animated.Value(0)).current;

  // Center glow
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Center dot
  const dotPulse = useRef(new Animated.Value(0)).current;

  // Loading dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Decorative diamond
  const diamondRotate = useRef(new Animated.Value(0)).current;

  // Floating shapes
  const floatAnims = useRef(
    FLOATING_SHAPES.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    // Ring rotations (matching frontend: duration 3s, 3.5s, 4s)
    const startRing = (
      anim: Animated.Value,
      duration: number,
      reverse: boolean,
    ) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    };
    startRing(ring0, 3000, false);
    startRing(ring1, 3500, true);
    startRing(ring2, 4000, false);

    // Logo pulse (scale 1 → 1.05 → 1, 3s)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Center glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Center dot pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Loading dots
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 500,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };
    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);

    // Decorative diamond rotation (8s, matching frontend)
    Animated.loop(
      Animated.timing(diamondRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Floating shapes
    floatAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 8000 + i * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 6000 + i * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  }, []);

  // Interpolations
  const ring0Rotate = ring0.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const ring1Rotate = ring1.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });
  const ring2Rotate = ring2.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const logoScale = logoPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const dotScale = dotPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const diamondSpin = diamondRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      {/* Floating geometric shapes */}
      {FLOATING_SHAPES.map((shape, i) => (
        <Animated.View
          key={i}
          style={[
            styles.floatingShape,
            {
              width: shape.size,
              height: shape.size,
              borderRadius: shape.round ? shape.size / 2 : shape.size * 0.15,
              top: shape.top as any,
              left: shape.left as any,
              transform: [
                { rotate: `${shape.rotation}deg` },
                {
                  translateX: floatAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
                {
                  translateY: floatAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  }),
                },
              ],
              opacity: floatAnims[i].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.06, 0.1, 0.06],
              }),
            },
          ]}
        />
      ))}

      {/* Ambient glow orbs */}
      <Animated.View
        style={[
          styles.glowOrb1,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrb2,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.2],
            }),
            transform: [
              {
                scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.2, 1],
                }),
              },
            ],
          },
        ]}
      />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo Image */}
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Image
            source={require("../../../assets/brooklinpub-logo.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
        </Animated.View>

        {/* Brand name with decorative lines */}
        <View style={styles.brandRow}>
          <LinearGradient
            colors={["transparent", "rgba(217,167,86,0.5)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.brandLine}
          />
          <Text style={styles.brandName}>The Brooklin Pub</Text>
          <LinearGradient
            colors={["rgba(217,167,86,0.5)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.brandLine}
          />
        </View>

        {/* Rotating rings with center dot */}
        <View style={styles.ringsContainer}>
          {/* Pulsing center glow */}
          <Animated.View
            style={[
              styles.centerGlow,
              { opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />

          {/* Ring 0 - innermost (50px) */}
          <Animated.View
            style={[
              styles.ring,
              {
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 2,
                borderColor: "transparent",
                borderTopColor: colors.secondary.main,
                transform: [{ rotate: ring0Rotate }],
              },
            ]}
          />

          {/* Ring 1 - middle (70px) */}
          <Animated.View
            style={[
              styles.ring,
              {
                width: 70,
                height: 70,
                borderRadius: 35,
                borderWidth: 1.5,
                borderColor: "transparent",
                borderTopColor: colors.primary.main,
                borderRightColor: colors.secondary.main,
                opacity: 0.8,
                transform: [{ rotate: ring1Rotate }],
              },
            ]}
          />

          {/* Ring 2 - outermost (90px) */}
          <Animated.View
            style={[
              styles.ring,
              {
                width: 90,
                height: 90,
                borderRadius: 45,
                borderWidth: 1,
                borderColor: "transparent",
                borderTopColor: colors.secondary.light,
                opacity: 0.6,
                transform: [{ rotate: ring2Rotate }],
              },
            ]}
          />

          {/* Center dot */}
          <Animated.View
            style={[styles.centerDot, { transform: [{ scale: dotScale }] }]}
          />
        </View>

        {/* Loading text with animated dots */}
        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>{message || "Loading"}</Text>
          <View style={styles.dotsRow}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.loadingDot,
                  {
                    opacity: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                    transform: [
                      {
                        translateY: dot.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -3],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Decorative flourish */}
        <View style={styles.flourish}>
          <LinearGradient
            colors={["transparent", "rgba(217,167,86,0.35)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.flourishLine}
          />
          <Animated.View
            style={[
              styles.flourishDiamond,
              { transform: [{ rotate: diamondSpin }] },
            ]}
          />
          <LinearGradient
            colors={["rgba(217,167,86,0.35)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.flourishLine}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
    overflow: "hidden",
  },
  fullScreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },

  /* Floating shapes */
  floatingShape: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: colors.secondary.main,
  },

  /* Glow orbs */
  glowOrb1: {
    position: "absolute",
    top: "20%",
    left: "10%",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(217,167,86,0.08)",
  },
  glowOrb2: {
    position: "absolute",
    bottom: "15%",
    right: "15%",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(106,58,30,0.06)",
  },

  /* Main content */
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
    zIndex: 1,
  },

  /* Logo */
  logoImage: {
    width: 120,
    height: 120,
  },

  /* Brand */
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  brandLine: {
    width: 40,
    height: 1,
  },
  brandName: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.primary.main,
    letterSpacing: 2,
  },

  /* Rings */
  ringsContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    position: "absolute",
  },
  centerGlow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(217,167,86,0.15)",
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary.main,
  },

  /* Loading text + dots */
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  loadingText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 2,
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.secondary.main,
  },

  /* Decorative flourish */
  flourish: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  flourishLine: {
    width: 40,
    height: 1,
  },
  flourishDiamond: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: colors.secondary.main,
    opacity: 0.6,
  },
});
