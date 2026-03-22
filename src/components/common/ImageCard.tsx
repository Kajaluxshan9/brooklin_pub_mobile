import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, borderRadius, shadows } from "../../config/theme";
import { CornerAccents, InfoChip } from "./SharedComponents";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ImageCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  chips?: string[];
  footer?: React.ReactNode;
  onPress?: () => void;
  aspectRatio?: number;
  variant?: "default" | "compact" | "wide";
}

export default function ImageCard({
  imageUrl,
  title,
  subtitle,
  description,
  badge,
  badgeColor = colors.secondary.main,
  chips,
  footer,
  onPress,
  aspectRatio = 0.65,
  variant = "default",
}: ImageCardProps) {
  const isCompact = variant === "compact";
  const isWide = variant === "wide";

  const cardWidth = isWide
    ? SCREEN_WIDTH - spacing.xl * 2
    : isCompact
    ? SCREEN_WIDTH * 0.42
    : SCREEN_WIDTH * 0.75;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[
        styles.card,
        {
          width: cardWidth,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image container */}
      <View
        style={[
          styles.imageContainer,
          {
            height: cardWidth * aspectRatio,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>BP</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)"]}
          style={styles.imageOverlay}
        />

        {/* Badge */}
        {badge && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        {/* Corner accents */}
        <CornerAccents size={12} color={colors.secondary.main} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        <Text
          style={[styles.title, isCompact && styles.titleCompact]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {description && !isCompact && (
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>
        )}

        {/* Chips */}
        {chips && chips.length > 0 && (
          <View style={styles.chipsRow}>
            {chips.map((chip, i) => (
              <InfoChip key={i} label={chip} variant="gold" />
            ))}
          </View>
        )}

        {/* Footer */}
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.gold,
    overflow: "hidden",
    ...shadows.card,
    marginBottom: spacing.base,
  },
  imageContainer: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "transparent",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  placeholderText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: "rgba(217,167,86,0.2)",
    letterSpacing: 4,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  badge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: colors.primary.dark,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  content: {
    padding: spacing.base,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.secondary.main,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    lineHeight: typography.fontSize.xl * 1.25,
    marginBottom: spacing.sm,
  },
  titleCompact: {
    fontSize: typography.fontSize.md,
  },
  description: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    lineHeight: typography.fontSize.sm * 1.6,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.gold,
  },
});
