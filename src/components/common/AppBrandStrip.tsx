import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { EXTERNAL_URLS } from "../../config/constants";
import { typography, spacing } from "../../config/theme";

const SOCIALS: { icon: "logo-facebook" | "logo-instagram" | "logo-tiktok"; url: string }[] = [
  { icon: "logo-facebook", url: EXTERNAL_URLS.SOCIAL.FACEBOOK },
  { icon: "logo-instagram", url: EXTERNAL_URLS.SOCIAL.INSTAGRAM },
  { icon: "logo-tiktok", url: EXTERNAL_URLS.SOCIAL.TIKTOK },
];

export default function AppBrandStrip() {
  return (
    <LinearGradient colors={["#4A2C17", "#2E1A0E"]} style={styles.container}>
      <View style={styles.topLine} />
      <View style={styles.inner}>
        <View style={styles.brandRow}>
          <Image
            source={require("../../../assets/brooklinpub-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>BROOKLIN PUB & GRILL</Text>
        </View>

        <View style={styles.socials}>
          {SOCIALS.map((s) => (
            <TouchableOpacity
              key={s.icon}
              style={styles.socialBtn}
              onPress={() => Linking.openURL(s.url).catch(() => {})}
              activeOpacity={0.75}
            >
              <Ionicons name={s.icon} size={18} color="#D9A756" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Brooklin Pub & Grill · Brooklin, ON
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing["2xl"],
  },
  topLine: {
    height: 1,
    backgroundColor: "rgba(217,167,86,0.2)",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  inner: {
    alignItems: "center",
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    opacity: 0.85,
  },
  brandName: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 13,
    color: "rgba(245,239,230,0.75)",
    letterSpacing: 1.5,
  },
  socials: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.3)",
    backgroundColor: "rgba(217,167,86,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  copyright: {
    fontFamily: typography.fontFamily.body,
    fontSize: 11,
    color: "rgba(245,239,230,0.35)",
    letterSpacing: 0.4,
    marginTop: spacing.xs,
  },
});
