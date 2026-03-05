import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import { GoldDivider, ErrorView } from "../components/common/SharedComponents";
import HeroSection from "../components/common/HeroSection";
import Footer from "../components/common/Footer";
import LoadingScreen from "../components/common/LoadingScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ─── Fallback slides when API has no stories ─── */
const FALLBACK_SLIDES = [
  {
    id: "fallback-1",
    title: "Our Story",
    subtitle:
      "Serving Brooklin since 2014\u2014where neighbours become friends and every visit feels like coming home.",
    image: require("../assets/images/story/Brookli-pub-front-view.jpg"),
  },
  {
    id: "fallback-2",
    title: "The Pub",
    subtitle:
      "More than a restaurant\u2014we're where memories are made, from first dates to family celebrations.",
    image: require("../assets/images/story/brooklin-pub-indoor-view.jpg"),
  },
  {
    id: "fallback-3",
    title: "Our Lounge",
    subtitle:
      "Relax, unwind, and enjoy crafted drinks in a warm lounge atmosphere.",
    image: require("../assets/images/story/brooklin-pub-eligent.jpg"),
  },
  {
    id: "fallback-4",
    title: "Community First",
    subtitle:
      "We're woven into Brooklin's fabric\u2014sponsoring local teams and always keeping a seat for you.",
    image: require("../assets/images/story/brooklin-pub-dancing-in-function 1.jpg"),
  },
  {
    id: "fallback-5",
    title: "Join the Family",
    subtitle:
      "Pull up a chair and stay awhile. First visit or hundredth\u2014you're always welcome here.",
    image: require("../assets/images/story/brooklin-pub-show-case.jpg"),
  },
];

/* ─── Random direction helper (matches frontend AnimatePresence directions) ─── */
const DIRECTIONS = ["left", "right", "top", "bottom"] as const;
type Direction = (typeof DIRECTIONS)[number];

const getRandomDirection = (): Direction =>
  DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

const getDirectionOffset = (
  dir: Direction,
  magnitude: number,
): { translateX: number; translateY: number } => {
  switch (dir) {
    case "left":
      return { translateX: -magnitude, translateY: 0 };
    case "right":
      return { translateX: magnitude, translateY: 0 };
    case "top":
      return { translateX: 0, translateY: -magnitude };
    case "bottom":
      return { translateX: 0, translateY: magnitude };
  }
};

