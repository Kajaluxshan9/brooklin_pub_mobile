import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ImageSourcePropType,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing } from "../../config/theme";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  overlineText?: string;
  description?: string;
  backgroundImage?: string | ImageSourcePropType;
  variant?: "dark" | "light";
  height?: number;
  children?: React.ReactNode;
}

/** Animated floating geometric shape */
const FloatingShape = ({
  size,
  isCircle,
  top,
  left,
  delay,
  opacity: baseOpacity,
}: {
  size: number;
  isCircle: boolean;
  top: string;
  left: string;
  delay: number;
  opacity: number;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000 + Math.random() * 3000,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 4000 + Math.random() * 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000 + Math.random() * 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.geometricShape,
        {
          width: size,
          height: size,
          borderRadius: isCircle ? size / 2 : 0,
          borderColor: "#D9A756",
          top: top as any,
          left: left as any,
          opacity: baseOpacity,
          transform: [{ translateY }, { scale }, { rotate }],
        },
      ]}
    />
  );
};

/** Gold accent line with dots at each end */
const GoldAccentLine = ({ width = 80 }: { width?: number }) => (
  <View style={[styles.goldAccentLine, { width }]}>
    <View style={[styles.goldAccentDot, { left: -3 }]} />
    <LinearGradient
      colors={["transparent", "#D9A756", "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.goldAccentGradient}
    />
    <View style={[styles.goldAccentDot, { right: -3 }]} />
  </View>
);

export default function HeroSection({
  title,
  subtitle,
  overlineText,
  description,
  backgroundImage,
  variant = "dark",
  height = 320,
  children,
}: HeroSectionProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isDark = variant === "dark";

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const content = (
    <LinearGradient
      colors={
        isDark
          ? ["rgba(60,31,14,0.85)", "rgba(60,31,14,0.6)", "rgba(26,13,10,0.9)"]
          : [
              "rgba(253,248,243,0.92)",
              "rgba(245,235,224,0.88)",
              "rgba(253,248,243,0.92)",
            ]
      }
      style={[styles.gradient, { height }]}
    >
      {/* Animated geometric elements (light variant) */}
      {!isDark && (
        <View style={styles.geometricContainer} pointerEvents="none">
          {[
            {
              size: 45,
              isCircle: true,
              top: "15%",
              left: "8%",
              delay: 0,
              opacity: 0.12,
            },
            {
              size: 60,
              isCircle: false,
              top: "25%",
              left: "85%",
              delay: 200,
              opacity: 0.08,
            },
            {
              size: 35,
              isCircle: true,
              top: "60%",
              left: "75%",
              delay: 400,
              opacity: 0.15,
            },
            {
              size: 50,
              isCircle: false,
              top: "70%",
              left: "10%",
              delay: 600,
              opacity: 0.1,
            },
            {
              size: 40,
              isCircle: true,
              top: "40%",
              left: "50%",
              delay: 800,
              opacity: 0.06,
            },
            {
              size: 55,
              isCircle: false,
              top: "10%",
              left: "65%",
              delay: 1000,
              opacity: 0.08,
            },
          ].map((shape, i) => (
            <FloatingShape key={i} {...shape} />
          ))}
        </View>
      )}

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Gold accent line at top */}
        <GoldAccentLine width={80} />

        {/* Overline text */}
        {overlineText && (
          <Text
            style={[
              styles.overlineText,
              {
                color: isDark ? colors.secondary.main : "#D9A756",
              },
            ]}
          >
            {overlineText}
          </Text>
        )}

        {/* Subtitle / Sub-overline */}
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: isDark ? colors.secondary.main : colors.primary.main,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}

        {/* Title */}
        <Text
          style={[
            styles.title,
            {
              color: isDark ? colors.text.light : "#4A2C17",
              textShadowColor: isDark
                ? "rgba(0,0,0,0.4)"
                : "rgba(106,58,30,0.12)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: isDark ? 12 : 40,
            },
          ]}
        >
          {title}
        </Text>

        {/* Description */}
        {description && (
          <Text
            style={[
              styles.description,
              {
                color: isDark ? colors.text.lightMuted : "#6A3A1E",
                maxWidth: screenWidth * 0.85,
              },
            ]}
          >
            {description}
          </Text>
        )}

        {/* Bottom decorative line */}
        <LinearGradient
          colors={[
            "transparent",
            isDark ? "rgba(217,167,86,0.5)" : "rgba(217,167,86,0.4)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomDivider}
        />

        {/* Location tag */}
        <Text
          style={[
            styles.locationTag,
            {
              color: isDark ? "rgba(217,167,86,0.6)" : "rgba(106,58,30,0.5)",
            },
          ]}
        >
          BROOKLIN, ONTARIO
        </Text>
      </Animated.View>

      {children}
    </LinearGradient>
  );

  if (backgroundImage) {
    const imageSource =
      typeof backgroundImage === "string"
        ? { uri: backgroundImage }
        : backgroundImage;
    return (
      <ImageBackground
        source={imageSource}
        style={[styles.container, { height }]}
        resizeMode="cover"
      >
        {content}
      </ImageBackground>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: isDark
            ? colors.primary.dark
            : colors.background.default,
        },
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
  },
  geometricContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  geometricShape: {
    position: "absolute",
    borderWidth: 2,
  },
  contentWrapper: {
    alignItems: "center",
    gap: spacing.xs,
  },
  goldAccentLine: {
    height: 3,
    position: "relative",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  goldAccentGradient: {
    height: 3,
    width: "100%",
    borderRadius: 2,
  },
  goldAccentDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9A756",
    top: -2.5,
    zIndex: 1,
  },
  overlineText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.fontFamily.headingSemibold,
    fontSize: typography.fontSize.sm,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["4xl"],
    textAlign: "center",
    marginVertical: spacing.sm,
    lineHeight: typography.fontSize["4xl"] * 1.15,
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.6,
    marginTop: spacing.sm,
  },
  bottomDivider: {
    width: 120,
    height: 1,
    marginTop: spacing.md,
  },
  locationTag: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: spacing.md,
  },
});
