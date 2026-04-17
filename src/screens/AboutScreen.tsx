import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  useWindowDimensions,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../config/theme";
import { useApiWithCache } from "../hooks/useApi";
import { storiesService } from "../services/stories.service";
import { getImageUrl } from "../services/api";
import type { StoryCategory } from "../types/api.types";
import { ErrorView } from "../components/common";
import FloatingCallButton from "../components/common/FloatingCallButton";
import { CONTACT_INFO, EXTERNAL_URLS } from "../config/constants";
import { Linking } from "react-native";
import { useScrollBottomPadding } from "../config/layout";

// ─── Fallback story slides ────────────────────────────────────────────────────

const FALLBACK_SLIDES = [
  {
    id: "fb-1",
    title: "Our Story",
    subtitle: "Serving Brooklin since 2014 — where neighbours become friends.",
    image: require("../assets/images/story/Brookli-pub-front-view.jpg"),
  },
  {
    id: "fb-2",
    title: "The Pub",
    subtitle: "More than a restaurant — we're where memories are made.",
    image: require("../assets/images/story/brooklin-pub-indoor-view.jpg"),
  },
  {
    id: "fb-3",
    title: "Our Lounge",
    subtitle: "Relax, unwind, and enjoy crafted drinks in a warm atmosphere.",
    image: require("../assets/images/story/brooklin-pub-eligent.jpg"),
  },
  {
    id: "fb-4",
    title: "Community First",
    subtitle: "Woven into Brooklin's fabric — always keeping a seat for you.",
    image: require("../assets/images/story/brooklin-pub-dancing-in-function 1.jpg"),
  },
];

// ─── Gallery images ───────────────────────────────────────────────────────────

const GALLERY_IMAGES = [
  require("../assets/images/landing/item1.jpg"),
  require("../assets/images/landing/item2.jpg"),
  require("../assets/images/landing/item3.jpg"),
  require("../assets/images/landing/item4.jpg"),
  require("../assets/images/landing/item5.jpg"),
  require("../assets/images/landing/item6.jpg"),
];

// ─── Story Carousel ──────────────────────────────────────────────────────────

