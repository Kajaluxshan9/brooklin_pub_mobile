import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors, typography, spacing, borderRadius } from "../config/theme";

const LAST_UPDATED = "March 29, 2025";
const CONTACT_EMAIL = "brooklinpub@gmail.com";
const BUSINESS_ADDRESS = "15 Baldwin St, Whitby, ON L1M 1A2";
const BUSINESS_PHONE = "(905) 425-3055";

const SectionTitle = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionDivider} />
  </View>
);

const Para = ({ children }: { children: string | React.ReactNode }) => (
  <Text style={styles.para}>{children}</Text>
);


export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary.main} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={styles.introCard}>
          <Text style={styles.introLabel}>Last Updated: {LAST_UPDATED}</Text>
          <Para>
            This Privacy Policy outlines how Brooklin Pub & Grill ("we", "our",
            or "us") collects, uses, discloses, and protects the personal
            information of our guests and website visitors in compliance with
            Canadian privacy laws.
          </Para>
        </View>

        <SectionTitle title="1. Collection of Information" />
        <Para>
          We collect information that you provide to us directly, such as when
          you submit a contact or reservation inquiry, sign up for our
          newsletter, or contact customer support. We may also collect basic
          information automatically when you use our app, such as your IP
          address and browsing behaviour, for security and performance purposes.
        </Para>

        <SectionTitle title="2. Use of Information" />
        <Para>
          Your information is used to respond to your inquiries, process
          reservation requests, send you our newsletter and promotions (with
          your consent), and improve our services. We may also use your
          information for marketing purposes with your consent.
        </Para>

        <SectionTitle title="3. Disclosure of Information" />
        <Para>
          We do not sell, trade, or rent your personal information to third
          parties. Your information may be shared with third-party service
          providers who perform functions on our behalf, such as email delivery.
          We require these third parties to protect your information and use it
          solely for the purposes for which it was disclosed.
        </Para>

        <SectionTitle title="4. Email Communications" />
        <Para>
          We will only send promotional emails to individuals who have
          subscribed to our newsletter. Each email includes a clear unsubscribe
          link. You can unsubscribe at any time by clicking the link in any of
          our emails or by contacting us at{" "}
          <Text
            style={styles.contactLink}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
          >
            {CONTACT_EMAIL}
          </Text>
          .
        </Para>

        <SectionTitle title="5. Security of Personal Information" />
        <Para>
          We implement appropriate security measures to protect your personal
          information from unauthorized access, alteration, disclosure, or
          destruction.
        </Para>

        <SectionTitle title="6. Access to Your Information" />
        <Para>
          You have the right to access, update, or delete your personal
          information. Please contact us to exercise these rights.
        </Para>

        <SectionTitle title="7. Changes to This Policy" />
        <Para>
          We may update our Privacy Policy from time to time. We will notify
          you of any changes by posting the updated policy on our website.
        </Para>

        <SectionTitle title="8. Contact Us" />
        <View style={styles.contactCard}>
          <Text style={styles.contactCardTitle}>Brooklin Pub & Grill</Text>
          <Text style={styles.contactCardText}>{BUSINESS_ADDRESS}</Text>
          <Text style={styles.contactCardText}>Phone: {BUSINESS_PHONE}</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
          >
            <Text style={[styles.contactCardText, styles.contactLink]}>
              {CONTACT_EMAIL}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing["2xl"] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217,167,86,0.2)",
    backgroundColor: "#FDF8F3",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(106,58,30,0.06)",
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.primary.main,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  introCard: {
    backgroundColor: "rgba(217,167,86,0.08)",
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.25)",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  introLabel: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: "#B8923F",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(217,167,86,0.35)",
  },
  para: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "#3C1F0E",
    lineHeight: typography.fontSize.sm * 1.85,
    marginBottom: spacing.md,
  },
  contactCard: {
    backgroundColor: "rgba(106,58,30,0.05)",
    borderWidth: 1,
    borderColor: "rgba(106,58,30,0.12)",
    borderRadius: borderRadius.base,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  contactCardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  contactCardText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "#3C1F0E",
    lineHeight: typography.fontSize.sm * 2,
  },
  contactLink: {
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bodySemibold,
    textDecorationLine: "underline",
  },
});
