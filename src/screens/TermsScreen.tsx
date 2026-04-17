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
import { useScrollBottomPadding } from "../config/layout";

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


export default function TermsScreen() {
  const navigation = useNavigation();
  const scrollBottomPad = useScrollBottomPadding();

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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={styles.introCard}>
          <Text style={styles.introLabel}>Last Updated: {LAST_UPDATED}</Text>
          <Para>
            These Terms and Conditions govern the collection, use, and
            disclosure of personal information through the Brooklin Pub & Grill
            website and mobile application ("we", "our", or "us"). By using our
            service, you agree to the collection and use of information in
            accordance with these terms.
          </Para>
        </View>

        <SectionTitle title="1. Collection of Personal Information" />
        <Para>
          We collect personal information that you provide directly to us when
          you submit a contact or reservation inquiry, sign up for our
          newsletter, or interact with our service. This may include your name,
          email address, phone number, and message content.
        </Para>

        <SectionTitle title="2. Use of Personal Information" />
        <Para>
          Your personal information is used to respond to your inquiries,
          process reservation requests, provide customer support, and improve
          our services. We may also use your information to communicate with you
          about promotions and updates related to our services.
        </Para>

        <SectionTitle title="3. Disclosure of Personal Information" />
        <Para>
          We do not sell, trade, or rent your personal information to third
          parties. Your information may be shared with third-party service
          providers who perform services on our behalf, such as email delivery.
          These third parties are obligated to protect your information and may
          not use it for any other purpose.
        </Para>

        <SectionTitle title="4. Consent" />
        <Para>
          By using our service, you consent to the collection, use, and
          disclosure of your personal information as outlined in these terms.
          You may withdraw your consent at any time by contacting us, but this
          may affect your ability to use certain features of our service.
        </Para>

        <SectionTitle title="5. Newsletter & Promotional Codes" />
        <Para>
          By subscribing to our newsletter, you consent to receive promotional
          emails from Brooklin Pub & Grill. You may unsubscribe at any time
          using the link in any of our emails or by contacting us directly.
        </Para>
        <Para>
          Promotional codes distributed via newsletter are subject to individual
          terms and expiry dates. Codes are non-transferable and cannot be
          combined with other offers unless stated otherwise.
        </Para>

        <SectionTitle title="6. Menu, Pricing & Availability" />
        <Para>
          Menu items, descriptions, and prices displayed on our platform are for
          informational purposes only and are subject to change without notice.
          In-restaurant pricing at the time of your visit is authoritative.
        </Para>
        <Para>
          Allergen information is provided as a general guide. If you have a
          food allergy or dietary restriction, please inform your server before
          ordering.
        </Para>

        <SectionTitle title="7. Events" />
        <Para>
          Event listings (dates, times, performers) are subject to change or
          cancellation without notice. Guests are encouraged to confirm event
          details directly with us before attending.
        </Para>

        <SectionTitle title="8. Changes to These Terms" />
        <Para>
          We may update these Terms from time to time. We will notify you of any
          changes by posting the updated Terms on our website. Continued use of
          our platform after changes are posted constitutes your acceptance of
          the revised Terms.
        </Para>

        <SectionTitle title="9. Contact Us" />
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