const StoryCarousel = ({
  slides,
}: {
  slides: Array<{ id: string; title: string; subtitle: string; image: any }>;
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = useCallback(
    (idx: number) => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setActiveIndex(idx);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    },
    [fadeAnim],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      goTo((activeIndex + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, activeIndex, goTo]);

  const current = slides[activeIndex];
  const heroH = Math.min(screenWidth * 0.75, 380);

  return (
    <View>
      {/* Hero image */}
      <View style={[styles.storyHero, { height: heroH }]}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
          <Image source={current.image} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={0} />
        </Animated.View>
        <LinearGradient
          colors={["transparent", "rgba(26,13,10,0.85)"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Content */}
        <Animated.View style={[styles.storyContent, { opacity: fadeAnim }]}>
          <Text style={styles.storyTitle}>{current.title}</Text>
          <Text style={styles.storySubtitle}>{current.subtitle}</Text>
        </Animated.View>

        {/* Dots */}
        <View style={styles.storyDots}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AboutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollBottomPad = useScrollBottomPadding();
  const { width: screenWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: storyCategories,
    loading,
    error,
    refetch,
  } = useApiWithCache<StoryCategory[]>("story-categories", () =>
    storiesService.getAllCategories(),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Build slides from API or fallback
  const slides = (() => {
    if (!storyCategories || storyCategories.length === 0) return FALLBACK_SLIDES;
    const apiSlides: typeof FALLBACK_SLIDES = [];
    for (const cat of storyCategories) {
      if (!cat.isActive) continue;
      for (const story of cat.stories ?? []) {
        if (!story.isActive) continue;
        const img = story.imageUrls?.[0];
        apiSlides.push({
          id: story.id,
          title: story.title,
          subtitle: story.content ? (story.content.slice(0, 120) + (story.content.length > 120 ? "…" : "")) : "",
          image: img ? { uri: getImageUrl(img) } : FALLBACK_SLIDES[0].image,
        });
      }
    }
    return apiSlides.length > 0 ? apiSlides : FALLBACK_SLIDES;
  })();

  const galleryThumbSize = (screenWidth - spacing.base * 2 - spacing.sm * 2) / 3;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary.main}
            colors={[colors.secondary.main]}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>About Us</Text>
          <Text style={styles.headerSubtitle}>
            Brooklin Pub & Grill since 2014
          </Text>
        </View>

        {/* ── Story Carousel ── */}
        <StoryCarousel slides={slides} />

        {/* ── Quick facts ── */}
        <View style={styles.factsRow}>
          {[
            { icon: "calendar" as const, label: "Since", value: "2014" },
            {
              icon: "location" as const,
              label: "Location",
              value: "Whitby, ON",
            },
            { icon: "people" as const, label: "Community", value: "First" },
          ].map(({ icon, label, value }) => (
            <View key={label} style={styles.factItem}>
              <View style={styles.factIcon}>
                <Ionicons name={icon} size={18} color={colors.secondary.main} />
              </View>
              <Text style={styles.factValue}>{value}</Text>
              <Text style={styles.factLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── About Copy ── */}
        <View style={styles.section}>
          <Text style={styles.sectionOverline}>Our Philosophy</Text>
          <Text style={styles.sectionTitle}>More Than a Meal</Text>
          <Text style={styles.body}>
            At Brooklin Pub & Grill, we believe great food is just the
            beginning. Since opening our doors in 2014, we've been a cornerstone
            of the Brooklin community — a place where neighbours become friends
            and every visit feels like coming home.
          </Text>
          <Text style={[styles.body, { marginTop: spacing.base }]}>
            We craft our menu with fresh, locally sourced ingredients and a
            passion for bold flavours. Whether you're here for a quick lunch, a
            family dinner, or a late-night celebration, we make every moment
            count.
          </Text>
        </View>

        {/* ── Gallery strip ── */}
        <View style={styles.gallerySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Gallery</Text>
          </View>
          <View style={styles.galleryGrid}>
            {GALLERY_IMAGES.map((img, i) => (
              <Image
                key={i}
                source={img}
                style={[
                  styles.galleryThumb,
                  { width: galleryThumbSize, height: galleryThumbSize },
                ]}
                contentFit="cover"
                transition={300}
              />
            ))}
          </View>
        </View>

        {/* ── Contact CTA ── */}
        <View style={styles.section}>
          <View style={styles.ctaCard}>
            <LinearGradient
              colors={[colors.primary.dark, "#2A1208"]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.ctaTitle}>Come Visit Us</Text>
            <Text style={styles.ctaAddress}>{CONTACT_INFO.ADDRESS.FULL}</Text>
            <View style={styles.ctaActions}>
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={() => Linking.openURL(EXTERNAL_URLS.GOOGLE_MAPS)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.secondary.main, colors.secondary.dark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaBtnGradient}
                >
                  <Ionicons name="navigate" size={14} color="#1A0D0A" />
                  <Text style={styles.ctaBtnText}>Get Directions</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctaBtnSecondary}
                onPress={() => navigation.navigate("Contact")}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="mail-outline"
                  size={14}
                  color={colors.secondary.main}
                />
                <Text style={styles.ctaBtnSecondaryText}>Contact Us</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <FloatingCallButton />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.default,
  },

  // ── Header
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },

  // ── Story Carousel
  storyHero: {
    width: "100%",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  storyContent: {
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  storyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: "#FFFDFB",
    marginBottom: spacing.sm,
  },
  storySubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: "rgba(255,253,251,0.8)",
    lineHeight: 24,
  },
  storyDots: {
    position: "absolute",
    bottom: spacing.base,
    right: spacing.xl,
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,253,251,0.4)",
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.secondary.main,
  },

  // ── Facts Row
  factsRow: {
    flexDirection: "row",
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  factItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  factIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(217,167,86,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  factValue: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
  factLabel: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.3,
  },

  // ── Sections
  section: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.base,
  },
  sectionHeaderRow: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.base,
  },
  sectionOverline: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.main,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  body: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    lineHeight: 25,
  },

  // ── Gallery
  gallerySection: {},
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  galleryThumb: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.paper,
  },

  // ── CTA Card
  ctaCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.lg,
  },
  ctaTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: "#FFFDFB",
  },
  ctaAddress: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(255,253,251,0.6)",
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  ctaActions: {
    gap: spacing.sm,
  },
  ctaBtn: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  ctaBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  ctaBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#1A0D0A",
  },
  ctaBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs,
  },
  ctaBtnSecondaryText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.secondary.main,
  },
});
