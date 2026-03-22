import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing } from "../../config/theme";
import { useResponsive } from "../../utils/responsive";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Compact, mobile-first page header for inner screens.
 * 160px tall — clean, branded, content-first.
 * Replaces the 280px HeroSection on inner screens.
 */
export default function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isSmallPhone } = useResponsive();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const titleFontSize = isSmallPhone ? 32 : 40;

  return (
    <LinearGradient
      colors={[colors.primary.dark, "#2A1508", colors.primary.dark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Subtle texture overlay */}
      <View style={styles.noiseOverlay} />

      {/* Gold bottom accent */}
      <LinearGradient
        colors={["transparent", colors.secondary.main, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomAccent}
      />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Gold left bar */}
        <View style={styles.leftBar} />

        <View style={styles.textBlock}>
          {/* Icon + overline */}
          <View style={styles.overlineRow}>
            {icon && (
              <Ionicons
                name={icon}
                size={14}
                color={colors.secondary.main}
                style={{ marginRight: 6 }}
              />
            )}
            <Text style={styles.overline}>BROOKLIN PUB & GRILL</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleFontSize * 1.1 }]}>{title}</Text>

          {/* Subtitle */}
          {subtitle && (
            <Text style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Decorative diamond */}
        <View style={styles.diamond} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 160,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  bottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.75,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl + 4,
    paddingTop: spacing.lg,
    gap: spacing.base,
  },
  leftBar: {
    width: 3,
    height: 60,
    borderRadius: 2,
    backgroundColor: colors.secondary.main,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  overlineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  overline: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.secondary.main,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    // fontSize and lineHeight set dynamically via inline style
    color: colors.text.light,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(243,227,204,0.8)",
    lineHeight: 18,
    marginTop: 2,
  },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: colors.secondary.main,
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
    flexShrink: 0,
    alignSelf: "flex-end",
    marginBottom: 4,
  },
});
