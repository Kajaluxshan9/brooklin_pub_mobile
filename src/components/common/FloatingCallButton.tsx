import React from "react";
import { TouchableOpacity, StyleSheet, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, shadows } from "../../config/theme";
import { CONTACT_INFO } from "../../config/constants";

/**
 * Floating phone-call FAB — renders in the bottom-right corner of the screen.
 * Matches the frontend's `Callicon` component that appears on Home, Events,
 * Contact, and Menu pages.
 */
export default function FloatingCallButton() {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: insets.bottom + 80 }]}
      onPress={() => Linking.openURL(`tel:${CONTACT_INFO.PHONE_RAW}`)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[colors.secondary.main, colors.secondary.dark]}
        style={styles.gradient}
      >
        <Ionicons name="call" size={22} color={colors.primary.dark} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.base,
    zIndex: 100,
  },
  gradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.gold,
  },
});
