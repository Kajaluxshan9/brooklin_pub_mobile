import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, borderRadius } from "../../config/theme";
import { EXTERNAL_URLS, CONTACT_INFO } from "../../config/constants";
import { useApiWithCache } from "../../hooks/useApi";
import { openingHoursService } from "../../services/opening-hours.service";
import type { OpeningHours } from "../../types/api.types";
import { GoldDivider } from "./SharedComponents";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_ABBREVS: Record<string, string> = {
  monday: "MON",
  tuesday: "TUE",
  wednesday: "WED",
  thursday: "THU",
  friday: "FRI",
  saturday: "SAT",
  sunday: "SUN",
};

const formatTime12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "P.M." : "A.M.";
  const hr = h % 12 || 12;
  return m === 0
    ? `${hr} ${ampm}`
    : `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const getOpenClosedStatus = (hours: OpeningHours[]): boolean => {
  try {
    const now = new Date();
    const torontoNow = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Toronto" }),
    );
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayKey = days[torontoNow.getDay()];
    const currentMinutes = torontoNow.getHours() * 60 + torontoNow.getMinutes();

    const todayHours = hours.find(
      (h) => h.dayOfWeek?.toLowerCase() === todayKey && h.isOpen && h.isActive,
    );
    if (todayHours && todayHours.openTime && todayHours.closeTime) {
      const [oh, om] = todayHours.openTime.split(":").map(Number);
      const [ch, cm] = todayHours.closeTime.split(":").map(Number);
      const open = oh * 60 + om;
      const close = ch * 60 + cm;

      if (todayHours.isClosedNextDay || close < open) {
        if (currentMinutes >= open) return true;
      } else {
        if (currentMinutes >= open && currentMinutes < close) return true;
      }
    }

    const prevDayIndex = (torontoNow.getDay() + 6) % 7;
    const prevDayKey = days[prevDayIndex];
    const prevHours = hours.find(
      (h) =>
        h.dayOfWeek?.toLowerCase() === prevDayKey && h.isOpen && h.isActive,
    );
    if (
      prevHours &&
      prevHours.openTime &&
      prevHours.closeTime &&
      (prevHours.isClosedNextDay ||
        (() => {
          const [oh] = prevHours.openTime!.split(":").map(Number);
          const [ch] = prevHours.closeTime!.split(":").map(Number);
          return ch < oh;
        })())
    ) {
      const [ch, cm] = prevHours.closeTime.split(":").map(Number);
      const close = ch * 60 + cm;
      if (currentMinutes < close) return true;
    }

    return false;
  } catch {
    return false;
  }
};

interface FooterProps {
  openStatus?: { isOpen: boolean } | null;
}

export default function Footer({ openStatus: externalStatus }: FooterProps) {
  const [tick, setTick] = useState(0);
  const { data: allHours } = useApiWithCache<OpeningHours[]>(
    "footer-opening-hours",
    () => openingHoursService.getAllOpeningHours(),
  );

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const computedIsOpen = allHours ? getOpenClosedStatus(allHours) : null;
  const isOpen = computedIsOpen ?? externalStatus?.isOpen ?? null;

  const sortedHours = allHours
    ? [...allHours]
        .filter((h) => h.isActive)
        .sort(
          (a, b) =>
            DAY_ORDER.indexOf(a.dayOfWeek?.toLowerCase() ?? "") -
            DAY_ORDER.indexOf(b.dayOfWeek?.toLowerCase() ?? ""),
        )
    : null;

  const todayKey = (() => {
    try {
      const now = new Date();
      const torontoNow = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Toronto" }),
      );
      const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      return days[torontoNow.getDay()];
    } catch {
      return "";
    }
  })();

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const quickLinks = [
    { label: "Home", icon: "arrow-forward" as const },
    { label: "Our Story", icon: "arrow-forward" as const },
    { label: "Menu", icon: "arrow-forward" as const },
    { label: "Daily Specials", icon: "arrow-forward" as const },
    { label: "Events", icon: "arrow-forward" as const },
    { label: "Contact Us", icon: "arrow-forward" as const },
  ];

  return (
    <LinearGradient colors={["#6A3A1E", "#4A2C17"]} style={styles.container}>
      {/* ══════ 2-Column Grid Layout (matching frontend mobile) ══════ */}
      <View style={styles.gridContainer}>
        {/* Brand Section - Full Width */}
        <View style={styles.brandSection}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../../assets/brooklinpub-logo.png")}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandName}>BROOKLIN PUB</Text>
            </View>
          </View>

          <Text style={styles.brandDescription}>
            Brooklin's neighbourhood pub since 2014. Great food, cold beer, and
            the kind of atmosphere where everyone feels at home.
          </Text>

          {/* Social Icons */}
          <View style={styles.socialRow}>
            {[
              {
                icon: "logo-facebook" as const,
                url: EXTERNAL_URLS.SOCIAL.FACEBOOK,
              },
              {
                icon: "logo-instagram" as const,
                url: EXTERNAL_URLS.SOCIAL.INSTAGRAM,
              },
              {
                icon: "logo-tiktok" as const,
                url: EXTERNAL_URLS.SOCIAL.TIKTOK,
              },
            ].map((social, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => openLink(social.url)}
                style={styles.socialButton}
                activeOpacity={0.8}
              >
                <Ionicons name={social.icon} size={20} color="#D9A756" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Two column grid for links and hours */}
        <View style={styles.twoColumnGrid}>
          {/* Quick Links Column */}
          <View style={styles.gridColumn}>
            <Text style={styles.sectionLabel}>Explore</Text>
            <View style={styles.linksList}>
              {quickLinks.map((link, i) => (
                <View key={i} style={styles.linkItem}>
                  <Text style={styles.linkArrow}>→</Text>
                  <Text style={styles.linkText}>{link.label}</Text>
                </View>
              ))}
            </View>

            {/* Download Menus */}
            <Text style={styles.downloadLabel}>Download Menus</Text>
            <TouchableOpacity
              onPress={() =>
                openLink(
                  "https://brooklinpub.com/menu/Main%20Menu%20-%20Brooklin%20Pub.pdf",
                )
              }
              style={styles.menuDownloadBtn}
            >
              <Text style={styles.menuDownloadText}>📄 Main Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                openLink(
                  "https://brooklinpub.com/menu/Drinks%20Menu%20-%20Brooklin%20Pub.pdf",
                )
              }
              style={styles.menuDownloadBtn}
            >
              <Text style={styles.menuDownloadText}>🍸 Drinks Menu</Text>
            </TouchableOpacity>
          </View>

          {/* Opening Hours Column */}
          <View style={styles.gridColumn}>
            <View style={styles.hoursHeader}>
              <Ionicons name="time-outline" size={16} color="#D9A756" />
              <Text style={styles.sectionLabel}>Hours</Text>
            </View>

            {/* Status Badge */}
            {isOpen !== null && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isOpen
                      ? "rgba(34,197,94,0.15)"
                      : "rgba(239,68,68,0.15)",
                    borderColor: isOpen
                      ? "rgba(34,197,94,0.4)"
                      : "rgba(239,68,68,0.4)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOpen ? "#22C55E" : "#EF4444" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isOpen ? "#22C55E" : "#EF4444" },
                  ]}
                >
                  {isOpen ? "Open Now" : "Closed"}
                </Text>
              </View>
            )}

            {/* Hours list */}
            {sortedHours && sortedHours.length > 0 ? (
              <View style={styles.hoursContainer}>
                {sortedHours.map((h, i) => {
                  const dayKey = h.dayOfWeek?.toLowerCase() ?? "";
                  const isToday = dayKey === todayKey;
                  const isClosed = !h.isOpen || !h.openTime || !h.closeTime;
                  return (
                    <View
                      key={i}
                      style={[styles.hoursRow, isToday && styles.hoursRowToday]}
                    >
                      <Text
                        style={[
                          styles.hoursDay,
                          isToday && styles.hoursDayToday,
                        ]}
                      >
                        {DAY_ABBREVS[dayKey] ?? dayKey.toUpperCase()}
                      </Text>
                      <Text
                        style={[
                          styles.hoursTime,
                          isToday && styles.hoursTimeToday,
                          isClosed && styles.hoursTimeClosed,
                        ]}
                      >
                        {isClosed
                          ? "Closed"
                          : `${formatTime12(h.openTime ?? "")} - ${formatTime12(h.closeTime ?? "")}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.hoursComingSoon}>Hours coming soon</Text>
            )}
          </View>
        </View>

        {/* Contact Section - Full Width */}
        <View style={styles.contactSection}>
          <Text style={[styles.sectionLabel, { textAlign: "center" }]}>
            Get in Touch
          </Text>
          <View style={styles.contactItems}>
            <TouchableOpacity
              onPress={() =>
                openLink(
                  "https://maps.google.com/?q=15+Baldwin+St,+Whitby,+ON+L1M+1A2",
                )
              }
              style={styles.contactItem}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color="#D9A756"
                style={{ marginTop: 2 }}
              />
              <View>
                <Text style={styles.contactText}>15 Baldwin St</Text>
                <Text style={styles.contactSubText}>Whitby, ON L1M 1A2</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink(`tel:+19054253055`)}
              style={styles.contactItem}
            >
              <Ionicons name="call-outline" size={18} color="#D9A756" />
              <Text style={styles.contactText}>{CONTACT_INFO.PHONE}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink(`mailto:${CONTACT_INFO.EMAIL_GENERAL}`)}
              style={styles.contactItem}
            >
              <Ionicons name="mail-outline" size={18} color="#D9A756" />
              <Text style={styles.contactText}>
                {CONTACT_INFO.EMAIL_GENERAL}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contact Us CTA */}
          <TouchableOpacity style={styles.contactCTA}>
            <Text style={styles.contactCTAText}>Contact Us</Text>
            <Ionicons name="arrow-forward" size={16} color="#D9A756" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.footerDivider} />

      {/* Copyright */}
      <View style={styles.copyrightSection}>
        <View style={styles.copyrightRow}>
          <Image
            source={require("../../../assets/brooklinpub-logo.png")}
            style={styles.copyrightLogo}
            resizeMode="contain"
          />
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} Brooklin Pub. All rights reserved.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => openLink("https://www.akvisionsystems.com/")}
        >
          <Text style={styles.credit}>
            Brought to life by{" "}
            <Text style={styles.creditHighlight}>AK Vision Systems</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing["2xl"],
    paddingBottom: 100,
    overflow: "hidden",
    position: "relative",
  },
  gridContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },

  /* Brand Section */
  brandSection: {
    alignItems: "center",
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  footerLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  brandName: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: "#F5EFE6",
    letterSpacing: 1,
    lineHeight: typography.fontSize.lg * 1.2,
  },
  brandDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(245,239,230,0.8)",
    textAlign: "center",
    lineHeight: typography.fontSize.sm * 1.8,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  socialRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.3)",
    backgroundColor: "rgba(217,167,86,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Two Column Grid */
  twoColumnGrid: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  gridColumn: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.base,
    color: "#D9A756",
    letterSpacing: 1,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },

  /* Quick Links */
  linksList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  linkArrow: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(245,239,230,0.5)",
  },
  linkText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: "rgba(245,239,230,0.85)",
  },
  downloadLabel: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.sm,
    color: "#D9A756",
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    opacity: 0.9,
  },
  menuDownloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
    backgroundColor: "rgba(217,167,86,0.15)",
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.3)",
    marginBottom: spacing.sm,
  },
  menuDownloadText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "rgba(245,239,230,0.95)",
  },

  /* Hours */
  hoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  hoursContainer: {
    gap: 2,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  hoursRowToday: {
    backgroundColor: "rgba(217,167,86,0.1)",
  },
  hoursDay: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 12,
    color: "rgba(245,239,230,0.7)",
    minWidth: 30,
  },
  hoursDayToday: {
    color: "#D9A756",
    fontFamily: typography.fontFamily.bodyBold,
  },
  hoursTime: {
    fontFamily: typography.fontFamily.body,
    fontSize: 11,
    color: "rgba(245,239,230,0.7)",
  },
  hoursTimeToday: {
    color: "#F5EFE6",
    fontFamily: typography.fontFamily.bodySemibold,
  },
  hoursTimeClosed: {
    color: "rgba(239,68,68,0.8)",
  },
  hoursComingSoon: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(245,239,230,0.5)",
    fontStyle: "italic",
  },

  /* Contact Section */
  contactSection: {
    alignItems: "center",
    gap: spacing.md,
  },
  contactItems: {
    gap: spacing.md,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "center",
  },
  contactText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: "rgba(245,239,230,0.9)",
  },
  contactSubText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(245,239,230,0.6)",
  },
  contactCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "#D9A756",
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  contactCTAText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#D9A756",
  },

  /* Footer Bottom */
  footerDivider: {
    height: 1,
    backgroundColor: "rgba(217,167,86,0.2)",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
  },
  copyrightSection: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  copyrightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  copyrightLogo: {
    width: 20,
    height: 20,
    opacity: 0.5,
  },
  copyright: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(245,239,230,0.5)",
  },
  credit: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: "rgba(245,239,230,0.4)",
    textAlign: "center",
  },
  creditHighlight: {
    color: "#D9A756",
    fontFamily: typography.fontFamily.bodySemibold,
  },
});
