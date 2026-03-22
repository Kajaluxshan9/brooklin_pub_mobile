/**
 * @deprecated This file is deprecated and will be removed in a future version.
 *
 * All components have been split into individual files for better maintainability.
 * Please use the new barrel export instead:
 *
 * OLD: import { GoldButton, SectionHeader } from './SharedComponents';
 * NEW: import { GoldButton, SectionHeader } from '@/components/common';
 *
 * Individual imports are also available:
 * import { GoldButton } from '@/components/common/GoldButton';
 * import { SectionHeader } from '@/components/common/SectionHeader';
 *
 * Migration guide:
 * 1. Replace all imports from './SharedComponents' with '../common' or '@/components/common'
 * 2. Test that all components still work as expected
 * 3. This file provides backward compatibility but will be removed after Sprint 1
 */

// ============================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================

export { ErrorView } from "./ErrorView";
export type { ErrorViewProps } from "./ErrorView";

export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

export { GoldButton } from "./GoldButton";
export type { GoldButtonProps } from "./GoldButton";

export { GoldDivider } from "./GoldDivider";
export type { GoldDividerProps } from "./GoldDivider";

export { GlassCard } from "./GlassCard";
export type { GlassCardProps } from "./GlassCard";

export { CornerAccents } from "./CornerAccents";
export type { CornerAccentsProps } from "./CornerAccents";

export { InfoChip } from "./InfoChip";
export type { InfoChipProps} from "./InfoChip";

export { AnimatedBackground } from "./AnimatedBackground";
export type { AnimatedBackgroundProps } from "./AnimatedBackground";

// Default export for backward compatibility
export { ErrorView as default } from "./ErrorView";

/* ============================================================
   DEPRECATED CODE BELOW - Kept for reference only
   All functionality has been moved to individual component files
   ============================================================ */

/*
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../config/theme";

/* ============================================================
   ErrorView — Full-width error display with retry
   ============================================================ *//*
interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({
  message = "Something went wrong",
  onRetry,
}: ErrorViewProps) {
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.icon}>!</Text>
      <Text style={errorStyles.title}>Oops!</Text>
      <Text style={errorStyles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={errorStyles.retryButton} onPress={onRetry}>
          <Text style={errorStyles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["3xl"],
    backgroundColor: colors.background.default,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.error,
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 48,
    marginBottom: spacing.base,
    overflow: "hidden",
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
  },
  retryText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: "#fff",
  },
});

/* ============================================================
   SectionHeader — Decorative section title with gold dividers
   ============================================================ */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  overline?: string;
  light?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  overline,
  light = false,
}: SectionHeaderProps) {
  return (
    <View style={sectionStyles.container}>
      {/* Overline text (e.g., "◆ What's Happening ◆") */}
      {overline && (
        <Text
          style={[
            sectionStyles.overline,
            light && { color: colors.secondary.light },
          ]}
        >
          {overline}
        </Text>
      )}

      {/* Gold divider */}
      <View style={sectionStyles.divider}>
        <View style={sectionStyles.dividerLine} />
        <Text style={sectionStyles.dividerDiamond}>◆</Text>
        <View style={sectionStyles.dividerLine} />
      </View>

      <Text
        style={[sectionStyles.title, light && { color: colors.text.light }]}
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          style={[
            sectionStyles.subtitle,
            light && { color: "rgba(245,239,230,0.7)" },
          ]}
        >
          {subtitle}
        </Text>
      )}

      {/* Gold divider */}
      <View style={sectionStyles.divider}>
        <View style={sectionStyles.dividerLine} />
        <Text style={sectionStyles.dividerDiamond}>◆</Text>
        <View style={sectionStyles.dividerLine} />
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  overline: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: colors.secondary.main,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.secondary.main,
    opacity: 0.4,
  },
  dividerDiamond: {
    fontSize: 6,
    color: colors.secondary.main,
    marginHorizontal: spacing.sm,
    opacity: 0.6,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.base,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    textAlign: "center",
    marginVertical: spacing.xs,
  },
});

/* ============================================================
   GoldButton — Filled or outlined button with gold accent
   ============================================================ */
interface GoldButtonProps {
  title: string;
  onPress: () => void;
  variant?: "filled" | "outline";
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  icon?: React.ReactNode;
}

