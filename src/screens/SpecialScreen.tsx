import React, { useState, useMemo, useCallback, useRef } from "react";
import ImageViewer from "../components/common/ImageViewer";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  FlatList,
  Modal,
  Pressable,
  ImageBackground,
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
import { ErrorView } from "../components/common";
import { SpecialCardSkeleton } from "../components/common/SkeletonLoader";
import SocialFAB from "../components/common/SocialFAB";
import { useShare } from "../hooks/useShare";

// ─── Types / Config ───────────────────────────────────────────────────────────

type TabId = "daily" | "seasonal" | "game_day" | "chef";

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap; types: string[] }[] = [
  { id: "daily",    label: "Daily",    icon: "sunny-outline",  types: ["daily", "day_time"] },
  { id: "seasonal", label: "Seasonal", icon: "leaf-outline",   types: ["seasonal"] },
  { id: "game_day", label: "Game Day", icon: "football-outline", types: ["game_time"] },
  { id: "chef",     label: "Chef's",   icon: "restaurant-outline", types: ["chef"] },
];

// ─── Special Detail Modal ────────────────────────────────────────────────────

const SpecialDetailModal = ({
  special,
  visible,
  onClose,
  onShare,
}: {
  special: Special | null;
  visible: boolean;
  onClose: () => void;
  onShare: (s: Special) => void;
}) => {
  if (!special) return null;
  const imageUrl = special.imageUrls?.[0] ? getImageUrl(special.imageUrls[0]) : null;
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const typeLabel = () => {
    if (special.type === "daily" || special.type === "day_time") return "Daily Special";
    if (special.specialCategory === "late_night") return "Late Night";
    if (special.type === "seasonal") return "Seasonal";
    if (special.type === "game_time") return "Game Day";
    if (special.type === "chef") return "Chef's Special";
    return "Special";
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {imageUrl ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerUri(imageUrl)}>
                <Image source={{ uri: imageUrl }} style={styles.modalImage} contentFit="contain" transition={300} />
              </TouchableOpacity>
            ) : (
              <LinearGradient
                colors={[colors.primary.dark, colors.primary.main]}
                style={[styles.modalImage, { alignItems: "center", justifyContent: "center" }]}
              >
                <Ionicons name="restaurant" size={52} color={colors.secondary.main} />
              </LinearGradient>
            )}

            <View style={styles.modalBody}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTypeBadge}>
                  <Text style={styles.modalTypeBadgeText}>{typeLabel()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => onShare(special)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="share-outline" size={18} color={colors.text.muted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>{special.title}</Text>

              {special.description ? (
                <Text style={styles.modalDesc}>{special.description}</Text>
              ) : null}

              {special.dayOfWeek && (
                <View style={styles.modalMetaRow}>
                  <Ionicons name="calendar-outline" size={15} color={colors.secondary.main} />
                  <Text style={styles.modalMetaText}>
                    Every {special.dayOfWeek.charAt(0).toUpperCase() + special.dayOfWeek.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.modalCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>

      <ImageViewer uri={viewerUri} visible={!!viewerUri} onClose={() => setViewerUri(null)} />
    </Modal>
  );
};

// ─── Special Card ─────────────────────────────────────────────────────────────

const SpecialCard = React.memo(({
  special,
  onPress,
}: {
  special: Special;
  onPress: () => void;
}) => {
  const imageUrl = special.imageUrls?.[0] ? getImageUrl(special.imageUrls[0]) : null;
  const isLateNight = special.specialCategory === "late_night";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.87}>
      {/* Image / Gradient left block */}
      <View style={styles.cardImageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} contentFit="contain" transition={300} />
        ) : (
          <LinearGradient
            colors={[colors.primary.dark, colors.primary.main]}
            style={[styles.cardImage, { alignItems: "center", justifyContent: "center" }]}
          >
            <Ionicons name="restaurant-outline" size={28} color={colors.secondary.main} />
          </LinearGradient>
        )}
        {isLateNight && (
          <View style={styles.lateNightBadge}>
            <Ionicons name="moon" size={10} color="#FFFDFB" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{special.title}</Text>

        {special.dayOfWeek && (
          <View style={styles.cardDayRow}>
            <Ionicons name="repeat-outline" size={12} color={colors.secondary.main} />
            <Text style={styles.cardDayText}>
              Every {special.dayOfWeek.charAt(0).toUpperCase() + special.dayOfWeek.slice(1)}
            </Text>
          </View>
        )}

        {special.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{special.description}</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.text.muted} style={{ alignSelf: "center", marginRight: spacing.sm }} />
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SpecialScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { shareSpecial } = useShare();

  // Derive initial tab from route params
  const getInitialTab = (): TabId => {
    const p = route?.params?.type;
    if (p === "other") return "seasonal";
    return "daily";
  };

  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab());
  const [selectedSpecial, setSelectedSpecial] = useState<Special | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: specials,
    loading,
    error,
    refetch,
  } = useApiWithCache<Special[]>("active-specials", () => specialsService.getActiveSpecials());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;

  const filteredSpecials = useMemo((): Special[] => {
    if (!specials) return [];
    return specials
      .filter((s) => s.isActive && activeTabConfig.types.includes(s.type))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [specials, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    if (!specials) return {} as Record<TabId, number>;
    return TABS.reduce((acc, tab) => {
      acc[tab.id] = specials.filter((s) => s.isActive && tab.types.includes(s.type)).length;
      return acc;
    }, {} as Record<TabId, number>);
  }, [specials]);

  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Specials</Text>
        <Text style={styles.headerSubtitle}>Handcrafted deals crafted for you</Text>
      </View>

      {/* ── Category Tabs ── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          const count = tabCounts[tab.id] ?? 0;
          if (count === 0 && !loading) return null;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={active ? colors.secondary.main : colors.text.muted}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabCount, active && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary.main}
            colors={[colors.secondary.main]}
          />
        }
      >
        {/* Tab description header */}
        <View style={styles.tabHeroRow}>
          <View style={[styles.tabHeroIcon, { backgroundColor: "rgba(217,167,86,0.12)" }]}>
            <Ionicons name={activeTabConfig.icon} size={24} color={colors.secondary.main} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tabHeroTitle}>{activeTabConfig.label} Specials</Text>
            {filteredSpecials.length > 0 && (
              <Text style={styles.tabHeroCount}>{filteredSpecials.length} available</Text>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.skeletonWrap}>
            {[1, 2, 3].map((i) => <SpecialCardSkeleton key={i} />)}
          </View>
        ) : filteredSpecials.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name={activeTabConfig.icon} size={48} color={colors.border.gold} />
            <Text style={styles.emptyTitle}>No {activeTabConfig.label} Specials</Text>
            <Text style={styles.emptyDesc}>
              Check back soon — we update our specials regularly.
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {filteredSpecials.map((special) => (
              <SpecialCard
                key={special.id}
                special={special}
                onPress={() => {
                  setSelectedSpecial(special);
                  setShowModal(true);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Detail Modal ── */}
      <SpecialDetailModal
        special={selectedSpecial}
        visible={showModal}
        onClose={() => setShowModal(false)}
        onShare={(s) => {
          setShowModal(false);
          shareSpecial(s.title, s.description);
        }}
      />

      <SocialFAB />
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

  // ── Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: 3,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.secondary.main,
  },
  tabText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: colors.secondary.main,
    fontFamily: typography.fontFamily.bodySemibold,
  },
  tabCount: {
    backgroundColor: colors.border.light,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    minWidth: 18,
    alignItems: "center",
  },
  tabCountActive: {
    backgroundColor: "rgba(217,167,86,0.2)",
  },
  tabCountText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 9,
    color: colors.text.muted,
  },
  tabCountTextActive: {
    color: colors.secondary.dark,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.base },
  skeletonWrap: { paddingHorizontal: spacing.base },

  // ── Tab Hero Row
  tabHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  tabHeroIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tabHeroTitle: {
    fontFamily: typography.fontFamily.headingSemibold,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
  tabHeroCount: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },

  // ── Card List
  cardList: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },

  // ── Special Card
  card: {
    flexDirection: "row",
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: "hidden",
    alignItems: "stretch",
    ...shadows.sm,
  },
  cardImageWrap: {
    position: "relative",
  },
  cardImage: {
    width: 100,
    aspectRatio: 3 / 4,
  },
  lateNightBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: borderRadius.full,
    padding: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "center",
    gap: 4,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.headingMedium,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 21,
  },
  cardDayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardDayText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.main,
  },
  cardDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    lineHeight: 17,
  },

  // ── Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing["2xl"],
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.headingMedium,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  emptyDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius["2xl"],
    borderTopRightRadius: borderRadius["2xl"],
    maxHeight: "85%",
    ...shadows.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.gold,
    alignSelf: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalImage: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  modalBody: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  modalTypeBadge: {
    backgroundColor: "rgba(217,167,86,0.15)",
    borderWidth: 1,
    borderColor: colors.border.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  modalTypeBadgeText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.dark,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.default,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    lineHeight: 38,
    marginBottom: spacing.sm,
  },
  modalDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    lineHeight: 24,
    marginBottom: spacing.base,
  },
  modalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalMetaText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  modalCloseBtn: {
    margin: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    alignItems: "center",
  },
  modalCloseBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: "#FFFDFB",
  },
});
