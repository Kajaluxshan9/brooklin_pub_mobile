import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ImageViewer from "../components/common/ImageViewer";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  RefreshControl,
  useWindowDimensions,
  FlatList,
  Modal,
  Pressable,
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
import { menuService } from "../services/menu.service";
import { getImageUrl } from "../services/api";
import type { PrimaryCategory, MenuCategory, MenuItem } from "../types/api.types";
import { ErrorView } from "../components/common";
import { MenuItemSkeleton } from "../components/common/SkeletonLoader";
import FloatingCallButton from "../components/common/FloatingCallButton";
import { useHaptics } from "../hooks/useHaptics";
import { useScrollBottomPadding } from "../config/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type DisplayMenuItem = {
  id: string;
  name: string;
  desc: string;
  price: string;
  rawPrice: number | null;
  imageUrls?: string[];
  measurements?: any[];
  hasMeasurements?: boolean;
  dietaryInfo?: string[];
  allergens?: string[];
};

type MenuSection = {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  items: DisplayMenuItem[];
  primaryCategoryId?: string;
};

// ─── Item Detail Modal ────────────────────────────────────────────────────────

const ItemDetailModal = ({
  item,
  visible,
  onClose,
}: {
  item: DisplayMenuItem | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!item) return null;
  const imageUrl = item.imageUrls?.[0] ? getImageUrl(item.imageUrls[0]) : null;
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Image */}
          {imageUrl && (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerUri(imageUrl)}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.modalImage}
                contentFit="contain"
                transition={300}
              />
            </TouchableOpacity>
          )}

          <View style={styles.modalBody}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{item.name}</Text>
              {item.price ? (
                <Text style={styles.modalPrice}>{item.price}</Text>
              ) : null}
            </View>

            {/* Measurements */}
            {item.hasMeasurements && item.measurements && item.measurements.length > 0 && (
              <View style={styles.measurementsRow}>
                {item.measurements.map((m: any) => (
                  <View key={m.id} style={styles.measurementPill}>
                    <Text style={styles.measurementSize}>
                      {m.measurementType?.name ?? m.measurementTypeEntity?.name ?? ""}
                    </Text>
                    <Text style={styles.measurementPrice}>
                      ${parseFloat(m.price).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Description */}
            {item.desc ? (
              <Text style={styles.modalDesc}>{item.desc}</Text>
            ) : null}

            {/* Tags */}
            {((item.dietaryInfo?.length ?? 0) > 0 || (item.allergens?.length ?? 0) > 0) && (
              <View style={styles.modalTags}>
                {item.dietaryInfo?.map((tag) => (
                  <View key={tag} style={styles.dietaryTag}>
                    <Text style={styles.dietaryTagText}>{tag}</Text>
                  </View>
                ))}
                {item.allergens?.map((a) => (
                  <View key={a} style={[styles.dietaryTag, styles.allergenTag]}>
                    <Text style={[styles.dietaryTagText, styles.allergenTagText]}>{a}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.modalCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>

      <ImageViewer uri={viewerUri} visible={!!viewerUri} onClose={() => setViewerUri(null)} />
    </Modal>
  );
};

// ─── Menu Item Row ────────────────────────────────────────────────────────────

const MenuItemRow = React.memo(({
  item,
  onPress,
}: {
  item: DisplayMenuItem;
  onPress: () => void;
}) => {
  const imageUrl = item.imageUrls?.[0] ? getImageUrl(item.imageUrls[0]) : null;
  const hasDetails = !!(item.desc || item.hasMeasurements || (item.dietaryInfo?.length ?? 0) > 0);

  return (
    <TouchableOpacity
      style={styles.menuItemRow}
      onPress={onPress}
      activeOpacity={hasDetails ? 0.75 : 1}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemTextBlock}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          {item.desc ? (
            <Text style={styles.menuItemDesc} numberOfLines={2}>
              {item.desc}
            </Text>
          ) : null}
          {item.hasMeasurements &&
            item.measurements &&
            item.measurements.length > 0 && (
              <View style={styles.sizesRow}>
                {item.measurements.slice(0, 3).map((m: any) => (
                  <Text key={m.id} style={styles.sizeText}>
                    {m.measurementType?.name ??
                      m.measurementTypeEntity?.name ??
                      ""}{" "}
                    ${parseFloat(m.price).toFixed(2)}
                  </Text>
                ))}
              </View>
            )}
          {(item.dietaryInfo?.length ?? 0) > 0 && (
            <View style={styles.inlineTagsRow}>
              {item.dietaryInfo!.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.inlineTag}>
                  <Text style={styles.inlineTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.menuItemRight}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.menuItemThumb}
              contentFit="cover"
              transition={200}
              recyclingKey={`thumb-${item.id}`}
            />
          ) : null}
          {item.price ? (
            <Text style={styles.menuItemPrice}>{item.price}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Category Section ─────────────────────────────────────────────────────────

const CategorySection = React.memo(
  ({
    section,
    onItemPress,
  }: {
    section: MenuSection;
    onItemPress: (item: DisplayMenuItem) => void;
  }) => {
    const [collapsed, setCollapsed] = useState(false);
    const chevronAnim = useRef(new Animated.Value(0)).current;

    const toggleCollapse = () => {
      Animated.timing(chevronAnim, {
        toValue: collapsed ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setCollapsed((c) => !c);
    };

    const rotation = chevronAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "-90deg"],
    });

    return (
      <View style={styles.categorySection}>
        {/* Category header */}
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={toggleCollapse}
          activeOpacity={0.75}
        >
          <View style={styles.categoryHeaderLeft}>
            <Text style={styles.categoryName}>{section.name}</Text>
            {section.description ? (
              <Text style={styles.categoryDesc} numberOfLines={1}>
                {section.description}
              </Text>
            ) : null}
          </View>
          <View style={styles.categoryHeaderRight}>
            <Text style={styles.categoryCount}>
              {section.items.length} items
            </Text>
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons
                name="chevron-down"
                size={18}
                color={colors.text.muted}
              />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* Items */}
        {!collapsed && (
          <View style={styles.categoryItems}>
            {section.items.map((item, idx) => (
              <React.Fragment key={item.id}>
                <MenuItemRow item={item} onPress={() => onItemPress(item)} />
                {idx < section.items.length - 1 && (
                  <View style={styles.itemDivider} />
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    );
  },
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MenuScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const scrollBottomPad = useScrollBottomPadding();
  const { width: screenWidth } = useWindowDimensions();
  const { selection, light } = useHaptics();
  const isTablet = screenWidth >= 600;

  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DisplayMenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const searchRef = useRef<TextInput>(null);

  const initialCategory = route?.params?.category;

  // Data fetching
  const { data: primaryCategories, loading: pcLoading, error: pcError, refetch: pcRefetch } =
    useApiWithCache<PrimaryCategory[]>("primary-categories", () => menuService.getPrimaryCategories());

  const { data: allCategories, loading: catLoading } =
    useApiWithCache<MenuCategory[]>("menu-categories", () => menuService.getCategories());

  const { data: allMenuItems, loading: itemsLoading, refetch: itemsRefetch } =
    useApiWithCache<MenuItem[]>("all-menu-items", () => menuService.getAllMenuItems());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([pcRefetch(), itemsRefetch()]);
    setRefreshing(false);
  }, [pcRefetch, itemsRefetch]);

  const activePrimaryCategories = useMemo(
    () => (primaryCategories?.filter((p) => p.isActive) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    [primaryCategories],
  );

  // Auto-select first category
  useEffect(() => {
    if (activePrimaryCategories.length > 0 && !selectedPrimaryId) {
      if (initialCategory) {
        const match = activePrimaryCategories.find(
          (p) => p.name.toLowerCase().replace(/\s+/g, "-") === initialCategory.toLowerCase(),
        );
        if (match) { setSelectedPrimaryId(match.id); return; }
      }
      setSelectedPrimaryId(activePrimaryCategories[0].id);
    }
  }, [activePrimaryCategories, initialCategory]);

  // Build menu sections
  const menuSections = useMemo((): MenuSection[] => {
    if (!allCategories || !allMenuItems) return [];

    return allCategories
      .filter((cat) => cat.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => {
        const items = allMenuItems
          .filter((item) => item.categoryId === category.id && item.isAvailable)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            id: item.id,
            name: item.name,
            desc: item.description || "",
            price: (!item.hasMeasurements && item.price != null && item.price > 0)
              ? `$${item.price.toFixed(2)}`
              : "",
            rawPrice: item.price,
            imageUrls: item.imageUrls,
            measurements: item.measurements,
            hasMeasurements: item.hasMeasurements,
            dietaryInfo: item.dietaryInfo,
            allergens: item.allergens,
          } as DisplayMenuItem));

        return {
          categoryId: category.id,
          name: category.name,
          description: category.description,
          imageUrl: category.imageUrl,
          items,
          primaryCategoryId: category.primaryCategoryId,
        } as MenuSection;
      })
      .filter((s) => s.items.length > 0);
  }, [allCategories, allMenuItems]);

  // Filter sections
  const filteredSections = useMemo(() => {
    let result = !selectedPrimaryId
      ? menuSections
      : menuSections.filter((s) => s.primaryCategoryId === selectedPrimaryId);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result
        .map((s) => ({
          ...s,
          items: s.items.filter(
            (item) => item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q),
          ),
        }))
        .filter((s) => s.items.length > 0);
    }

    return result;
  }, [menuSections, selectedPrimaryId, searchQuery]);

  const isLoading = pcLoading || catLoading || itemsLoading;
  const selectedPrimary = activePrimaryCategories.find((p) => p.id === selectedPrimaryId);

  const handleItemPress = useCallback(
    (item: DisplayMenuItem) => {
      if (
        item.desc ||
        item.hasMeasurements ||
        (item.dietaryInfo?.length ?? 0) > 0
      ) {
        light();
        setSelectedItem(item);
        setShowItemModal(true);
      }
    },
    [light],
  );

  if (pcError) return <ErrorView message={pcError} onRetry={pcRefetch} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>
            {selectedPrimary ? selectedPrimary.name : "Our Menu"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredSections.reduce((acc, s) => acc + s.items.length, 0)} items
          </Text>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.text.muted} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search dishes, drinks..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Primary Category Chips ── */}
      {activePrimaryCategories.length > 0 && (
        <View style={styles.chipContainer}>
          <FlatList
            horizontal
            data={activePrimaryCategories}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScrollContent}
            renderItem={({ item }) => {
              const active = item.id === selectedPrimaryId;
              return (
                <TouchableOpacity
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    selection();
                    setSelectedPrimaryId(item.id);
                    setSearchQuery("");
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* ── Menu Content ── */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentInner,
          { paddingBottom: scrollBottomPad },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary.main}
            colors={[colors.secondary.main]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4].map((i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </View>
        ) : filteredSections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={44}
              color={colors.border.gold}
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No results found" : "No items available"}
            </Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? `No menu items match "${searchQuery}"`
                : "Check back soon for updates."}
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          filteredSections.map((section) => (
            <CategorySection
              key={section.categoryId}
              section={section}
              onItemPress={handleItemPress}
            />
          ))
        )}
      </ScrollView>

      {/* ── Item Detail Modal ── */}
      <ItemDetailModal
        item={selectedItem}
        visible={showItemModal}
        onClose={() => setShowItemModal(false)}
      />

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
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  headerTextBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
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
  },

  // ── Search
  searchRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    padding: 0,
    margin: 0,
  },

  // ── Chips
  chipContainer: {
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  chipScrollContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm - 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.paper,
    borderWidth: 1.5,
    borderColor: colors.border.light,
  },
  chipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
    ...shadows.sm,
  },
  chipText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    letterSpacing: 0.2,
  },
  chipTextActive: {
    color: colors.secondary.main,
  },

  // ── Content
  content: {
    flex: 1,
  },
  contentInner: {
    paddingTop: spacing.base,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.base,
  },

  // ── Category Section
  categorySection: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: "hidden",
    ...shadows.sm,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  categoryHeaderLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  categoryName: {
    fontFamily: typography.fontFamily.headingSemibold,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },
  categoryDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  categoryHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryCount: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  categoryItems: {},

  // ── Menu Item Row
  menuItemRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  menuItemTextBlock: {
    flex: 1,
  },
  menuItemName: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: 3,
  },
  menuItemDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    lineHeight: 18,
    marginBottom: 4,
  },
  menuItemRight: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  menuItemThumb: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
  },
  menuItemPrice: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
  },
  sizesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
  },
  sizeText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.dark,
    backgroundColor: "rgba(217,167,86,0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  inlineTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  inlineTag: {
    backgroundColor: "rgba(106,58,30,0.08)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  inlineTagText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 10,
    color: colors.text.muted,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: spacing.base,
  },

  // ── Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing["4xl"],
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
  clearSearchBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.full,
  },
  clearSearchText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#FFFDFB",
  },

  // ── Item Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.base,
    gap: spacing.md,
  },
  modalTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.headingSemibold,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    lineHeight: 30,
  },
  modalPrice: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.primary.main,
  },
  measurementsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  measurementPill: {
    backgroundColor: "rgba(217,167,86,0.12)",
    borderWidth: 1,
    borderColor: colors.border.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: "center",
    gap: 2,
  },
  measurementSize: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  measurementPrice: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
  },
  modalDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    lineHeight: 23,
    marginBottom: spacing.base,
  },
  modalTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  dietaryTag: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  dietaryTagText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: "#166534",
  },
  allergenTag: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.3)",
  },
  allergenTagText: {
    color: "#92400E",
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