/* ─── About slideshow component (matches frontend AboutUs mobile) ─── */
const AboutSlideshow = ({
  slides,
}: {
  slides: Array<{
    id: string;
    title: string;
    subtitle: string;
    image: any;
  }>;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideXAnim = useRef(new Animated.Value(0)).current;
  const slideYAnim = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.9)).current;
  const directionRef = useRef<Direction>("right");

  const animateTransition = useCallback(
    (nextIndex: number) => {
      const exitDir = getRandomDirection();
      const exitOffset = getDirectionOffset(exitDir, 40);

      // Animate out in random direction
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideXAnim, {
          toValue: exitOffset.translateX,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideYAnim, {
          toValue: exitOffset.translateY,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveIndex(nextIndex);

        // Enter from opposite random direction
        const enterDir = getRandomDirection();
        directionRef.current = enterDir;
        const enterOffset = getDirectionOffset(enterDir, 40);
        slideXAnim.setValue(-enterOffset.translateX);
        slideYAnim.setValue(-enterOffset.translateY);
        imageScale.setValue(0.88);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideXAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideYAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(imageScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideXAnim, slideYAnim, imageScale],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % slides.length;
      animateTransition(next);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length, activeIndex, animateTransition]);

  // Reset image scale for entrance
  useEffect(() => {
    imageScale.setValue(0.9);
    Animated.spring(imageScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  const current = slides[activeIndex];
  if (!current) return null;

  return (
    <View style={styles.slideshowSection}>
      {/* Light cream background matching frontend */}
      <View style={styles.slideshowContainer}>
        {/* Image with gradient border frame - matches frontend mobile */}
        <Animated.View
          style={[
            styles.slideImageWrapper,
            {
              opacity: fadeAnim,
              transform: [
                { scale: imageScale },
                { translateX: slideXAnim },
                { translateY: slideYAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(217, 167, 86, 0.6)",
              "rgba(106, 58, 30, 0.4)",
              "rgba(217, 167, 86, 0.6)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.slideImageBorder}
          >
            <View style={styles.slideImageInner}>
              <Image
                source={current.image}
                style={styles.slideImage}
                contentFit="cover"
                transition={400}
              />
            </View>
          </LinearGradient>
          {/* Subtle glow behind image */}
          <View style={styles.slideImageGlow} />
        </Animated.View>

        {/* Text content */}
        <Animated.View
          style={[
            styles.slideTextContent,
            {
              opacity: fadeAnim,
              transform: [
                { translateX: slideXAnim },
                { translateY: slideYAnim },
              ],
            },
          ]}
        >
          <Text style={styles.slideTitle}>{current.title}</Text>
          <Text style={styles.slideSubtitle}>{current.subtitle}</Text>
        </Animated.View>

        {/* Vertical pagination dots on right */}
        {slides.length > 1 && (
          <View style={styles.slidePagination}>
            {slides.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => animateTransition(i)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View
                  style={[
                    styles.slideDot,
                    i === activeIndex && styles.slideDotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

/* ─── Gallery Row (matches frontend Gallery mobile) ─── */
interface GalleryRowData {
  title: string;
  description: string;
  images: string[];
}

const GalleryRowMobile = ({
  row,
  isLast,
}: {
  row: GalleryRowData;
  isLast: boolean;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Auto-cycle every 2.5s
  useEffect(() => {
    if (row.images.length <= 1) return;
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex((prev) => (prev + 1) % row.images.length);
        scaleAnim.setValue(1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [row.images.length]);

  // Swipe gesture
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 20 && Math.abs(gesture.dy) < 40,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -50 && currentIndex < row.images.length - 1) {
            setCurrentIndex((prev) => prev + 1);
          } else if (gesture.dx > 50 && currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
          }
        },
      }),
    [currentIndex, row.images.length],
  );

  // Progress dot sliding window (show max 5)
  const getVisibleDots = useCallback(() => {
    const total = row.images.length;
    if (total <= 5) return row.images.map((_, i) => i);
    const indices: number[] = [];
    for (let i = -2; i <= 2; i++) {
      let idx = currentIndex + i;
      if (idx < 0) idx += total;
      if (idx >= total) idx -= total;
      indices.push(idx);
    }
    return indices;
  }, [currentIndex, row.images.length]);

  return (
    <View
      style={[styles.galleryRow, !isLast && { marginBottom: spacing["2xl"] }]}
    >
      {/* Glassmorphic Title Card */}
      <View style={styles.galleryTitleCard}>
        <View style={styles.galleryTitleGoldLine} />
        {/* Decorative glow */}
        <View style={styles.galleryTitleDecor} />
        <Text style={styles.galleryTitleText}>{row.title}</Text>
        <Text style={styles.galleryDescText}>{row.description}</Text>
      </View>

      {/* Image Container with swipe */}
      <View style={styles.galleryImageContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.galleryImageInner,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {row.images[currentIndex] && (
            <Image
              source={{ uri: row.images[currentIndex] }}
              style={styles.galleryFullImage}
              contentFit="cover"
              transition={300}
            />
          )}
        </Animated.View>

        {/* Bottom gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(74,44,23,0.4)"]}
          style={styles.galleryImageBottomGrad}
        />
        {/* Top gradient overlay */}
        <LinearGradient
          colors={["rgba(217,167,86,0.15)", "transparent"]}
          style={styles.galleryImageTopGrad}
        />

        {/* Image Counter Badge */}
        <View style={styles.galleryCounterBadge}>
          <Text style={styles.galleryCounterText}>
            {currentIndex + 1} / {row.images.length}
          </Text>
        </View>
      </View>

      {/* Progress Ring Pagination */}
      {row.images.length > 1 && (
        <View style={styles.galleryPagination}>
          {getVisibleDots().map((idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setCurrentIndex(idx)}
              activeOpacity={0.7}
            >
              <View style={styles.progressDotOuter}>
                {/* Background ring */}
                <View style={styles.progressDotRing} />
                {/* Active ring */}
                {idx === currentIndex && (
                  <View style={styles.progressDotRingActive} />
                )}
                {/* Inner dot */}
                <View
                  style={[
                    styles.progressDotInner,
                    idx === currentIndex && styles.progressDotInnerActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

/* ═══════════════════════════════════════════════════════ */
/* MAIN SCREEN                                           */
/* ═══════════════════════════════════════════════════════ */
export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  // Fetch story categories
  const {
    data: categories,
    loading,
    error,
    refetch,
  } = useApiWithCache<StoryCategory[]>("story-categories", () =>
    storiesService.getAllCategories(),
  );

  // Build slides for AboutUs slideshow
  const activeCategories = useMemo(
    () =>
      categories?.filter(
        (c) => c.isActive && c.stories && c.stories.length > 0,
      ) ?? [],
    [categories],
  );

  const allStories = useMemo(
    () => activeCategories.flatMap((c) => c.stories ?? []),
    [activeCategories],
  );

  // Build slides from API data or use fallbacks
  const slides = useMemo(() => {
    if (allStories.length > 0) {
      return allStories.map((story) => ({
        id: story.id,
        title: story.title,
        subtitle: story.content,
        image: story.imageUrls?.[0]
          ? { uri: getImageUrl(story.imageUrls[0]) }
          : require("../assets/images/story/Brookli-pub-front-view.jpg"),
      }));
    }
    return FALLBACK_SLIDES;
  }, [allStories]);

  // Build gallery rows from categories
  const galleryRows: GalleryRowData[] = useMemo(() => {
    if (!categories) return [];
    return categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => {
        const images = (category.stories || [])
          .filter((s) => s.isActive && s.imageUrls && s.imageUrls.length > 0)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .flatMap(
            (s) =>
              s.imageUrls
                .map((url) => getImageUrl(url))
                .filter(Boolean) as string[],
          );
        return {
          title: category.name,
          description: category.description || "",
          images,
        };
      })
      .filter((row) => row.images.length > 0);
  }, [categories]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero - light variant matching frontend */}
        <HeroSection
          title="About Us"
          overlineText={"\u2726 DISCOVER OUR HERITAGE \u2726"}
          subtitle="A local favorite since 2014, where great food meets warm hospitality"
          backgroundImage={require("../assets/images/hero-bg.jpg")}
          variant="light"
          height={300}
        />

        {/* ═══ Auto-Rotating Slideshow (AboutUs) ═══ */}
        <AboutSlideshow slides={slides} />

        {/* ═══ "A Glimpse Inside" Gallery Section ═══ */}
        {galleryRows.length > 0 && (
          <LinearGradient
            colors={["#FDF8F3", "#F5EBE0", "#E8D5C4", "#F5EBE0", "#FDF8F3"]}
            style={styles.gallerySectionGradient}
          >
            {/* Section Header */}
            <View style={styles.gallerySectionHeader}>
              <View style={styles.galleryHeaderLine}>
                <View style={styles.galleryHeaderDotLeft} />
                <View style={styles.galleryHeaderDotRight} />
              </View>

              <Text style={styles.galleryOverline}>
                {"\u25C6"} Our Story {"\u25C6"}
              </Text>

              <Text style={styles.gallerySectionTitle}>A Glimpse Inside</Text>

              <Text style={styles.gallerySectionDesc}>
                Nestled in the heart of Whitby at 15 Baldwin Street, Brooklin
                Pub & Grill has been a cornerstone of the community, bringing
                people together over exceptional food and drinks.
              </Text>

              <Text style={styles.gallerySectionDesc}>
                We pride ourselves on creating a warm, welcoming atmosphere
                where families can enjoy a meal together and everyone feels like
                part of our extended family.
              </Text>

              <View style={styles.galleryHeaderDivider} />
            </View>

            {/* Gallery Rows */}
            {galleryRows.map((row, i) => (
              <GalleryRowMobile
                key={i}
                row={row}
                isLast={i === galleryRows.length - 1}
              />
            ))}
          </LinearGradient>
        )}

        {/* ═══ "Since 2014" Section ═══ */}
        <View style={styles.sinceSection}>
          <LinearGradient
            colors={[colors.background.dark, "#2A1509", colors.background.dark]}
            style={styles.sinceGradient}
          >
            <Text style={styles.sinceOverline}>A LOCAL FAVORITE</Text>
            <Text style={styles.sinceTitle}>Since 2014</Text>
            <GoldDivider width="30%" marginVertical={spacing.md} />
            <Text style={styles.sinceText}>
              For over a decade, Brooklin Pub & Grill has been the heart of the
              community. From our signature dishes to live entertainment, we
              pride ourselves on providing a warm, welcoming atmosphere for
              everyone.
            </Text>
            <View style={styles.sinceStats}>
              <View style={styles.sinceStat}>
                <Text style={styles.sinceStatNumber}>10+</Text>
                <Text style={styles.sinceStatLabel}>Years</Text>
              </View>
              <View style={styles.sinceStatDivider} />
              <View style={styles.sinceStat}>
                <Text style={styles.sinceStatNumber}>100+</Text>
                <Text style={styles.sinceStatLabel}>Menu Items</Text>
              </View>
              <View style={styles.sinceStatDivider} />
              <View style={styles.sinceStat}>
                <Text style={styles.sinceStatNumber}>1000+</Text>
                <Text style={styles.sinceStatLabel}>Happy Guests</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Footer */}
        <Footer />
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* STYLES                                                */
/* ═══════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.default,
  },

  /* ──── Slideshow (AboutUs) ──── */
  slideshowSection: {
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.base,
    backgroundColor: colors.background.default,
    minHeight: 400,
  },
  slideshowContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  slideImageWrapper: {
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 20,
    position: "relative",
    marginBottom: spacing.lg,
  },
  slideImageBorder: {
    borderRadius: 24,
    padding: 3,
    ...shadows.lg,
  },
  slideImageInner: {
    borderRadius: 21,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  slideImage: {
    width: "100%",
    height: 260,
  },
  slideImageGlow: {
    position: "absolute",
    top: "10%",
    left: "10%",
    width: "80%",
    height: "80%",
    borderRadius: 24,
    backgroundColor: "rgba(217, 167, 86, 0.08)",
    zIndex: -1,
  },
  slideTextContent: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: spacing.base,
  },
  slideTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: typography.fontSize["3xl"] * 1.1,
  },
  slideSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: "#4A2C17",
    lineHeight: typography.fontSize.base * 1.7,
    textAlign: "center",
    maxWidth: 340,
  },
  slidePagination: {
    position: "absolute",
    right: 4,
    top: "50%",
    transform: [{ translateY: -40 }],
    gap: 12,
    alignItems: "center",
  },
  slideDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(60, 31, 14, 0.3)",
  },
  slideDotActive: {
    backgroundColor: colors.secondary.main,
  },

  /* ──── Gallery Section ──── */
  gallerySectionGradient: {
    paddingTop: spacing["3xl"],
    paddingBottom: spacing["2xl"],
  },
  gallerySectionHeader: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing["2xl"],
  },
  galleryHeaderLine: {
    width: 100,
    height: 3,
    backgroundColor: "transparent",
    borderRadius: 2,
    marginBottom: spacing.lg,
    position: "relative",
    overflow: "visible",
  },
  galleryHeaderDotLeft: {
    position: "absolute",
    left: -6,
    top: -4.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary.main,
  },
  galleryHeaderDotRight: {
    position: "absolute",
    right: -6,
    top: -4.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary.main,
  },
  galleryOverline: {
    color: colors.secondary.main,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bodySemibold,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  gallerySectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["4xl"],
    color: "#4A2C17",
    letterSpacing: -0.5,
    lineHeight: typography.fontSize["4xl"] * 1.1,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  gallerySectionDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.base * 1.85,
    textAlign: "justify",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  galleryHeaderDivider: {
    width: 200,
    height: 1,
    backgroundColor: "rgba(217,167,86,0.4)",
    marginTop: spacing.lg,
  },

  /* ──── Gallery Row ──── */
  galleryRow: {
    paddingHorizontal: spacing.lg,
  },
  galleryTitleCard: {
    backgroundColor: "rgba(255,253,251,0.95)",
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.25)",
    marginBottom: spacing.lg,
    position: "relative",
    overflow: "hidden",
    ...shadows.md,
  },
  galleryTitleGoldLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.secondary.main,
    opacity: 0.6,
  },
  galleryTitleDecor: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(217,167,86,0.1)",
  },
  galleryTitleText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: "#4A2C17",
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  galleryDescText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontStyle: "italic",
    lineHeight: typography.fontSize.base * 1.7,
    opacity: 0.9,
  },

  /* Gallery image */
  galleryImageContainer: {
    width: "100%",
    height: 300,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,253,251,0.8)",
    ...shadows.lg,
    position: "relative",
  },
  galleryImageInner: {
    width: "100%",
    height: "100%",
  },
  galleryFullImage: {
    width: "100%",
    height: "100%",
  },
  galleryImageBottomGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  galleryImageTopGrad: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
  },
  galleryCounterBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(255,253,251,0.9)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.3)",
    ...shadows.sm,
  },
  galleryCounterText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 12,
    color: "#4A2C17",
  },

  /* Gallery pagination */
  galleryPagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: "rgba(255,253,251,0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.2)",
    marginHorizontal: spacing.xl,
    ...shadows.sm,
  },
  progressDotOuter: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  progressDotRing: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "rgba(217,167,86,0.2)",
  },
  progressDotRingActive: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.secondary.main,
  },
  progressDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(217,167,86,0.5)",
  },
  progressDotInnerActive: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.secondary.main,
  },

  /* ──── Since 2014 ──── */
  sinceSection: {
    width: SCREEN_WIDTH,
  },
  sinceGradient: {
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  sinceOverline: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    letterSpacing: 4,
    color: colors.secondary.main,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  sinceTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["4xl"],
    color: colors.text.light,
    marginTop: spacing.sm,
  },
  sinceText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.overlay.white80,
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.7,
    marginBottom: spacing.xl,
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  sinceStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  sinceStat: {
    alignItems: "center",
  },
  sinceStatNumber: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.secondary.main,
  },
  sinceStatLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.overlay.white50,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  sinceStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border.gold,
  },
});