export function GoldButton({
  title,
  onPress,
  variant = "filled",
  disabled = false,
  loading = false,
  small = false,
  icon,
}: GoldButtonProps) {
  const isFilled = variant === "filled";

  return (
    <TouchableOpacity
      style={[
        buttonStyles.base,
        isFilled ? buttonStyles.filled : buttonStyles.outline,
        small && buttonStyles.small,
        disabled && buttonStyles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFilled ? "#fff" : colors.secondary.main}
        />
      ) : (
        <View style={buttonStyles.content}>
          {icon && <View style={buttonStyles.iconWrap}>{icon}</View>}
          <Text
            style={[
              buttonStyles.text,
              isFilled ? buttonStyles.filledText : buttonStyles.outlineText,
              small && buttonStyles.smallText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const buttonStyles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.base,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    ...shadows.sm,
  },
  filled: {
    backgroundColor: colors.secondary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.secondary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md - 1,
  },
  small: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    marginRight: spacing.sm,
  },
  text: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    letterSpacing: 0.5,
  },
  filledText: {
    color: colors.primary.dark,
  },
  outlineText: {
    color: colors.secondary.main,
  },
  smallText: {
    fontSize: typography.fontSize.sm,
  },
});

/* ============================================================
   GoldDivider — Horizontal gold divider line
   ============================================================ */
interface GoldDividerProps {
  width?: number | string;
  marginVertical?: number;
}

export function GoldDivider({
  width = "60%",
  marginVertical = spacing.base,
}: GoldDividerProps) {
  return (
    <View style={[dividerStyles.container, { marginVertical }]}>
      <View style={[dividerStyles.line, { width: width as any }]} />
    </View>
  );
}

const dividerStyles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  line: {
    height: 1,
    backgroundColor: colors.secondary.main,
    opacity: 0.3,
  },
});

/* ============================================================
   GlassCard — Glassmorphism card matching frontend style
   ============================================================ */
interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
}

export function GlassCard({ children, style }: GlassCardProps) {
  return <View style={[glassStyles.card, style]}>{children}</View>;
}

const glassStyles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.gold,
    padding: spacing.base,
    ...shadows.card,
  },
});

/* ============================================================
   CornerAccents — Decorative L-shaped corner accents
   ============================================================ */
export function CornerAccents({
  size = 16,
  color = colors.secondary.main,
}: {
  size?: number;
  color?: string;
}) {
  const accentStyle = {
    position: "absolute" as const,
    borderColor: color,
    opacity: 0.4,
  };

  return (
    <>
      <View
        style={[
          accentStyle,
          {
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderTopWidth: 2,
            borderLeftWidth: 2,
          },
        ]}
      />
      <View
        style={[
          accentStyle,
          {
            top: 0,
            right: 0,
            width: size,
            height: size,
            borderTopWidth: 2,
            borderRightWidth: 2,
          },
        ]}
      />
      <View
        style={[
          accentStyle,
          {
            bottom: 0,
            left: 0,
            width: size,
            height: size,
            borderBottomWidth: 2,
            borderLeftWidth: 2,
          },
        ]}
      />
      <View
        style={[
          accentStyle,
          {
            bottom: 0,
            right: 0,
            width: size,
            height: size,
            borderBottomWidth: 2,
            borderRightWidth: 2,
          },
        ]}
      />
    </>
  );
}

/* ============================================================
   InfoChip — Small info pill matching frontend style
   ============================================================ */
interface InfoChipProps {
  label: string;
  variant?: "gold" | "brown" | "muted";
}

export function InfoChip({ label, variant = "gold" }: InfoChipProps) {
  const chipColors = {
    gold: {
      bg: colors.glass.gold,
      text: colors.secondary.dark,
      border: colors.border.gold,
    },
    brown: {
      bg: "rgba(106,58,30,0.1)",
      text: colors.primary.main,
      border: "rgba(106,58,30,0.2)",
    },
    muted: {
      bg: "rgba(0,0,0,0.05)",
      text: colors.text.muted,
      border: "rgba(0,0,0,0.08)",
    },
  };

  const c = chipColors[variant];

  return (
    <View
      style={[
        chipStyles.chip,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
        },
      ]}
    >
      <Text style={[chipStyles.chipText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    letterSpacing: 0.5,
  },
});

/* ============================================================
   AnimatedBackground — Floating particles matching frontend
   ============================================================ */
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

interface AnimatedBackgroundProps {
  variant?: "dark" | "light";
  particleCount?: number;
}

export function AnimatedBackground({
  variant = "dark",
  particleCount = 12,
}: AnimatedBackgroundProps) {
  const particlesRef = useRef<Particle[]>([]);

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

    particlesRef.current = Array.from({ length: particleCount }, () => ({
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
    <View style={animBgStyles.container} pointerEvents="none">
      {particlesRef.current.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            animBgStyles.particle,
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

const animBgStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
  },
});

// Default export
export default ErrorView;
