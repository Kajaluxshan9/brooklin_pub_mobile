import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, typography, spacing, borderRadius, shadows } from "../../config/theme";
import { CONTACT_INFO, EXTERNAL_URLS } from "../../config/constants";
import { useShare } from "../../hooks/useShare";
import { useTabBarTopOffset } from "../../config/layout";

interface SocialAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}

/**
 * Enhanced floating action button that expands to show multiple social/contact actions.
 * Replaces the basic FloatingCallButton with a full social media + contact FAB.
 */
export default function SocialFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const animation = useRef(new Animated.Value(0)).current;
  const { shareRestaurant } = useShare();

  // Available vertical space above FAB before hitting safe area top
  const fabBottom = useTabBarTopOffset() + spacing.sm;
  const availableUpwardSpace = screenHeight - fabBottom - insets.top - 80;
  // Cap item stride so actions never go behind status bar
  const actionStride = Math.min(64, availableUpwardSpace / (5 + 0.5));

  const toggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      damping: 14,
      stiffness: 160,
    }).start();
    setIsOpen(!isOpen);
  }, [isOpen, animation]);

  const handleAction = useCallback((action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggle();
    setTimeout(action, 100);
  }, [toggle]);

  const openURL = useCallback((url: string) => Linking.openURL(url).catch(() => {}), []);

  const ACTIONS: SocialAction[] = [
    {
      icon: "call",
      label: "Call Us",
      color: colors.success,
      onPress: () => openURL(`tel:${CONTACT_INFO.PHONE_RAW}`),
    },
    {
      icon: "logo-facebook",
      label: "Facebook",
      color: "#1877F2",
      onPress: () => openURL(EXTERNAL_URLS.SOCIAL.FACEBOOK),
    },
    {
      icon: "logo-instagram",
      label: "Instagram",
      color: "#E1306C",
      onPress: () => openURL(EXTERNAL_URLS.SOCIAL.INSTAGRAM),
    },
    {
      icon: "navigate",
      label: "Directions",
      color: colors.secondary.main,
      onPress: () => openURL(EXTERNAL_URLS.GOOGLE_MAPS),
    },
    {
      icon: "share-social",
      label: "Share",
      color: colors.primary.light,
      onPress: shareRestaurant,
    },
  ];

  const rotation = animation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });

  return (
    <View style={[styles.container, { bottom: fabBottom }]} pointerEvents="box-none">
      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={toggle}
          activeOpacity={1}
        />
      )}

      {/* Action items */}
      {ACTIONS.map((action, index) => {
        const itemTranslateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(actionStride * (index + 1))],
        });
        const itemOpacity = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });
        const itemScale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        });

        return (
          <Animated.View
            key={action.label}
            style={[
              styles.actionItem,
              {
                opacity: itemOpacity,
                transform: [{ translateY: itemTranslateY }, { scale: itemScale }],
              },
            ]}
            pointerEvents={isOpen ? "auto" : "none"}
          >
            <TouchableOpacity
              style={styles.actionLabel}
              onPress={() => handleAction(action.onPress)}
              activeOpacity={0.85}
            >
              <Text style={styles.actionLabelText}>{action.label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={() => handleAction(action.onPress)}
              activeOpacity={0.85}
            >
              <Ionicons name={action.icon} size={20} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={styles.fabWrap}>
        <LinearGradient
          colors={[colors.secondary.main, colors.secondary.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name={isOpen ? "close" : "ellipsis-horizontal"} size={24} color={colors.primary.dark} />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: spacing.lg,
    alignItems: "flex-end",
    zIndex: 100,
  },
  backdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: -1,
  },
  fabWrap: {
    zIndex: 2,
    borderRadius: 30,
    shadowColor: "#8B6914",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  actionItem: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  actionLabel: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.gold,
    ...shadows.sm,
  },
  actionLabelText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
});
