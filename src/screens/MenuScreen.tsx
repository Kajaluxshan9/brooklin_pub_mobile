import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Modal,
  Animated,
  RefreshControl,
  TextInput,
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
import type {
  PrimaryCategory,
  MenuCategory,
  MenuItem,
} from "../types/api.types";
import {
  SectionHeader,
  GoldDivider,
  GlassCard,
  CornerAccents,
  ErrorView,
  InfoChip,
} from "../components/common";
import PageHeader from "../components/common/PageHeader";
import SocialFAB from "../components/common/SocialFAB";
import { useHaptics } from "../hooks/useHaptics";
import { MenuItemSkeleton } from "../components/common/SkeletonLoader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Card color schemes matching frontend's rotating gradient pattern
const CARD_COLORS = [
  { bg: ["#6A3A1E", "#4A2C17"] as const, accent: "#D9A756" },
  { bg: ["#D9A756", "#B08030"] as const, accent: "#FDF8F3" },
  { bg: ["#4A2C17", "#3A2212"] as const, accent: "#C5933E" },
];

// Type for the transformed menu entry (matching frontend's MenuEntry)
type MenuEntry = {
  mainImage: string;
  name: string;
  menuItems: DisplayMenuItem[];
  description?: string;
  categoryId?: string;
  primaryCategoryId?: string;
};

type DisplayMenuItem = {
  id: string;
  name: string;
  desc: string;
  price: string;
  rawPrice: number | null;
  image?: string;
  measurements?: any[];
  hasMeasurements?: boolean;
  dietaryInfo?: string[];
  allergens?: string[];
  imageUrls?: string[];
};

