import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing } from "../../config/theme";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

/**
 * Shows a banner at the top when the device is offline,
 * and a brief "Back online" green flash when reconnected.
 */
export default function OfflineBanner() {
  const { isConnected, wasOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const show = () => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 120 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const hide = (delay = 0) => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -60, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  };

  useEffect(() => {
    if (!isConnected) {
      show();
    } else if (wasOffline) {
      // Flash "back online" briefly
      show();
      hide(2000);
    }
  }, [isConnected, wasOffline]);

  if (isConnected && !wasOffline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top, opacity, transform: [{ translateY }] },
        isConnected ? styles.onlineBanner : styles.offlineBanner,
      ]}
      pointerEvents="none"
    >
      <Ionicons
        name={isConnected ? "wifi" : "wifi-outline"}
        size={16}
        color="#fff"
      />
      <Text style={styles.text}>
        {isConnected ? "Back online" : "No internet connection"}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  offlineBanner: {
    backgroundColor: colors.error,
  },
  onlineBanner: {
    backgroundColor: colors.success,
  },
  text: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#fff",
  },
});
