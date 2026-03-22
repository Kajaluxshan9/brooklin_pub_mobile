import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius, spacing } from "../../config/theme";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height = 16, borderRadius: br = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius: br, backgroundColor: colors.cream, opacity }, style]}
    />
  );
}

export function MenuItemSkeleton() {
  return (
    <View style={skeletonStyles.menuCard}>
      <SkeletonBox height={160} borderRadius={12} style={{ marginBottom: spacing.base }} />
      <SkeletonBox height={20} width="70%" borderRadius={6} style={{ marginBottom: spacing.sm }} />
      <SkeletonBox height={14} width="90%" borderRadius={4} style={{ marginBottom: spacing.xs }} />
      <SkeletonBox height={14} width="60%" borderRadius={4} style={{ marginBottom: spacing.base }} />
      <SkeletonBox height={18} width="30%" borderRadius={4} />
    </View>
  );
}

export function EventCardSkeleton() {
  return (
    <View style={skeletonStyles.eventCard}>
      <SkeletonBox height={200} borderRadius={16} style={{ marginBottom: spacing.base }} />
      <SkeletonBox height={22} width="80%" borderRadius={6} style={{ marginBottom: spacing.sm }} />
      <SkeletonBox height={14} width="50%" borderRadius={4} style={{ marginBottom: spacing.sm }} />
      <SkeletonBox height={14} width="95%" borderRadius={4} style={{ marginBottom: spacing.xs }} />
      <SkeletonBox height={14} width="75%" borderRadius={4} />
    </View>
  );
}

export function SpecialCardSkeleton() {
  return (
    <View style={skeletonStyles.specialCard}>
      <SkeletonBox height={220} borderRadius={20} style={{ marginBottom: spacing.base }} />
      <SkeletonBox height={24} width="65%" borderRadius={6} style={{ marginBottom: spacing.sm }} />
      <SkeletonBox height={14} width="90%" borderRadius={4} style={{ marginBottom: spacing.xs }} />
      <SkeletonBox height={14} width="70%" borderRadius={4} />
    </View>
  );
}

export function TeamCardSkeleton() {
  return (
    <View style={skeletonStyles.teamCard}>
      <SkeletonBox height={100} width={100} borderRadius={50} style={{ alignSelf: "center", marginBottom: spacing.base }} />
      <SkeletonBox height={18} width="60%" borderRadius={6} style={{ alignSelf: "center", marginBottom: spacing.sm }} />
      <SkeletonBox height={13} width="40%" borderRadius={4} style={{ alignSelf: "center", marginBottom: spacing.sm }} />
      <SkeletonBox height={12} width="90%" borderRadius={4} style={{ alignSelf: "center" }} />
    </View>
  );
}

export function ImagePlaceholderSkeleton({ height = 200 }: { height?: number }) {
  return <SkeletonBox height={height} borderRadius={12} />;
}

const skeletonStyles = StyleSheet.create({
  menuCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  eventCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  specialCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius["2xl"],
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  teamCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});