/* ─── Animated Card Wrapper (staggered entrance like frontend cardVariants) ─── */
const AnimatedCard = ({
  children,
  index,
  onPress,
}: {
  children: React.ReactNode;
  index: number;
  onPress: () => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 100;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MenuScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { selection, light } = useHaptics();
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<MenuEntry | null>(
    null,
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DisplayMenuItem | null>(
    null,
  );
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // URL params from navigation
  const initialCategory = route?.params?.category;

  // Fetch primary categories
  const {
    data: primaryCategories,
    loading: pcLoading,
    error: pcError,
    refetch: pcRefetch,
  } = useApiWithCache<PrimaryCategory[]>("primary-categories", () =>
    menuService.getPrimaryCategories(),
  );

  // Fetch all categories
  const { data: allCategories, loading: catLoading } = useApiWithCache<
    MenuCategory[]
  >("menu-categories", () => menuService.getCategories());

  // Fetch all menu items
  const { data: allMenuItems, loading: itemsLoading, refetch: itemsRefetch } = useApiWithCache<
    MenuItem[]
  >("all-menu-items", () => menuService.getAllMenuItems());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([pcRefetch(), itemsRefetch()]);
    setRefreshing(false);
  }, [pcRefetch, itemsRefetch]);

  // Auto-select first primary category
  useEffect(() => {
    if (
      primaryCategories &&
      primaryCategories.length > 0 &&
      !selectedPrimaryId
    ) {
      const active = primaryCategories.filter((p) => p.isActive);
      if (active.length > 0) {
        if (initialCategory) {
          const match = active.find(
            (p) =>
              p.name.toLowerCase().replace(/\s+/g, "-") ===
              initialCategory.toLowerCase(),
          );
          if (match) {
            setSelectedPrimaryId(match.id);
            return;
          }
        }
        setSelectedPrimaryId(active[0].id);
      }
    }
  }, [primaryCategories, initialCategory]);

  const activePrimaryCategories = useMemo(
    () => primaryCategories?.filter((p) => p.isActive) ?? [],
    [primaryCategories],
  );

  const selectedPrimary = activePrimaryCategories.find(
    (p) => p.id === selectedPrimaryId,
  );

  // Dynamic hero title/subtitle matching frontend
  const heroTitle = selectedPrimary ? selectedPrimary.name : "Our Menu";
  const heroSubtitle = selectedPrimary
    ? `Explore our ${selectedPrimary.name.toLowerCase()} selection`
    : "Fresh ingredients, timeless recipes, unforgettable flavors";

  // Check if direct-display category (desserts/kids)
  const isDirectDisplay =
    selectedPrimary?.name?.toLowerCase().includes("dessert") ||
    selectedPrimary?.name?.toLowerCase().includes("kid");

  // Transform backend data to menu entries (matching frontend pattern)
  const transformedMenuData = useMemo((): MenuEntry[] => {
    if (!allCategories || !allMenuItems) return [];

    return allCategories
      .filter((cat) => cat.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => {
        const categoryItems = allMenuItems
          .filter((item) => item.categoryId === category.id && item.isAvailable)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => {
            let priceDisplay = "";
            if (!item.hasMeasurements && item.price != null && item.price > 0) {
              priceDisplay = `$${item.price.toFixed(2)}`;
            }
            return {
              id: item.id,
              name: item.name,
              desc: item.description || "",
              price: priceDisplay,
              rawPrice: item.price,
              image: item.imageUrls?.[0],
              measurements: item.measurements,
              hasMeasurements: item.hasMeasurements,
              dietaryInfo: item.dietaryInfo,
              allergens: item.allergens,
              imageUrls: item.imageUrls,
            } as DisplayMenuItem;
          });

        return {
          mainImage: category.imageUrl || categoryItems[0]?.image || "",
          name: category.name,
          description: category.description || "",
          menuItems: categoryItems,
          categoryId: category.id,
          primaryCategoryId: category.primaryCategoryId,
        } as MenuEntry;
      })
      .filter((entry) => entry.menuItems.length > 0);
  }, [allCategories, allMenuItems]);

  // Filter by selected primary category
  const filteredMenu = useMemo(() => {
    let result = !selectedPrimaryId
      ? transformedMenuData
      : transformedMenuData.filter(
          (entry) => entry.primaryCategoryId === selectedPrimaryId,
        );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result
        .map((entry) => ({
          ...entry,
          menuItems: entry.menuItems.filter(
            (item) =>
              item.name.toLowerCase().includes(q) ||
              item.desc.toLowerCase().includes(q),
          ),
        }))
        .filter((entry) => entry.menuItems.length > 0);
    }

    return result;
  }, [transformedMenuData, selectedPrimaryId, searchQuery]);

  // Direct display items for desserts/kids
  const directDisplayItems = useMemo((): DisplayMenuItem[] => {
    if (!isDirectDisplay || !allMenuItems || !allCategories) return [];
    const categoryIds = allCategories
      .filter(
        (cat) => cat.primaryCategoryId === selectedPrimaryId && cat.isActive,
      )
      .map((cat) => cat.id);
    return allMenuItems
      .filter(
        (item) => categoryIds.includes(item.categoryId) && item.isAvailable,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        let priceDisplay = "";
        if (!item.hasMeasurements && item.price != null && item.price > 0) {
          priceDisplay = `$${item.price.toFixed(2)}`;
        }
        return {
          id: item.id,
          name: item.name,
          desc: item.description || "",
          price: priceDisplay,
          rawPrice: item.price,
          image: item.imageUrls?.[0],
          measurements: item.measurements,
          hasMeasurements: item.hasMeasurements,
          dietaryInfo: item.dietaryInfo,
          allergens: item.allergens,
          imageUrls: item.imageUrls,
        } as DisplayMenuItem;
      });
  }, [isDirectDisplay, allMenuItems, allCategories, selectedPrimaryId]);

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "";
    return `$${price.toFixed(2)}`;
  };

  if (pcError) return <ErrorView message={pcError} onRetry={pcRefetch} />;
  const isLoading = pcLoading || catLoading || itemsLoading;

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
          title={heroTitle}
          subtitle={heroSubtitle}
          icon="restaurant-outline"
        />

        {isLoading ? (
          <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.xl }}>
            {[1, 2, 3, 4].map((i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </View>
        ) : (
        <>
        {/* ========== SEARCH BAR ========== */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={18} color={colors.text.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search menu items..."
              placeholderTextColor={colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ========== PRIMARY CATEGORY TABS ========== */}
        <View style={styles.primaryTabsSection}>
          <FlatList
            horizontal
            data={activePrimaryCategories}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.primaryTabsList}
            renderItem={({ item }) => {
              const isActive = item.id === selectedPrimaryId;
              return (
                <TouchableOpacity
                  style={[
                    styles.primaryTab,
                    isActive && styles.primaryTabActive,
                  ]}
                  onPress={() => { selection(); setSelectedPrimaryId(item.id); }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.primaryTabImageWrap,
                      isActive && styles.primaryTabImageWrapActive,
                    ]}
                  >
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: getImageUrl(item.imageUrl) }}
                        style={styles.primaryTabImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <LinearGradient
                        colors={
                          isActive
                            ? [colors.secondary.main, colors.secondary.dark]
                            : ["#E8D5C4", "#D9C4B0"]
                        }
                        style={[
                          styles.primaryTabImage,
                          styles.primaryTabInitial,
                        ]}
                      >
                        <Text
                          style={[
                            styles.primaryTabInitialText,
                            isActive && styles.primaryTabInitialTextActive,
                          ]}
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.primaryTabLabel,
                      isActive && styles.primaryTabLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* ========== SEARCH RESULT COUNT ========== */}
        {searchQuery.trim().length > 0 && !isLoading && (
          <View style={styles.searchResultBar}>
            <Text style={styles.searchResultText}>
              {isDirectDisplay
                ? directDisplayItems.length === 0
                  ? `No results for "${searchQuery}"`
                  : `${directDisplayItems.length} result${directDisplayItems.length !== 1 ? "s" : ""} for "${searchQuery}"`
                : filteredMenu.length === 0
                  ? `No results for "${searchQuery}"`
                  : `${filteredMenu.reduce((sum, e) => sum + e.menuItems.length, 0)} item${filteredMenu.reduce((sum, e) => sum + e.menuItems.length, 0) !== 1 ? "s" : ""} found`}
            </Text>
            {(isDirectDisplay ? directDisplayItems.length === 0 : filteredMenu.length === 0) && (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.searchResultClear}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ========== SEARCH EMPTY STATE ========== */}
        {searchQuery.trim().length > 0 && !isLoading &&
          (isDirectDisplay ? directDisplayItems.length === 0 : filteredMenu.length === 0) && (
          <View style={styles.searchEmptyState}>
            <Ionicons name="search-outline" size={40} color={colors.text.muted} />
            <Text style={styles.searchEmptyTitle}>No items found</Text>
            <Text style={styles.searchEmptyText}>
              Try searching for something else, or browse a different category
            </Text>
          </View>
        )}

        {/* ========== MENU CONTENT ========== */}
        {isDirectDisplay ? (
          /* Direct display for desserts/kids — floating card style */
          <View style={styles.categoryGrid}>
            {directDisplayItems.map((item, idx) => {
              const colorScheme = CARD_COLORS[idx % CARD_COLORS.length];
              return (
                <AnimatedCard
                  key={item.id}
                  index={idx}
                  onPress={() => {
                    setSelectedItem(item);
                    setShowItemModal(true);
                  }}
                >
                  {/* Floating Image */}
                  <View style={styles.categoryCardImageWrap}>
                    {item.image ? (
                      <Image
                        source={{ uri: getImageUrl(item.image) }}
                        style={styles.categoryCardImage}
                        contentFit="contain"
                        transition={300}
                      />
                    ) : (
                      <View style={styles.categoryCardPlaceholder}>
                        <Ionicons
                          name="restaurant-outline"
                          size={40}
                          color={colorScheme.accent}
                        />
                      </View>
                    )}
                    <View style={styles.categoryCardShadow} />
                  </View>

                  {/* Name in cursive */}
                  <View style={styles.categoryCardNameWrap}>
                    <Text style={styles.categoryCardName}>{item.name}</Text>
                  </View>

                  {/* Price */}
                  {item.price ? (
                    <LinearGradient
                      colors={["#6A3A1E", "#4A2C17"]}
                      style={styles.priceBadge}
                    >
                      <Text style={styles.priceBadgeText}>{item.price}</Text>
                    </LinearGradient>
                  ) : null}

                  {/* Divider between cards */}
                  {idx < directDisplayItems.length - 1 && (
                    <View style={styles.cardDivider}>
                      <LinearGradient
                        colors={["transparent", "#D9A756", "transparent"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.cardDividerLine}
                      />
                      <View style={styles.cardDividerDot} />
                      <LinearGradient
                        colors={["transparent", "#D9A756", "transparent"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.cardDividerLine}
                      />
                    </View>
                  )}
                </AnimatedCard>
              );
            })}
          </View>
        ) : (
          /* ========== Premium Category Grid (matching frontend) ========== */
          <View style={styles.categoryGrid}>
            {filteredMenu.map((entry, idx) => {
              const colorScheme = CARD_COLORS[idx % CARD_COLORS.length];
              return (
                <AnimatedCard
                  key={entry.categoryId || idx.toString()}
                  index={idx}
                  onPress={() => {
                    setSelectedCategory(entry);
                    setShowCategoryModal(true);
                  }}
                >
                  {/* Floating Image */}
                  <View style={styles.categoryCardImageWrap}>
                    {entry.mainImage ? (
                      <Image
                        source={{ uri: getImageUrl(entry.mainImage) }}
                        style={styles.categoryCardImage}
                        contentFit="contain"
                        transition={300}
                      />
                    ) : (
                      <View style={styles.categoryCardPlaceholder}>
                        <Ionicons
                          name="restaurant-outline"
                          size={48}
                          color={colorScheme.accent}
                        />
                      </View>
                    )}
                    <View style={styles.categoryCardShadow} />
                  </View>

                  {/* Category Name in cursive (Great Vibes) */}
                  <View style={styles.categoryCardNameWrap}>
                    <Text style={styles.categoryCardName}>{entry.name}</Text>
                  </View>

                  {/* Item count badge */}
                  <View style={styles.categoryCardCountBadge}>
                    <Text style={styles.categoryCardCount}>
                      {entry.menuItems.length} Items
                    </Text>
                  </View>

                  {/* Explore indicator */}
                  <View style={styles.exploreRow}>
                    <Text style={styles.exploreText}>Explore</Text>
                    <Ionicons name="arrow-forward" size={14} color="#D9A756" />
                  </View>

                  {/* Divider between cards */}
                  {idx < filteredMenu.length - 1 && (
                    <View style={styles.cardDivider}>
                      <LinearGradient
                        colors={["transparent", "#D9A756", "transparent"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.cardDividerLine}
                      />
                      <View style={styles.cardDividerDot} />
                      <LinearGradient
                        colors={["transparent", "#D9A756", "transparent"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.cardDividerLine}
                      />
                    </View>
                  )}
                </AnimatedCard>
              );
            })}
          </View>
        )}

        </>
        )}

      </ScrollView>

      {/* ========== CATEGORY DETAIL MODAL (matching frontend Dialog) ========== */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.categoryModalOverlay}>
          <View
            style={[styles.categoryModalContent, { paddingTop: insets.top }]}
          >
            {/* Close button */}
            <TouchableOpacity
              style={styles.categoryModalClose}
              onPress={() => setShowCategoryModal(false)}
            >
              <View style={styles.categoryModalCloseInner}>
                <Ionicons name="close" size={22} color="#FFFDFB" />
              </View>
            </TouchableOpacity>

            {/* Full-bleed image header */}
            <View style={styles.categoryModalImageHeader}>
              {selectedCategory?.mainImage ? (
                <Image
                  source={{ uri: getImageUrl(selectedCategory.mainImage) }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary.dark, colors.primary.main]}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <LinearGradient
                colors={["rgba(60,31,14,0.3)", "rgba(40,20,8,0.85)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.categoryModalImageHeaderContent}>
                <View style={styles.categoryModalFlourish}>
                  <LinearGradient
                    colors={["transparent", "#D9A756"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.flourishLine}
                  />
                  <View style={styles.flourishDot} />
                  <LinearGradient
                    colors={["#D9A756", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.flourishLine}
                  />
                </View>
                <Text style={styles.categoryModalTitle}>
                  {selectedCategory?.name}
                </Text>
                {selectedCategory?.description ? (
                  <Text style={styles.categoryModalDesc}>
                    {selectedCategory.description}
                  </Text>
                ) : null}
              </View>
              {/* Gold bottom accent */}
              <LinearGradient
                colors={["transparent", "#D9A756", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.categoryModalTopAccentLine}
              />
            </View>

            {/* Menu Items list */}
            <ScrollView
              style={styles.categoryModalScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.categoryModalScrollContent}
            >
              {(selectedCategory?.menuItems || []).map((mi, i) => (
                <TouchableOpacity
                  key={mi.id || i.toString()}
                  style={styles.dialogItemCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedItem(mi);
                    setShowItemModal(true);
                  }}
                >
                  {/* Gold left accent bar */}
                  <View style={styles.dialogItemAccent} />

                  {/* Item Header — name + price badge */}
                  <View style={styles.dialogItemHeader}>
                    <Text style={styles.dialogItemName} numberOfLines={2}>
                      {mi.name}
                    </Text>
                    {!mi.hasMeasurements && mi.price ? (
                      <LinearGradient
                        colors={["#6A3A1E", "#4A2C17"]}
                        style={styles.dialogPriceBadge}
                      >
                        <Text style={styles.dialogPriceText}>{mi.price}</Text>
                      </LinearGradient>
                    ) : null}
                  </View>

                  {/* Description */}
                  {mi.desc ? (
                    <Text style={styles.dialogItemDesc} numberOfLines={3}>
                      {mi.desc}
                    </Text>
                  ) : null}

                  {/* Measurements chips */}
                  {mi.hasMeasurements &&
                    mi.measurements &&
                    mi.measurements.length > 0 && (
                      <View style={styles.dialogMeasurementRow}>
                        {mi.measurements
                          .filter((m: any) => m.price > 0)
                          .sort(
                            (a: any, b: any) =>
                              (a.sortOrder || 0) - (b.sortOrder || 0),
                          )
                          .map((m: any, idx: number) => (
                            <View
                              key={idx}
                              style={styles.dialogMeasurementChip}
                            >
                              <Text style={styles.dialogMeasurementName}>
                                {m.measurementType?.name ||
                                  m.measurementTypeEntity?.name ||
                                  "Size"}
                              </Text>
                              <View style={styles.dialogMeasurementDivider} />
                              <Text style={styles.dialogMeasurementPrice}>
                                ${m.price.toFixed(2)}
                              </Text>
                            </View>
                          ))}
                      </View>
                    )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Bottom decorative accent */}
            <View style={styles.categoryModalBottomAccent}>
              <LinearGradient
                colors={[
                  "transparent",
                  "#D9A756",
                  "#B08030",
                  "#D9A756",
                  "transparent",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.categoryModalBottomAccentLine}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== ITEM DETAIL MODAL ========== */}
      <Modal
        visible={showItemModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowItemModal(false)}
      >
        <View style={styles.itemModalOverlay}>
          <View style={styles.itemModalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.itemModalClose}
              onPress={() => setShowItemModal(false)}
            >
              <View style={styles.itemModalCloseInner}>
                <Ionicons name="close" size={20} color={colors.text.light} />
              </View>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Image */}
              {selectedItem?.imageUrls?.[0] && (
                <View style={styles.itemModalImageWrap}>
                  <Image
                    source={{ uri: getImageUrl(selectedItem.imageUrls[0]) }}
                    style={styles.itemModalImage}
                    contentFit="cover"
                    transition={300}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.5)"]}
                    style={styles.itemModalImageOverlay}
                  />
                </View>
              )}

              <View style={styles.itemModalBody}>
                {/* Title + Price */}
                <View style={styles.itemModalHeader}>
                  <Text style={styles.itemModalTitle}>
                    {selectedItem?.name}
                  </Text>
                  {selectedItem?.rawPrice !== null &&
                    selectedItem?.rawPrice !== undefined &&
                    !selectedItem?.hasMeasurements && (
                      <LinearGradient
                        colors={["#6A3A1E", "#4A2C17"]}
                        style={styles.itemModalPriceBadge}
                      >
                        <Text style={styles.itemModalPriceText}>
                          {formatPrice(selectedItem.rawPrice)}
                        </Text>
                      </LinearGradient>
                    )}
                </View>

                <GoldDivider width="100%" marginVertical={spacing.md} />

                {/* Description */}
                {selectedItem?.desc && (
                  <Text style={styles.itemModalDesc}>{selectedItem.desc}</Text>
                )}

                {/* Measurements */}
                {selectedItem?.hasMeasurements &&
                  selectedItem.measurements &&
                  selectedItem.measurements.length > 0 && (
                    <View style={styles.itemModalMeasurements}>
                      <Text style={styles.itemModalSectionTitle}>
                        Sizes & Prices
                      </Text>
                      {selectedItem.measurements
                        .filter((m: any) => m.price > 0)
                        .sort(
                          (a: any, b: any) =>
                            (a.sortOrder || 0) - (b.sortOrder || 0),
                        )
                        .map((m: any, i: number) => (
                          <View key={i} style={styles.itemModalMeasRow}>
                            <Text style={styles.itemModalMeasName}>
                              {m.measurementType?.name ||
                                m.measurementTypeEntity?.name ||
                                ""}
                            </Text>
                            <View style={styles.itemModalMeasDots} />
                            <Text style={styles.itemModalMeasPrice}>
                              ${m.price.toFixed(2)}
                            </Text>
                          </View>
                        ))}
                    </View>
                  )}

                {/* Tags */}
                <View style={styles.itemModalTags}>
                  {selectedItem?.dietaryInfo?.map((d: string, i: number) => (
                    <InfoChip key={`d-${i}`} label={d} variant="gold" />
                  ))}
                  {selectedItem?.allergens?.map((a: string, i: number) => (
                    <InfoChip key={`a-${i}`} label={a} variant="muted" />
                  ))}
                </View>

                {/* Additional images */}
                {selectedItem?.imageUrls &&
                  selectedItem.imageUrls.length > 1 && (
                    <FlatList
                      horizontal
                      data={selectedItem.imageUrls.slice(1)}
                      keyExtractor={(_, i) => `extra-${i}`}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.itemModalExtraImages}
                      renderItem={({ item: imgUrl }) => (
                        <View style={styles.itemModalExtraImageWrap}>
                          <Image
                            source={{ uri: getImageUrl(imgUrl) }}
                            style={styles.itemModalExtraImage}
                            contentFit="cover"
                            transition={200}
                          />
                        </View>
                      )}
                    />
                  )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Floating call FAB */}
      <SocialFAB />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.default,
  },

  /* -------- Primary Tabs -------- */
  searchResultBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    paddingTop: 2,
  },
  searchResultText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  searchResultClear: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.secondary.main,
  },
  searchEmptyState: {
    alignItems: "center",
    paddingVertical: spacing["2xl"] * 2,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  searchEmptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
  searchEmptyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.6,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.default,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.gold,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    padding: 0,
  },
  primaryTabsSection: {
    backgroundColor: colors.background.default,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.gold,
  },
  primaryTabsList: {
    paddingHorizontal: spacing.base,
    gap: spacing.lg,
  },
  primaryTab: {
    alignItems: "center",
    width: 72,
  },
  primaryTabActive: {},
  primaryTabImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(217,167,86,0.2)",
    marginBottom: spacing.sm,
  },
  primaryTabImageWrapActive: {
    borderColor: colors.secondary.main,
    borderWidth: 2.5,
    ...shadows.gold,
  },
  primaryTabImage: {
    width: "100%",
    height: "100%",
  },
  primaryTabInitial: {
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTabInitialText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 22,
    color: colors.primary.dark,
    letterSpacing: 0.5,
  },
  primaryTabInitialTextActive: {
    color: "#FFFFFF",
  },
  primaryTabLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  primaryTabLabelActive: {
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bodySemibold,
  },

  /* ========== Category Card Grid ========== */
  categoryGrid: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xl,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  categoryCard: {
    alignItems: "center",
    position: "relative",
    width: "100%",
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryCardImageWrap: {
    width: SCREEN_WIDTH * 0.55,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  categoryCardImage: {
    width: "90%",
    height: "90%",
  },
  categoryCardPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.glass.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryCardShadow: {
    position: "absolute",
    bottom: -5,
    left: "20%",
    width: "60%",
    height: 12,
    backgroundColor: "rgba(0,0,0,0.12)",
    borderRadius: 100,
  },
  categoryCardNameWrap: {
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  categoryCardName: {
    fontFamily: typography.fontFamily.accent,
    fontSize: 34,
    color: "#4A2C17",
    textAlign: "center",
    lineHeight: 42,
  },
  categoryCardCountBadge: {
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.35)",
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.sm,
    backgroundColor: "rgba(217,167,86,0.07)",
  },
  categoryCardCount: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.main,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  exploreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs,
  },
  exploreText: {
    fontFamily: typography.fontFamily.headingSemibold,
    fontSize: typography.fontSize.base,
    color: colors.secondary.main,
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  /* Card Dividers */
  cardDivider: {
    flexDirection: "row",
    alignItems: "center",
    width: "70%",
    gap: spacing.sm,
    marginTop: spacing["2xl"],
  },
  cardDividerLine: {
    flex: 1,
    height: 1,
  },
  cardDividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary.main,
  },

  /* Price badge (shared) */
  priceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.base,
    ...shadows.sm,
  },
  priceBadgeText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.base,
    color: colors.background.default,
  },

  /* ========== Category Modal (Dialog Popup) ========== */
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.medium,
  },
  categoryModalContent: {
    flex: 1,
    backgroundColor: colors.background.default,
    position: "relative",
  },
  categoryModalClose: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 20,
  },
  categoryModalCloseInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(40,20,8,0.65)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.4)",
    ...shadows.sm,
  },
  categoryModalTopAccent: {
    alignItems: "center",
    paddingTop: spacing.xs,
  },
  categoryModalTopAccentLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  categoryModalImageHeader: {
    height: 180,
    position: "relative",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  categoryModalImageHeaderContent: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  categoryModalHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.overlay.creamStrong,
  },
  categoryModalFlourish: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  flourishLine: {
    width: 60,
    height: 1,
  },
  flourishDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary.main,
  },
  categoryModalTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 30,
    color: "#FFFDFB",
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
    lineHeight: 36,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  categoryModalDesc: {
    fontFamily: typography.fontFamily.headingMedium,
    fontSize: typography.fontSize.sm,
    color: "rgba(255,253,251,0.8)",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  categoryModalScroll: {
    flex: 1,
  },
  categoryModalScrollContent: {
    padding: spacing.base,
    paddingTop: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing["3xl"],
  },
  categoryModalBottomAccent: {
    paddingBottom: spacing.xs,
  },
  categoryModalBottomAccentLine: {
    width: "100%",
    height: 4,
  },

  /* ========== Dialog Item Cards ========== */
  dialogItemCard: {
    position: "relative",
    padding: spacing.lg,
    paddingLeft: spacing.lg + 4,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: "hidden",
    ...shadows.sm,
  },
  dialogItemAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
    backgroundColor: colors.secondary.main,
    opacity: 0.6,
  },
  dialogItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dialogItemName: {
    flex: 1,
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: "#4A2C17",
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  dialogPriceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.base,
    ...shadows.sm,
  },
  dialogPriceText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.base,
    color: colors.background.default,
  },
  dialogItemDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(74, 44, 23, 0.75)",
    lineHeight: 20,
    letterSpacing: 0.3,
    marginBottom: spacing.sm,
  },
  dialogMeasurementRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dialogMeasurementChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass.gold,
    borderWidth: 1,
    borderColor: colors.border.goldStrong,
    gap: spacing.sm,
  },
  dialogMeasurementName: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 11,
    color: colors.primary.main,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  dialogMeasurementDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(106, 58, 30, 0.3)",
  },
  dialogMeasurementPrice: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.sm,
    color: "#4A2C17",
  },

  /* ========== Item Detail Modal ========== */
  itemModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  itemModalContent: {
    backgroundColor: colors.background.default,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: "90%",
    overflow: "hidden",
  },
  itemModalClose: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  itemModalCloseInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.overlay.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  itemModalImageWrap: {
    width: "100%",
    height: 250,
    position: "relative",
  },
  itemModalImage: {
    width: "100%",
    height: "100%",
  },
  itemModalImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  itemModalBody: {
    padding: spacing.xl,
  },
  itemModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  itemModalTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
  },
  itemModalPriceBadge: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
    ...shadows.base,
  },
  itemModalPriceText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.background.default,
  },
  itemModalDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    lineHeight: typography.fontSize.base * 1.7,
    marginBottom: spacing.lg,
  },
  itemModalMeasurements: {
    marginBottom: spacing.lg,
  },
  itemModalSectionTitle: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.secondary.main,
    marginBottom: spacing.md,
  },
  itemModalMeasRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217,167,86,0.1)",
  },
  itemModalMeasName: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  itemModalMeasDots: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217,167,86,0.2)",
    borderStyle: "dotted",
    marginHorizontal: spacing.sm,
  },
  itemModalMeasPrice: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: typography.fontSize.base,
    color: colors.secondary.main,
  },
  itemModalTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  itemModalExtraImages: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  itemModalExtraImageWrap: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.gold,
  },
  itemModalExtraImage: {
    width: "100%",
    height: "100%",
  },
});
