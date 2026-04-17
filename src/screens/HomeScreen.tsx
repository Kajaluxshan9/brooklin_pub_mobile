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
  TouchableOpacity,
  Linking,
  Animated,
  RefreshControl,
  useWindowDimensions,
  ImageBackground,
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
import { EXTERNAL_URLS, CONTACT_INFO } from "../config/constants";
import { useApiWithCache } from "../hooks/useApi";
import { useVisibleSpecials } from "../hooks/useVisibleSpecials";
import { eventsService } from "../services/events.service";
import { openingHoursService } from "../services/opening-hours.service";
import { getImageUrl } from "../services/api";
import type { Event, OpeningHoursStatus } from "../types/api.types";
import { GoldDivider } from "../components/common";
import { EventCardSkeleton, SpecialCardSkeleton } from "../components/common/SkeletonLoader";
import { useHaptics } from "../hooks/useHaptics";
import NewsletterForm from "../components/common/NewsletterForm";
import { useScrollBottomPadding } from "../config/layout";

// ─── Hero images ────────────────────────────────────────────────────────────
const HERO_IMAGES = [
  require("../assets/images/landing/item1.jpg"),
  require("../assets/images/landing/item3.jpg"),
  require("../assets/images/landing/item5.jpg"),
  require("../assets/images/landing/item7.jpg"),
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatEventDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Toronto",
  });

const formatEventTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });

const shouldDisplayEvent = (event: Event): boolean => {
  if (!event.isActive) return false;
  const now = new Date();
  if (event.displayStartDate && event.displayEndDate) {
    return now >= new Date(event.displayStartDate) && now <= new Date(event.displayEndDate);
  }
  return true;
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  live_music: "Live Music",
  sports_viewing: "Sports",
  trivia_night: "Trivia",
  karaoke: "Karaoke",
  private_party: "Private Event",
  special_event: "Special Event",
};

const EVENT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  live_music: "musical-notes",
  sports_viewing: "football",
  trivia_night: "help-circle",
  karaoke: "mic",
  private_party: "people",
  special_event: "star",
};

// ─── Specials Popup ───────────────────────────────────────────────────────────

