import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Animated,
  RefreshControl,
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
import { specialsService } from "../services/specials.service";
import { getImageUrl } from "../services/api";
import type { Special } from "../types/api.types";
import {
  GoldDivider,
  CornerAccents,
  ErrorView,
} from "../components/common";
import PageHeader from "../components/common/PageHeader";
import SocialFAB from "../components/common/SocialFAB";
import { SpecialCardSkeleton } from "../components/common/SkeletonLoader";
import { useShare } from "../hooks/useShare";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_HEIGHT = CARD_WIDTH * 1.28;
const CARD_GAP = spacing.md;

// ─── Filter helpers ──────────────────────────────────────────────────────────
const filterDailySpecials = (specials: Special[]) =>
  specials.filter(
    (s) =>
      s.type === "daily" ||
      s.type === "day_time" ||
      s.specialCategory === "late_night",
  );

const filterOtherSpecials = (specials: Special[]) =>
  specials.filter(
    (s) =>
      s.type !== "daily" &&
      s.type !== "day_time" &&
      s.specialCategory !== "late_night",
  );

// ═══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function SpecialScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  // localType allows toggling between daily/other from the Specials tab
  const [localType, setLocalType] = useState<"daily" | "other">(
    route?.params?.type ?? "daily",
  );
  const specialType = localType;
  const [selectedSpecial, setSelectedSpecial] = useState<Special | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { shareSpecial } = useShare();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const {
    data: specialsData,
    loading,
    error,
    refetch,
  } = useApiWithCache<Special[]>("active-specials", () =>
    specialsService.getActiveSpecials(),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter based on type
  const specials = useMemo(() => {
    if (!specialsData || specialsData.length === 0) return [];
    const t = (specialType || "").toLowerCase();
    if (t === "other") return filterOtherSpecials(specialsData);
    return filterDailySpecials(specialsData);
  }, [specialsData, specialType]);

  // Reset carousel when type toggle changes
  useEffect(() => {
    setActiveIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [localType]);

  // Auto-scroll carousel
  useEffect(() => {
    if (specials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % specials.length;
        flatListRef.current?.scrollToIndex({
          index: next,
          animated: true,
          viewPosition: 0.5,
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [specials.length]);

  // Title & subtitle based on type — matching frontend getTitle/getSubtitle
  const getTitle = () => {
    if (specialType === "daily") return "Daily Specials";
    if (specialType === "other") return "Other Specials";
    if (specialType === "chef") return "Chef's Specials";
    if (specialType === "night") return "Night Specials";
    return `${specialType.charAt(0).toUpperCase() + specialType.slice(1)} Specials`;
  };
  const getSubtitle = () => {
    if (specialType === "daily")
      return "Start your day right with our daily deals, late-night bites, and all-day favourites";
    if (specialType === "other")
      return "Seasonal flavours, game-day specials, and chef's exclusive creations you won't want to miss";
    if (specialType === "chef")
      return "Handcrafted dishes made with passion by our talented kitchen team";
    if (specialType === "night")
      return "Evening exclusives to cap off your night in style";
    return "Discover our special offerings";
  };
  const title = getTitle();
  const subtitle = getSubtitle();

  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary.main}
            colors={[colors.secondary.main]}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
      >
        {/* Page header */}
        <PageHeader
          title={title}
          subtitle={subtitle}
          icon="flame-outline"
        />

        {/* Daily / Other toggle */}
        <View style={styles.typeToggleRow}>
          {(["daily", "other"] as const).map((t) => {
            const isActive = localType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeToggleBtn, isActive && styles.typeToggleBtnActive]}
                onPress={() => setLocalType(t)}
                activeOpacity={0.75}
              >
                <Text style={[styles.typeToggleText, isActive && styles.typeToggleTextActive]}>
                  {t === "daily" ? "Daily Specials" : "Other Specials"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.xl }}>
            {[1, 2, 3].map((i) => (
              <SpecialCardSkeleton key={i} />
            ))}
          </View>
        ) : specials.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="sparkles-outline"
              size={40}
              color={colors.secondary.main}
            />
            <Text style={styles.emptyTitle}>No Specials Right Now</Text>
            <Text style={styles.emptyText}>
              Check back soon for new specials!
            </Text>
          </View>
        ) : (
          <View style={styles.carouselSection}>
            <Animated.FlatList
              ref={flatListRef}
              horizontal
              data={specials}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + CARD_GAP}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
              }}
              ItemSeparatorComponent={() => (
                <View style={{ width: CARD_GAP }} />
              )}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true },
              )}
              onMomentumScrollEnd={(e: any) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP),
                );
                setActiveIndex(Math.max(0, Math.min(idx, specials.length - 1)));
              }}
              getItemLayout={(_: any, index: number) => ({
                length: CARD_WIDTH + CARD_GAP,
                offset: (CARD_WIDTH + CARD_GAP) * index,
                index,
              })}
              renderItem={({
                item,
                index,
              }: {
                item: Special;
                index: number;
              }) => {
                const inputRange = [
                  (index - 1) * (CARD_WIDTH + CARD_GAP),
                  index * (CARD_WIDTH + CARD_GAP),
                  (index + 1) * (CARD_WIDTH + CARD_GAP),
                ];
                const scale = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.9, 1, 0.9],
                  extrapolate: "clamp",
                });
                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.6, 1, 0.6],
                  extrapolate: "clamp",
                });

                return (
                  <Animated.View style={{ transform: [{ scale }], opacity }}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setSelectedSpecial(item)}
                      style={styles.specialCard}
                    >
                      <Image
                        source={{
                          uri:
                            getImageUrl(item.imageUrls?.[0]) ||
                            "https://i.pinimg.com/736x/42/2c/2e/422c2e649799697f1d1355ba8f308edd.jpg",
                        }}
                        style={styles.specialCardImage}
                        contentFit="cover"
                        transition={300}
                      />
                      <LinearGradient
                        colors={["transparent", colors.overlay.warmDark]}
                        style={styles.specialCardOverlay}
                      />
                      {/* Title overlay */}
                      <View style={styles.specialCardContent}>
                        <Text style={styles.specialCardTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        {item.description && (
                          <Text
                            style={styles.specialCardDesc}
                            numberOfLines={2}
                          >
                            {item.description}
                          </Text>
                        )}
                      </View>
                      <CornerAccents size={10} color={colors.secondary.main} />
                      {/* Type badge */}
                      <View style={styles.specialBadge}>
                        <Text style={styles.specialBadgeText}>
                          {item.type === "daily"
                            ? "Daily"
                            : item.type === "seasonal"
                              ? "Seasonal"
                              : item.type === "chef"
                                ? "Chef's"
                                : item.type === "game_time"
                                  ? "Game Day"
                                  : item.type === "day_time"
                                    ? "Day Time"
                                    : "Special"}
                        </Text>
                      </View>
                      {/* Day-of-week badge for daily specials */}
                      {item.type === "daily" && item.dayOfWeek && (
                        <View style={styles.specialDayBadge}>
                          <Text style={styles.specialDayBadgeText}>
                            {item.dayOfWeek}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              }}
            />

            {/* Pagination dots */}
            {specials.length > 1 && (
              <View style={styles.dotsRow}>
                {specials.map((_, i) => {
                  const isActive = i === activeIndex;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          width: isActive ? 24 : 8,
                          opacity: isActive ? 1 : 0.4,
                          backgroundColor: colors.secondary.main,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            )}

            {/* Swipe hint */}
            <Text style={styles.swipeHint}>
              Swipe to explore • Tap to view details
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Floating call FAB */}
      <SocialFAB />

      {/* ════ Detail Popup ════ */}
      <Modal
        visible={!!selectedSpecial}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedSpecial(null)}
      >
        <View style={styles.popupOverlay}>
          {/* Top action bar: Close + Share */}
          <View style={[styles.popupTopBar, { top: insets.top + spacing.md }]}>
            <TouchableOpacity
              style={styles.popupClose}
              onPress={() => setSelectedSpecial(null)}
              activeOpacity={0.7}
            >
              <View style={styles.popupCloseInner}>
                <Ionicons name="close" size={24} color={colors.background.paper} />
              </View>
            </TouchableOpacity>
            {selectedSpecial && (
              <TouchableOpacity
                style={styles.popupShareBtn}
                onPress={() => shareSpecial(selectedSpecial.title, selectedSpecial.description)}
                activeOpacity={0.7}
              >
                <View style={styles.popupCloseInner}>
                  <Ionicons name="share-social-outline" size={22} color={colors.background.paper} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Full-screen image */}
          {selectedSpecial && (
            <>
              <Image
                source={{
                  uri:
                    getImageUrl(selectedSpecial.imageUrls?.[1]) ||
                    getImageUrl(selectedSpecial.imageUrls?.[0]) ||
                    "https://images.template.net/278326/Restaurant-Menu-Template-edit-online.png",
                }}
                style={styles.popupImage}
                contentFit="contain"
                transition={300}
              />
              {/* Info bar */}
              <View style={styles.popupInfoBar}>
                <LinearGradient
                  colors={["rgba(60,31,14,0.95)", "rgba(26,13,10,0.98)"]}
                  style={styles.popupInfoGradient}
                >
                  <Text style={styles.popupInfoTitle} numberOfLines={1}>
                    {selectedSpecial.title}
                  </Text>
                  {selectedSpecial.description && (
                    <Text style={styles.popupInfoDesc} numberOfLines={2}>
                      {selectedSpecial.description}
                    </Text>
                  )}
                  <GoldDivider width="40%" marginVertical={spacing.sm} />
                  <View style={styles.popupInfoBadgeRow}>
                    <View style={styles.popupInfoBadge}>
                      <Ionicons
                        name="sparkles"
                        size={12}
                        color={colors.secondary.main}
                      />
                      <Text style={styles.popupInfoBadgeText}>
                        {selectedSpecial.type === "daily"
                          ? "Daily Special"
                          : selectedSpecial.type === "seasonal"
                            ? "Seasonal"
                            : selectedSpecial.type === "chef"
                              ? "Chef's Special"
                              : "Limited Time"}
                      </Text>
                    </View>
                    {selectedSpecial.dayOfWeek && (
                      <View style={styles.popupInfoBadge}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={colors.secondary.main}
                        />
                        <Text style={styles.popupInfoBadgeText}>
                          {selectedSpecial.dayOfWeek}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.default,
  },

  /* Type toggle */
  typeToggleRow: {
    flexDirection: "row",
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: "rgba(74,44,23,0.08)",
    borderRadius: borderRadius.lg,
    padding: 3,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: borderRadius.md,
  },
  typeToggleBtnActive: {
    backgroundColor: colors.secondary.main,
  },
  typeToggleText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  typeToggleTextActive: {
    color: "#fff",
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing["2xl"] * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.primary.main,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    textAlign: "center",
  },

  /* Carousel */
  carouselSection: {
    paddingVertical: spacing.xl,
  },
  specialCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    position: "relative",
    ...shadows.gold,
  },
  specialCardImage: {
    width: "100%",
    height: "100%",
  },
  specialCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  specialCardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  specialCardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 24,
    color: colors.background.paper,
    textShadowColor: colors.overlay.medium,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginBottom: spacing.xs,
    lineHeight: 28,
  },
  specialCardDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(255,253,251,0.85)",
    lineHeight: typography.fontSize.sm * 1.5,
  },
  specialBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.secondary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  specialBadgeText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 10,
    color: colors.background.paper,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  specialDayBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(40,20,8,0.65)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.5)",
  },
  specialDayBadgeText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 10,
    color: colors.secondary.main,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary.main,
  },

  /* Swipe hint */
  swipeHint: {
    textAlign: "center",
    marginTop: spacing.md,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },

  /* Popup */
  popupOverlay: {
    flex: 1,
    backgroundColor: colors.background.default,
    alignItems: "center",
    justifyContent: "center",
  },
  popupTopBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    zIndex: 20,
  },
  popupClose: {
    zIndex: 20,
  },
  popupShareBtn: {
    zIndex: 20,
  },
  popupCloseInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay.medium,
    alignItems: "center",
    justifyContent: "center",
  },
  popupImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
  },
  popupInfoBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  popupInfoGradient: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
    alignItems: "center",
  },
  popupInfoTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.text.light,
    marginBottom: spacing.xs,
  },
  popupInfoDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(243,227,204,0.8)",
    textAlign: "center",
    lineHeight: typography.fontSize.sm * 1.5,
  },
  popupInfoBadgeRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  popupInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.glass.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  popupInfoBadgeText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.main,
    textTransform: "capitalize",
  },

  /* Specials List */
  listSection: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  listCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.gold,
    ...shadows.card,
    position: "relative",
  },
  listCardImage: {
    width: 100,
    height: 100,
  },
  listCardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "center",
  },
  listCardTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    marginBottom: 2,
  },
  listCardDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    lineHeight: typography.fontSize.sm * 1.4,
    marginBottom: spacing.xs,
  },
  listCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listCardTypeBadge: {
    backgroundColor: colors.glass.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  listCardTypeText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 10,
    color: colors.secondary.main,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