const SpecialsPopup = ({
  specials,
  visible,
  onClose,
  onViewAll,
}: {
  specials: any[];
  visible: boolean;
  onClose: () => void;
  onViewAll: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideFade = useRef(new Animated.Value(1)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const [posterRatio, setPosterRatio] = useState<number>(3 / 4);

  // Entrance animation
  useEffect(() => {
    if (visible) {
      setActiveIndex(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  // Auto-advance carousel
  useEffect(() => {
    if (!visible || specials.length <= 1) return;
    const timer = setInterval(() => {
      Animated.timing(slideFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setActiveIndex((i) => (i + 1) % specials.length);
        Animated.timing(slideFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [visible, specials.length]);

  const goTo = (idx: number) => {
    Animated.timing(slideFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setActiveIndex(idx);
      setPosterRatio(3 / 4); // reset while next image loads
      Animated.timing(slideFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  if (!specials.length) return null;
  const s = specials[activeIndex];
  const imageUrl = s.imageUrls?.[0] ? getImageUrl(s.imageUrls[0]) : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[popupStyles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <Animated.View style={[popupStyles.sheet, { transform: [{ scale: scaleAnim }] }]}>
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={popupStyles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color="#FFFDFB" />
          </TouchableOpacity>

          {/* Poster image — full width, no background */}
          <View>
            <Animated.View style={{ opacity: slideFade }}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={[popupStyles.posterImage, { aspectRatio: posterRatio }]}
                  contentFit="contain"
                  transition={0}
                  onLoad={(e) => {
                    const { width, height } = e.source;
                    if (width && height) setPosterRatio(width / height);
                  }}
                />
              ) : (
                <View style={[popupStyles.posterImage, popupStyles.posterPlaceholder, { aspectRatio: posterRatio }]}>
                  <Ionicons name="restaurant" size={52} color={colors.secondary.main} />
                </View>
              )}
            </Animated.View>

            {/* Prev / Next overlaid at vertical centre of image */}
            {specials.length > 1 && (
              <>
                <TouchableOpacity
                  onPress={() => goTo((activeIndex - 1 + specials.length) % specials.length)}
                  style={[popupStyles.navBtn, popupStyles.navBtnLeft]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.primary.main} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => goTo((activeIndex + 1) % specials.length)}
                  style={[popupStyles.navBtn, popupStyles.navBtnRight]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.primary.main} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Info */}
          <Animated.View style={[popupStyles.infoBlock, { opacity: slideFade }]}>
            <Text style={popupStyles.itemTitle} numberOfLines={2}>{s.title}</Text>
            {s.description ? (
              <Text style={popupStyles.itemDesc} numberOfLines={3}>{s.description}</Text>
            ) : null}
            {s.dayOfWeek ? (
              <Text style={popupStyles.itemDay}>
                Every {s.dayOfWeek.charAt(0).toUpperCase() + s.dayOfWeek.slice(1)}
              </Text>
            ) : null}
          </Animated.View>

          {/* Dots */}
          {specials.length > 1 && (
            <View style={popupStyles.dots}>
              {specials.map((_: any, i: number) => (
                <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <View style={[popupStyles.dot, i === activeIndex && popupStyles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity style={popupStyles.ctaBtn} onPress={onViewAll} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.secondary.main, colors.secondary.dark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={popupStyles.ctaBtnGradient}
            >
              <Text style={popupStyles.ctaBtnText}>View All Specials</Text>
              <Ionicons name="arrow-forward" size={16} color="#1A0D0A" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,13,10,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.base,
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.lg,
  },
  closeBtn: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(26,13,10,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  posterImage: {
    width: "100%",
  },
  posterPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  infoBlock: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  itemTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
  },
  itemDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    lineHeight: 20,
  },
  itemDay: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.main,
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,253,251,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    zIndex: 5,
  },
  navBtnLeft: {
    left: spacing.md,
  },
  navBtnRight: {
    right: spacing.md,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.light,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.secondary.main,
  },
  ctaBtn: {
    margin: spacing.xl,
    marginTop: spacing.md,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  ctaBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  ctaBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: "#1A0D0A",
  },
});

// ─── Quick Action Button ─────────────────────────────────────────────────────

const QuickAction = ({
  icon,
  label,
  onPress,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.quickAction, accent && styles.quickActionAccent]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.quickActionIcon, accent && styles.quickActionIconAccent]}>
      <Ionicons name={icon} size={20} color={accent ? "#FFFDFB" : colors.primary.main} />
    </View>
    <Text style={[styles.quickActionLabel, accent && styles.quickActionLabelAccent]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Specials Preview Card ───────────────────────────────────────────────────

const SpecialPreviewCard = ({
  special,
  onPress,
}: {
  special: any;
  onPress: () => void;
}) => {
  const imageUrl = special.imageUrls?.[0] ? getImageUrl(special.imageUrls[0]) : null;
  return (
    <TouchableOpacity style={styles.specialCard} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground
        source={imageUrl ? { uri: imageUrl } : require("../assets/images/landing/item2.jpg")}
        style={styles.specialCardBg}
        imageStyle={{ borderRadius: borderRadius.lg }}
      >
        <LinearGradient
          colors={["transparent", "rgba(26,13,10,0.88)"]}
          style={styles.specialCardGradient}
        >
          <View style={styles.specialCardTypeBadge}>
            <Text style={styles.specialCardTypeBadgeText}>
              {special.type === "daily" ? "Daily" : special.type === "chef" ? "Chef's" : "Special"}
            </Text>
          </View>
          <Text style={styles.specialCardTitle} numberOfLines={2}>
            {special.title}
          </Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

// ─── Event Preview Card ──────────────────────────────────────────────────────

const EventPreviewCard = ({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) => {
  const imageUrl = event.imageUrls?.[0] ? getImageUrl(event.imageUrls[0]) : null;
  const typeIcon = EVENT_TYPE_ICONS[event.type] ?? "calendar";
  const typeLabel = EVENT_TYPE_LABELS[event.type] ?? "Event";

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.9}>
      {/* Date Badge */}
      <View style={styles.eventDateBadge}>
        <Text style={styles.eventDateDay}>
          {new Date(event.eventStartDate).toLocaleDateString("en-US", { day: "numeric", timeZone: "America/Toronto" })}
        </Text>
        <Text style={styles.eventDateMonth}>
          {new Date(event.eventStartDate).toLocaleDateString("en-US", { month: "short", timeZone: "America/Toronto" })}
        </Text>
      </View>

      {/* Image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.eventCardImage}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <LinearGradient
          colors={[colors.primary.dark, colors.primary.main]}
          style={[styles.eventCardImage, { alignItems: "center", justifyContent: "center" }]}
        >
          <Ionicons name={typeIcon} size={28} color={colors.secondary.main} />
        </LinearGradient>
      )}

      {/* Info */}
      <View style={styles.eventCardInfo}>
        <View style={styles.eventCardTypePill}>
          <Ionicons name={typeIcon} size={11} color={colors.secondary.main} />
          <Text style={styles.eventCardTypeText}>{typeLabel}</Text>
        </View>
        <Text style={styles.eventCardTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.eventCardTime}>
          {formatEventDate(event.eventStartDate)} · {formatEventTime(event.eventStartDate)}
        </Text>
        {event.ticketLink && (
          <View style={styles.eventCardTicketBadge}>
            <Ionicons name="ticket-outline" size={11} color={colors.secondary.dark} />
            <Text style={styles.eventCardTicketText}>Tickets Available</Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.text.muted} style={styles.eventCardChevron} />
    </TouchableOpacity>
  );
};

// ─── Main HomeScreen ──────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { light } = useHaptics();
  const scrollBottomPad = useScrollBottomPadding();
  const [refreshing, setRefreshing] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroFade = useRef(new Animated.Value(1)).current;
  const [popupVisible, setPopupVisible] = useState(false);
  const popupShown = useRef(false);

  // Hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(heroFade, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setHeroIndex((i) => (i + 1) % HERO_IMAGES.length);
        Animated.timing(heroFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Data
  const { visibleSpecials, dailySpecials, loading: specialsLoading } = useVisibleSpecials();

  // Filter specials for popup: seasonal (in display period) + today's day + late night
  const popupSpecials = useMemo(() => {
    if (!visibleSpecials.length) return [];
    const todayName = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase(); // e.g. "monday"
    const now = new Date();

    return visibleSpecials.filter((s) => {
      // 1. Seasonal — must have an active display period
      if (s.type === "seasonal") {
        return !!(
          s.displayStartDate &&
          s.displayEndDate &&
          now >= new Date(s.displayStartDate) &&
          now <= new Date(s.displayEndDate)
        );
      }
      // 2. Today's day specials
      if (s.dayOfWeek && s.dayOfWeek === todayName) return true;
      // 3. Late night specials (always)
      if (s.specialCategory === "late_night") return true;
      return false;
    });
  }, [visibleSpecials]);

  // Show popup once when specials load on first mount
  useEffect(() => {
    if (!popupShown.current && !specialsLoading && popupSpecials.length > 0) {
      popupShown.current = true;
      const timer = setTimeout(() => setPopupVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [specialsLoading, popupSpecials.length]);
  const { data: events, loading: eventsLoading, refetch: refetchEvents } = useApiWithCache<Event[]>(
    "active-events-home",
    () => eventsService.getActiveEvents(),
  );
  const { data: openStatus, refetch: refetchStatus } = useApiWithCache<OpeningHoursStatus>(
    "opening-status",
    () => openingHoursService.getCurrentStatus(),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchEvents(), refetchStatus()]);
    setRefreshing(false);
  }, [refetchEvents, refetchStatus]);

  const displayableEvents = useMemo((): Event[] => {
    if (!events) return [];
    return events
      .filter(shouldDisplayEvent)
      .sort((a, b) => new Date(a.eventStartDate).getTime() - new Date(b.eventStartDate).getTime())
      .slice(0, 4);
  }, [events]);

  const heroHeight = Math.min(screenWidth * 0.72, 440);
  const SPECIAL_CARD_W = Math.min(screenWidth * 0.55, 200);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPad },
        ]}
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
        {/* ── Hero ── */}
        <View style={[styles.heroContainer, { height: heroHeight }]}>
          <Animated.View
            style={[StyleSheet.absoluteFillObject, { opacity: heroFade }]}
          >
            <Image
              source={HERO_IMAGES[heroIndex]}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={0}
            />
          </Animated.View>

          {/* Dark gradient overlay */}
          <LinearGradient
            colors={[
              "rgba(26,13,10,0.1)",
              "rgba(26,13,10,0.35)",
              "rgba(26,13,10,0.75)",
            ]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top safe area + status */}
          <View
            style={[styles.heroTop, { paddingTop: insets.top + spacing.sm }]}
          >
            <View style={styles.heroStatusRow}>
              <View
                style={[
                  styles.statusPill,
                  openStatus?.isOpen
                    ? styles.statusPillOpen
                    : styles.statusPillClosed,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: openStatus?.isOpen
                        ? "#22C55E"
                        : "#EF4444",
                    },
                  ]}
                />
                <Text style={styles.statusPillText}>
                  {openStatus?.isOpen ? "Open Now" : "Closed"}
                </Text>
              </View>
            </View>
          </View>

          {/* Hero content bottom */}
          <View style={styles.heroBottom}>
            <Text style={styles.heroBrandName}>Brooklin Pub</Text>
            <Text style={styles.heroTagline}>& Grill · Whitby, ON</Text>

            {/* Hero CTA */}
            <View style={styles.heroCTAs}>
              <TouchableOpacity
                style={styles.heroCTAPrimary}
                onPress={() => {
                  light();
                  Linking.openURL(EXTERNAL_URLS.ORDER_ONLINE);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.secondary.main, colors.secondary.dark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroCTAPrimaryGradient}
                >
                  <Ionicons
                    name="bag-handle-outline"
                    size={16}
                    color="#1A0D0A"
                  />
                  <Text style={styles.heroCTAPrimaryText}>Order Online</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroCTASecondary}
                onPress={() => {
                  light();
                  navigation.navigate("MenuTab");
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.heroCTASecondaryText}>View Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon="call-outline"
            label="Call Us"
            onPress={() => {
              light();
              Linking.openURL(`tel:${CONTACT_INFO.PHONE_RAW}`);
            }}
          />
          <View style={styles.quickActionDivider} />
          <QuickAction
            icon="map-outline"
            label="Directions"
            onPress={() => {
              light();
              Linking.openURL(EXTERNAL_URLS.GOOGLE_MAPS);
            }}
          />
          <View style={styles.quickActionDivider} />
          <QuickAction
            icon="calendar-outline"
            label="Events"
            onPress={() => {
              light();
              navigation.navigate("EventsTab");
            }}
          />
          <View style={styles.quickActionDivider} />
          <QuickAction
            icon="flame-outline"
            label="Specials"
            onPress={() => {
              light();
              navigation.navigate("SpecialTab");
            }}
          />
        </View>

        {/* ── Today's Specials ── */}
        {(specialsLoading || dailySpecials.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionOverline}>Today's Picks</Text>
                <Text style={styles.sectionTitle}>Daily Specials</Text>
              </View>
              <TouchableOpacity
                style={styles.sectionSeeAll}
                onPress={() => navigation.navigate("SpecialTab")}
              >
                <Text style={styles.sectionSeeAllText}>See All</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.secondary.main}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialsScroll}
            >
              {specialsLoading ? (
                <>
                  <View
                    style={{ width: SPECIAL_CARD_W, marginRight: spacing.md }}
                  >
                    <SpecialCardSkeleton />
                  </View>
                  <View
                    style={{ width: SPECIAL_CARD_W, marginRight: spacing.md }}
                  >
                    <SpecialCardSkeleton />
                  </View>
                </>
              ) : (
                dailySpecials.slice(0, 6).map((special) => (
                  <View
                    key={special.id}
                    style={{ width: SPECIAL_CARD_W, marginRight: spacing.md }}
                  >
                    <SpecialPreviewCard
                      special={special}
                      onPress={() => {
                        light();
                        navigation.navigate("SpecialTab");
                      }}
                    />
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.sectionDivider}>
          <GoldDivider />
        </View>

        {/* ── Upcoming Events ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionOverline}>What's On</Text>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
            <TouchableOpacity
              style={styles.sectionSeeAll}
              onPress={() => navigation.navigate("EventsTab")}
            >
              <Text style={styles.sectionSeeAllText}>See All</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.secondary.main}
              />
            </TouchableOpacity>
          </View>

          {eventsLoading ? (
            <>
              <EventCardSkeleton />
              <EventCardSkeleton />
            </>
          ) : displayableEvents.length === 0 ? (
            <View style={styles.emptyEvents}>
              <Ionicons
                name="calendar-outline"
                size={36}
                color={colors.border.gold}
              />
              <Text style={styles.emptyEventsTitle}>No Upcoming Events</Text>
              <Text style={styles.emptyEventsDesc}>
                Check back soon — we're always planning something special.
              </Text>
            </View>
          ) : (
            displayableEvents.map((event) => (
              <EventPreviewCard
                key={event.id}
                event={event}
                onPress={() => {
                  light();
                  navigation.navigate("EventsTab");
                }}
              />
            ))
          )}
        </View>

        <View style={styles.sectionDivider}>
          <GoldDivider />
        </View>

        {/* ── Visit Us ── */}
        <View style={styles.section}>
          <View style={styles.visitCard}>
            <LinearGradient
              colors={[colors.primary.dark, "#2A1208"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.visitContent}>
              <Text style={styles.visitOverline}>Find Us</Text>
              <Text style={styles.visitTitle}>Come Visit</Text>
              <Text style={styles.visitAddress}>
                {CONTACT_INFO.ADDRESS.FULL}
              </Text>

              <View style={styles.visitActions}>
                <TouchableOpacity
                  style={styles.visitBtn}
                  onPress={() => Linking.openURL(EXTERNAL_URLS.GOOGLE_MAPS)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.secondary.main, colors.secondary.dark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.visitBtnGradient}
                  >
                    <Ionicons name="navigate" size={14} color="#1A0D0A" />
                    <Text style={styles.visitBtnText}>Get Directions</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.visitBtnOutline}
                  onPress={() =>
                    Linking.openURL(`tel:${CONTACT_INFO.PHONE_RAW}`)
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="call-outline"
                    size={14}
                    color={colors.secondary.main}
                  />
                  <Text style={styles.visitBtnOutlineText}>
                    {CONTACT_INFO.PHONE}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider}>
          <GoldDivider />
        </View>

        {/* ── Newsletter ── */}
        <View style={styles.section}>
          <NewsletterForm compact />
        </View>

        {/* ── Social Strip ── */}
        <View style={styles.socialStrip}>
          <Text style={styles.socialStripLabel}>Follow Us</Text>
          <View style={styles.socialIcons}>
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
            ].map(({ icon, url }) => (
              <TouchableOpacity
                key={icon}
                style={styles.socialIcon}
                onPress={() => Linking.openURL(url)}
                activeOpacity={0.75}
              >
                <Ionicons name={icon} size={20} color={colors.primary.main} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <SpecialsPopup
        specials={popupSpecials}
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        onViewAll={() => {
          setPopupVisible(false);
          navigation.navigate("SpecialTab");
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ── Hero
  heroContainer: {
    width: "100%",
    overflow: "hidden",
  },
  heroTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.base,
  },
  heroStatusRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 5,
  },
  statusPillOpen: {
    backgroundColor: "rgba(34,197,94,0.2)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
  },
  statusPillClosed: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: "#FFFDFB",
    letterSpacing: 0.3,
  },
  heroBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  heroBrandName: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 42,
    color: "#FFFDFB",
    letterSpacing: 1,
    lineHeight: 46,
  },
  heroTagline: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: "rgba(255,253,251,0.75)",
    marginTop: 2,
    marginBottom: spacing.base,
    letterSpacing: 0.3,
  },
  heroCTAs: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  heroCTAPrimary: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...shadows.gold,
  },
  heroCTAPrimaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 6,
  },
  heroCTAPrimaryText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#1A0D0A",
    letterSpacing: 0.3,
  },
  heroCTASecondary: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: "rgba(255,253,251,0.6)",
  },
  heroCTASecondaryText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#FFFDFB",
    letterSpacing: 0.3,
  },

  // ── Quick Actions
  quickActionsRow: {
    flexDirection: "row",
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: spacing.xs,
  },
  quickActionAccent: {},
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(217,167,86,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionIconAccent: {
    backgroundColor: colors.secondary.main,
  },
  quickActionLabel: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  quickActionLabelAccent: {
    color: colors.text.primary,
  },
  quickActionDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
    alignSelf: "center",
  },

  // ── Sections
  section: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.base,
  },
  sectionDivider: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.base,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.base,
  },
  sectionOverline: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.main,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    lineHeight: 30,
  },
  sectionSeeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  sectionSeeAllText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.secondary.main,
  },

  // ── Specials Preview
  specialsScroll: {
    paddingLeft: spacing.xs,
    paddingRight: spacing.base,
  },
  specialCard: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    height: 200,
    ...shadows.card,
  },
  specialCardBg: {
    flex: 1,
    justifyContent: "flex-end",
  },
  specialCardGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  specialCardTypeBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondary.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  specialCardTypeBadgeText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs - 1,
    color: "#1A0D0A",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  specialCardTitle: {
    fontFamily: typography.fontFamily.headingSemibold,
    fontSize: typography.fontSize.lg,
    color: "#FFFDFB",
    lineHeight: 24,
  },

  // ── Events Preview
  eventCard: {
    flexDirection: "row",
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: "center",
    ...shadows.sm,
  },
  eventDateBadge: {
    width: 52,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary.main,
    alignSelf: "stretch",
  },
  eventDateDay: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.secondary.main,
    lineHeight: 26,
  },
  eventDateMonth: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: "rgba(217,167,86,0.75)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  eventCardImage: {
    width: 70,
    height: 70,
    margin: spacing.sm,
    borderRadius: borderRadius.md,
  },
  eventCardInfo: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xs,
  },
  eventCardTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  eventCardTypeText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.main,
    letterSpacing: 0.3,
  },
  eventCardTitle: {
    fontFamily: typography.fontFamily.headingMedium,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 21,
    marginBottom: 4,
  },
  eventCardTime: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.1,
  },
  eventCardTicketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 5,
  },
  eventCardTicketText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs - 1,
    color: colors.secondary.dark,
  },
  eventCardChevron: {
    marginRight: spacing.sm,
  },

  // ── Empty Events
  emptyEvents: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
    gap: spacing.sm,
  },
  emptyEventsTitle: {
    fontFamily: typography.fontFamily.headingMedium,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
  },
  emptyEventsDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: "center",
    maxWidth: "80%",
    lineHeight: 20,
  },

  // ── Visit Us Card
  visitCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.lg,
  },
  visitContent: {
    padding: spacing.xl,
  },
  visitOverline: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.main,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  visitTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: "#FFFDFB",
    marginBottom: spacing.sm,
  },
  visitAddress: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(255,253,251,0.65)",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  visitActions: {
    gap: spacing.sm,
  },
  visitBtn: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  visitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  visitBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#1A0D0A",
  },
  visitBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs,
  },
  visitBtnOutlineText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.secondary.main,
  },

  // ── Social Strip
  socialStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    gap: spacing.base,
  },
  socialStripLabel: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  socialIcons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(217,167,86,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});
