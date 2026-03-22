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
  FlatList,
  Dimensions,
  TouchableOpacity,
  Linking,
  Modal,
  ImageBackground,
  Animated,
  Easing,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { specialsService } from "../services/specials.service";
import { openingHoursService } from "../services/opening-hours.service";
import { getImageUrl } from "../services/api";
import type { Event, Special, OpeningHoursStatus } from "../types/api.types";
import {
  SectionHeader,
  GoldButton,
  GoldDivider,
  GlassCard,
  CornerAccents,
  InfoChip,
} from "../components/common";
import ImageCard from "../components/common/ImageCard";
import SocialFAB from "../components/common/SocialFAB";
import AppBrandStrip from "../components/common/AppBrandStrip";
import { EventCardSkeleton } from "../components/common/SkeletonLoader";
import { useHaptics } from "../hooks/useHaptics";

// Team images (matching frontend's hardcoded team data)
import Team2 from "../assets/images/team/team-2.png";
import Team3 from "../assets/images/team/team-3.png";
import Team4 from "../assets/images/team/team-4.png";
import Team5 from "../assets/images/team/team-5.png";

// Landing page carousel images (matching frontend LandingPage.tsx)
const LANDING_IMAGES = [
  require("../assets/images/landing/item1.jpg"),
  require("../assets/images/landing/item2.jpg"),
  require("../assets/images/landing/item3.jpg"),
  require("../assets/images/landing/item4.jpg"),
  require("../assets/images/landing/item5.jpg"),
  require("../assets/images/landing/item6.jpg"),
  require("../assets/images/landing/item7.jpg"),
  require("../assets/images/landing/item8.jpg"),
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SPECIALS_POPUP_KEY = "@brooklin_specials_popup_shown";
const POPUP_FALLBACK_IMG =
  "https://images.template.net/278326/Restaurant-Menu-Template-edit-online.png";

// ─── Team Member Type & Data (matching frontend TeamSection.tsx) ────────────

type TeamMember = {
  id: number;
  image: any;
  name: string;
  role: string;
  specialty: string;
};

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    image: Team3,
    name: "Premium Service",
    role: "Fine Dining Specialist",
    specialty:
      "Serving excellence with every plate, where flavor meets finesse.",
  },
  {
    id: 2,
    image: Team2,
    name: "Hospitality Expert",
    role: "Guest Experience",
    specialty: "Steak & Wine Pairing Expert",
  },
  {
    id: 3,
    image: Team4,
    name: "Service Excellence",
    role: "Customer Relations",
    specialty: "Ensuring perfect moments",
  },
  {
    id: 4,
    image: Team5,
    name: "Culinary Artisan",
    role: "Food & Beverage",
    specialty: "Signature dishes & drinks",
  },
];

// ─── Utility functions ──────────────────────────────────────────────────────

const getCurrentDayOfWeek = (): string => {
  try {
    const now = new Date();
    const torontoStr = now.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "America/Toronto",
    });
    return torontoStr.toLowerCase();
  } catch {
    return new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
  }
};

const shouldShowInPopup = (special: Special): boolean => {
  if (!special.isActive) return false;
  if (special.displayStartDate && special.displayEndDate) {
    const now = new Date();
    if (
      now < new Date(special.displayStartDate) ||
      now > new Date(special.displayEndDate)
    )
      return false;
  }
  const t = special.type;
  if (t === "seasonal" || t === "game_time" || t === "chef") return true;
  if (t === "daily") {
    return special.dayOfWeek?.toLowerCase() === getCurrentDayOfWeek();
  }
  return false;
};

const shouldDisplayEvent = (event: Event): boolean => {
  if (!event.isActive) return false;
  const now = new Date();
  if (event.displayStartDate && event.displayEndDate) {
    const displayStart = new Date(event.displayStartDate);
    const displayEnd = new Date(event.displayEndDate);
    return now >= displayStart && now <= displayEnd;
  }
  return true;
};

const getEventTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    live_music: "Live Music",
    sports_viewing: "Sports",
    trivia_night: "Trivia Night",
    karaoke: "Karaoke",
    private_party: "Private Event",
    special_event: "Special Event",
  };
  return labels[type] || "Event";
};

const formatEventDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "America/Toronto",
  });
};

const formatEventTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });
};

// ─── Animated Particle Component ────────────────────────────────────────────

const AnimatedParticle = ({ delay, style }: { delay: number; style: any }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15 - Math.random() * 20],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.15, 0.5, 0.15],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

// ─── Scroll Indicator Component ─────────────────────────────────────────────

const ScrollIndicator = () => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  return (
    <View style={styles.scrollIndicator}>
      <Text style={styles.scrollIndicatorText}>SCROLL DOWN</Text>
      <View style={styles.scrollIndicatorMouse}>
        <Animated.View
          style={[styles.scrollIndicatorDot, { transform: [{ translateY }] }]}
        />
      </View>
    </View>
  );
};

// ─── Decorative Gold Accent Line ────────────────────────────────────────────

const GoldAccentLine = ({ width = 60 }: { width?: number }) => (
  <View style={[styles.goldAccentLine, { width }]}>
    <View style={[styles.goldAccentDot, { left: -3 }]} />
    <LinearGradient
      colors={["transparent", "#D9A756", "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.goldAccentGradient}
    />
    <View style={[styles.goldAccentDot, { right: -3 }]} />
  </View>
);

// ─── Decorative Divider with Circle ─────────────────────────────────────────

const DividerWithCircle = () => (
  <View style={styles.dividerWithCircle}>
    <View style={styles.dividerLine} />
    <View style={styles.dividerCircle} />
    <View style={styles.dividerLine} />
  </View>
);

// ─── Event Accordion Card ───────────────────────────────────────────────────

const EventAccordionCard = React.memo(
  ({
    event,
    isActive,
    onPress,
    onViewDetails,
  }: {
    event: Event;
    isActive: boolean;
    onPress: () => void;
    onViewDetails: () => void;
  }) => {
    const expandAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
      Animated.spring(expandAnim, {
        toValue: isActive ? 1 : 0,
        tension: 180,
        friction: 25,
        useNativeDriver: false,
      }).start();
    }, [isActive]);

    const height = expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 340],
    });

    const imageUrl = event.imageUrls?.[0]
      ? getImageUrl(event.imageUrls[0])
      : null;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <Animated.View style={[styles.accordionCard, { height }]}>
          {/* Background image */}
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
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

          {/* Gradient overlay */}
          <LinearGradient
            colors={
              isActive
                ? ["transparent", "rgba(60,31,14,0.5)", "rgba(60,31,14,0.95)"]
                : [
                    "rgba(60,31,14,0.4)",
                    "rgba(60,31,14,0.6)",
                    "rgba(60,31,14,0.85)",
                  ]
            }
            style={StyleSheet.absoluteFillObject}
          />

          {/* Gold accent line at top for active card */}
          {isActive && (
            <LinearGradient
              colors={["transparent", "#D9A756", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accordionTopAccent}
            />
          )}

          {/* Collapsed state - title only */}
          {!isActive && (
            <View style={styles.accordionCollapsed}>
              <Text style={styles.accordionCollapsedDate}>
                {formatEventDate(event.eventStartDate)}
              </Text>
              <View style={styles.accordionCollapsedDivider} />
              <Text style={styles.accordionCollapsedTitle} numberOfLines={1}>
                {event.title}
              </Text>
            </View>
          )}

          {/* Expanded state - full content */}
          {isActive && (
            <View style={styles.accordionContent}>
              {/* Event type badge */}
              <View style={styles.accordionBadge}>
                <Text style={styles.accordionBadgeText}>
                  {getEventTypeLabel(event.type)}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.accordionTitle}>{event.title}</Text>

              {/* Date & Time pills */}
              <View style={styles.accordionPills}>
                <View style={styles.accordionPill}>
                  <View style={styles.accordionPillDot} />
                  <Text style={styles.accordionPillText}>
                    {formatEventDate(event.eventStartDate)}
                  </Text>
                </View>
                <View style={styles.accordionPill}>
                  <View style={styles.accordionPillDot} />
                  <Text style={styles.accordionPillText}>
                    {formatEventTime(event.eventStartDate)}
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.accordionButtons}>
                {event.ticketLink && (
                  <TouchableOpacity
                    style={styles.accordionPrimaryBtn}
                    onPress={() => Linking.openURL(event.ticketLink!)}
                  >
                    <LinearGradient
                      colors={["#D9A756", "#B8923F"]}
                      style={styles.accordionPrimaryBtnGradient}
                    >
                      <Text style={styles.accordionPrimaryBtnText}>
                        GET TICKETS
                      </Text>
                      <Ionicons
                        name="ticket-outline"
                        size={14}
                        color="#FFFDFB"
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.accordionSecondaryBtn,
                    !event.ticketLink && styles.accordionPrimaryBtn,
                  ]}
                  onPress={onViewDetails}
                >
                  {!event.ticketLink ? (
                    <LinearGradient
                      colors={["#D9A756", "#B8923F"]}
                      style={styles.accordionPrimaryBtnGradient}
                    >
                      <Text style={styles.accordionPrimaryBtnText}>
                        VIEW DETAILS
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.accordionSecondaryBtnText}>
                      VIEW DETAILS
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  },
);

// ─── Team Zigzag Card ───────────────────────────────────────────────────────

const TeamZigzagCard = React.memo(
  ({
    member,
    index,
    onPress,
  }: {
    member: TeamMember;
    index: number;
    onPress: () => void;
  }) => {
    const isEven = index % 2 === 0;

    return (
      <TouchableOpacity
        style={styles.zigzagCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Image Section */}
        <View style={styles.zigzagImageSection}>
          {/* Decorative frame */}
          <View
            style={[
              styles.zigzagFrame,
              isEven ? { left: -10, top: -10 } : { right: -10, top: -10 },
            ]}
          />

          <View style={styles.zigzagImageContainer}>
            <Image
              source={member.image}
              style={styles.zigzagImage}
              contentFit="cover"
              transition={300}
            />

            {/* Gradient overlay */}
            <LinearGradient
              colors={["transparent", "rgba(60,31,14,0.3)"]}
              style={styles.zigzagImageOverlay}
            />

            {/* Gold accent corner */}
            <View
              style={[
                styles.zigzagGoldCorner,
                isEven ? { left: 0 } : { right: 0 },
              ]}
            />
          </View>

          {/* Decorative dots */}
          <View
            style={[
              styles.zigzagDots,
              isEven ? { right: -16 } : { left: -16 },
              { bottom: -16 },
            ]}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.zigzagDot,
                  {
                    opacity: ((i % 3) + Math.floor(i / 3)) % 2 === 0 ? 1 : 0.4,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Content Section */}
        <View style={[styles.zigzagContent, { alignItems: "center" }]}>
          {/* Decorative line */}
          <LinearGradient
            colors={["#D9A756", "#B08030"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.zigzagContentLine}
          />

          {/* Role badge */}
          <View style={styles.zigzagRoleBadge}>
            <Text style={styles.zigzagRoleBadgeText}>{member.role}</Text>
          </View>

          {/* Name */}
          <Text style={styles.zigzagName}>{member.name}</Text>

          {/* Specialty */}
          <Text style={styles.zigzagSpecialty} numberOfLines={3}>
            {member.specialty}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

// ─── Main HomeScreen ────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { light, medium } = useHaptics();
  const [showSpecialsPopup, setShowSpecialsPopup] = useState(false);
  const [activeSpecialIndex, setActiveSpecialIndex] = useState(0);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const specialsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fade-in animation for hero content
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(30)).current;

  // Crossfading carousel for landing hero background
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselFade = useRef(new Animated.Value(1)).current;
  const nextImageRef = useRef(1);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out current, then swap
      Animated.timing(carouselFade, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setCarouselIndex(nextImageRef.current);
        nextImageRef.current =
          (nextImageRef.current + 1) % LANDING_IMAGES.length;
        // Fade in new image
        Animated.timing(carouselFade, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  // Data fetching
  const { dailySpecials, loading: specialsLoading } = useVisibleSpecials();
  const { data: allSpecials } = useApiWithCache<Special[]>(
    "active-specials-popup",
    () => specialsService.getActiveSpecials(),
  );
  const popupSpecials = (allSpecials ?? []).filter(shouldShowInPopup);
  const { data: events, loading: eventsLoading, refetch: refetchEvents } = useApiWithCache<Event[]>(
    "upcoming-events",
    () => eventsService.getUpcomingEvents(),
  );
  const { data: activeEvents, refetch: refetchActiveEvents } = useApiWithCache<Event[]>(
    "active-events-home",
    () => eventsService.getActiveEvents(),
  );
  const { data: openStatus, refetch: refetchStatus } = useApiWithCache<OpeningHoursStatus>(
    "opening-status",
    () => openingHoursService.getCurrentStatus(),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchEvents(), refetchActiveEvents(), refetchStatus()]);
    setRefreshing(false);
  }, [refetchEvents, refetchActiveEvents, refetchStatus]);

  // Displayable events for accordion (matching frontend: filter + sort + limit 5)
  const displayableEvents = useMemo((): Event[] => {
    if (!activeEvents || activeEvents.length === 0) return [];
    return activeEvents
      .filter(shouldDisplayEvent)
      .sort(
        (a, b) =>
          new Date(a.eventStartDate).getTime() -
          new Date(b.eventStartDate).getTime(),
      )
      .slice(0, 5);
  }, [activeEvents]);

  // Specials popup
  useEffect(() => {
    if (popupSpecials.length === 0 || specialsLoading) return;
    const checkPopup = async () => {
      try {
        const today = new Date().toDateString();
        const shown = await AsyncStorage.getItem(SPECIALS_POPUP_KEY);
        if (shown !== today) {
          setShowSpecialsPopup(true);
          await AsyncStorage.setItem(SPECIALS_POPUP_KEY, today);
        }
      } catch {}
    };
    const t = setTimeout(checkPopup, 800);
    return () => clearTimeout(t);
  }, [popupSpecials, specialsLoading]);

  // Auto-rotate specials popup
  useEffect(() => {
    if (!showSpecialsPopup || popupSpecials.length <= 1) return;
    specialsTimerRef.current = setInterval(() => {
      setActiveSpecialIndex((prev) =>
        prev >= popupSpecials.length - 1 ? 0 : prev + 1,
      );
    }, 4000);
    return () => {
      if (specialsTimerRef.current) clearInterval(specialsTimerRef.current);
    };
  }, [showSpecialsPopup, popupSpecials.length]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary.main}
            colors={[colors.secondary.main]}
          />
        }
      >
        {/* ══════════ LANDING HERO SECTION ══════════ */}
        <View style={styles.heroContainer}>
          {/* Crossfading background images */}
          <Animated.Image
            source={LANDING_IMAGES[carouselIndex]}
            style={[StyleSheet.absoluteFillObject, { opacity: carouselFade }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              "rgba(60,31,14,0.55)",
              "rgba(60,31,14,0.72)",
              "rgba(40,20,8,0.82)",
            ]}
            style={styles.heroGradient}
          >
            <Animated.View
              style={[
                styles.heroContentWrapper,
                {
                  opacity: heroFade,
                  transform: [{ translateY: heroSlide }],
                },
              ]}
            >
              {/* Gold accent line with dots */}
              <GoldAccentLine width={60} />

              {/* Overline */}
              <Text style={styles.heroOverline}>
                ✦ Est. 2014 • Brooklin, Ontario ✦
              </Text>

              {/* Main title */}
              <Text style={styles.heroTitle}>Welcome to{"\n"}Brooklin Pub</Text>

              {/* Decorative divider with circle */}
              <DividerWithCircle />

              {/* Tagline */}
              <Text style={styles.heroTagline}>
                Beer, wine, spirits, homemade comfort food, and the warmest
                welcome in town
              </Text>

              {/* Dual CTA Row */}
              <View style={styles.heroCTARow}>
                <TouchableOpacity
                  style={styles.heroCTAButton}
                  onPress={() => { medium(); navigation.navigate("MenuTab"); }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#D9A756", "#B8923F"]}
                    style={styles.heroCTAGradient}
                  >
                    <Text style={styles.heroCTAText}>OUR MENU</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroCTAButtonOutline}
                  onPress={() => { light(); navigation.navigate("SpecialTab"); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroCTATextOutline}>SPECIALS</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

          </LinearGradient>
        </View>

        {/* ══════════ QUICK INFO BAR ══════════ */}
        <View style={styles.quickInfoBar}>
          {openStatus !== undefined && (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: openStatus?.isOpen
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(239,68,68,0.1)",
                    borderColor: openStatus?.isOpen
                      ? "rgba(34,197,94,0.35)"
                      : "rgba(239,68,68,0.35)",
                  },
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
                <Text
                  style={[
                    styles.statusPillText,
                    { color: openStatus?.isOpen ? "#22C55E" : "#EF4444" },
                  ]}
                >
                  {openStatus?.isOpen ? "Open Now" : "Closed"}
                </Text>
              </View>
              <Text style={styles.statusAddress}>
                15 Baldwin St · Whitby, ON
              </Text>
            </View>
          )}
          <View style={styles.quickActions}>
            {[
              {
                icon: "call" as const,
                label: "Call",
                onPress: () =>
                  Linking.openURL(`tel:${CONTACT_INFO.PHONE_RAW}`),
              },
              {
                icon: "navigate" as const,
                label: "Directions",
                onPress: () =>
                  Linking.openURL(EXTERNAL_URLS.GOOGLE_MAPS),
              },
              {
                icon: "bag-handle-outline" as const,
                label: "Order",
                onPress: () =>
                  Linking.openURL(EXTERNAL_URLS.ORDER_ONLINE),
              },
              {
                icon: "book-outline" as const,
                label: "Menu",
                onPress: () => navigation.navigate("MenuTab"),
              },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickActionBtn}
                onPress={action.onPress}
                activeOpacity={0.75}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons
                    name={action.icon}
                    size={22}
                    color={colors.secondary.main}
                  />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ══════════ TODAY'S SPECIALS TEASER ══════════ */}
        {(specialsLoading || dailySpecials.length > 0) && (
          <View style={styles.specialsSection}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Today's Specials</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("SpecialTab")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.sectionSeeAll}>See All →</Text>
              </TouchableOpacity>
            </View>

            {specialsLoading ? (
              <View style={styles.specialsTeaserRow}>
                {[1, 2].map((i) => (
                  <View key={i} style={styles.specialTeaserSkeleton} />
                ))}
              </View>
            ) : (
              <FlatList
                horizontal
                data={dailySpecials.slice(0, 6)}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.specialsTeaserList}
                ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.specialTeaserCard}
                    onPress={() => navigation.navigate("SpecialTab")}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{
                        uri:
                          getImageUrl(item.imageUrls?.[0]) ||
                          "https://i.pinimg.com/736x/42/2c/2e/422c2e649799697f1d1355ba8f308edd.jpg",
                      }}
                      style={styles.specialTeaserImage}
                      contentFit="cover"
                      transition={300}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(40,20,8,0.88)"]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.specialTeaserInfo}>
                      <Text style={styles.specialTeaserType}>
                        {item.type === "daily"
                          ? "Daily"
                          : item.type === "day_time"
                            ? "Day Time"
                            : "Special"}
                      </Text>
                      <Text style={styles.specialTeaserTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* ══════════ UPCOMING EVENTS ACCORDION ══════════ */}
        {(eventsLoading || displayableEvents.length > 0) && (
          <View style={styles.eventsSection}>
            {/* Header */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Upcoming Events</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("EventsTab")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.sectionSeeAll}>See All →</Text>
              </TouchableOpacity>
            </View>

            {eventsLoading ? (
              /* Skeleton while events load */
              <View style={{ gap: spacing.sm }}>
                {[1, 2].map((i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </View>
            ) : (
              /* Accordion Cards */
              <View style={styles.accordionContainer}>
                {displayableEvents.map((event, index) => (
                  <EventAccordionCard
                    key={event.id}
                    event={event}
                    isActive={index === activeEventIndex}
                    onPress={() => setActiveEventIndex(index)}
                    onViewDetails={() => navigation.navigate("EventsTab")}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ══════════ TEAM HORIZONTAL STRIP ══════════ */}
        <View style={styles.teamSection}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Meet The Team</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AboutTab")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.sectionSeeAll}>About Us →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={TEAM_MEMBERS}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.teamCard}
                onPress={() => navigation.navigate("AboutTab")}
                activeOpacity={0.85}
              >
                <Image
                  source={item.image}
                  style={styles.teamCardImage}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={["transparent", "rgba(40,20,8,0.82)"]}
                  style={styles.teamCardGradient}
                />
                <View style={styles.teamCardInfo}>
                  <Text style={styles.teamCardRole} numberOfLines={1}>
                    {item.role}
                  </Text>
                  <Text style={styles.teamCardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.teamCardSpecialty} numberOfLines={2}>
                    {item.specialty}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>


        {/* ══════════ BRAND STRIP ══════════ */}
        <AppBrandStrip />
      </ScrollView>

      {/* ══════════ SOCIAL FAB ══════════ */}
      <SocialFAB />

      {/* ══════════ SPECIALS POPUP MODAL ══════════ */}
      <Modal
        visible={showSpecialsPopup}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowSpecialsPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CornerAccents size={14} color={colors.secondary.main} />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowSpecialsPopup(false)}
            >
              <Ionicons name="close" size={24} color={colors.text.light} />
            </TouchableOpacity>

            <LinearGradient
              colors={[colors.background.dark, colors.primary.dark]}
              style={styles.modalGradient}
            >
              <Text style={styles.modalOverline}>✦ UPDATES ✦</Text>
              <GoldDivider width="40%" marginVertical={spacing.md} />

              {popupSpecials.length > 0 && (
                <>
                  <View style={styles.specialPopupCard}>
                    <Image
                      source={{
                        uri: getImageUrl(
                          popupSpecials[activeSpecialIndex]?.imageUrls?.[1] ??
                            popupSpecials[activeSpecialIndex]?.imageUrls?.[0] ??
                            POPUP_FALLBACK_IMG,
                        ),
                      }}
                      style={styles.specialPopupImage}
                      contentFit="cover"
                      transition={400}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.8)"]}
                      style={styles.specialPopupOverlay}
                    >
                      <Text style={styles.specialPopupTitle}>
                        {popupSpecials[activeSpecialIndex]?.title}
                      </Text>
                      <Text style={styles.specialPopupDesc} numberOfLines={3}>
                        {popupSpecials[activeSpecialIndex]?.description}
                      </Text>
                    </LinearGradient>
                    <CornerAccents size={12} />
                  </View>

                  {popupSpecials.length > 1 && (
                    <View style={styles.paginationDots}>
                      {popupSpecials.map((_, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setActiveSpecialIndex(i)}
                        >
                          <View
                            style={[
                              styles.paginationDot,
                              i === activeSpecialIndex &&
                                styles.paginationDotActive,
                            ]}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={styles.popupTapHint}>
                    Tap anywhere to continue
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={styles.modalViewAllBtn}
                onPress={() => {
                  setShowSpecialsPopup(false);
                  navigation.navigate("HomeTab", {
                    screen: "Special",
                    params: { type: "daily" },
                  });
                }}
              >
                <Text style={styles.modalViewAllText}>View All Specials</Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.secondary.main}
                />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },

  /* ──── Quick Info Bar ──── */
  quickInfoBar: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: spacing.base,
    marginTop: -24,
    borderRadius: 20,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.18)",
    shadowColor: "#3C1F0E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  statusAddress: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(217,167,86,0.1)",
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionLabel: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 0.2,
  },

  /* ──── Section Row ──── */
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  sectionSeeAll: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.secondary.main,
  },

  /* ──── Today's Specials Teaser ──── */
  specialsSection: {
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217,167,86,0.1)",
  },
  specialsTeaserList: {
    paddingHorizontal: spacing.base,
  },
  specialsTeaserRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  specialTeaserCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    ...shadows.md,
  },
  specialTeaserSkeleton: {
    width: 160,
    height: 200,
    borderRadius: 16,
    backgroundColor: "rgba(217,167,86,0.1)",
  },
  specialTeaserImage: {
    width: "100%",
    height: "100%",
  },
  specialTeaserInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
  },
  specialTeaserType: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 9,
    color: colors.secondary.main,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  specialTeaserTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.sm,
    color: "#FFFDFB",
    lineHeight: 16,
  },

  /* ──── Team Horizontal Strip ──── */
  teamList: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  teamCard: {
    width: 150,
    height: 190,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    ...shadows.md,
  },
  teamCardImage: {
    width: "100%",
    height: "100%",
  },
  teamCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  teamCardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
  },
  teamCardRole: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 9,
    color: colors.secondary.main,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  teamCardName: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.sm,
    color: "#FFFDFB",
    lineHeight: 16,
  },
  teamCardSpecialty: {
    fontFamily: typography.fontFamily.body,
    fontSize: 9,
    color: "rgba(255,253,251,0.7)",
    lineHeight: 12,
    marginTop: 2,
  },

  /* ──── Landing Hero ──── */
  heroContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  heroGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
    borderRadius: 50,
  },
  heroContentWrapper: {
    alignItems: "center",
    gap: spacing.base,
  },
  goldAccentLine: {
    height: 3,
    position: "relative",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  goldAccentGradient: {
    height: 3,
    width: "100%",
    borderRadius: 2,
  },
  goldAccentDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D9A756",
    top: -1.5,
    zIndex: 1,
  },
  heroOverline: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: "#D9A756",
    letterSpacing: 3,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 40,
    color: "#FFFDFB",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 44,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 30,
  },
  dividerWithCircle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(217,167,86,0.5)",
  },
  dividerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9A756",
  },
  heroTagline: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: "rgba(255,253,251,0.95)",
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.85,
    letterSpacing: 0.2,
    paddingHorizontal: spacing.xl,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroCTARow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    alignItems: "center",
  },
  heroCTAButton: {
    borderRadius: 50,
    overflow: "hidden",
    ...shadows.gold,
  },
  heroCTAGradient: {
    paddingHorizontal: Math.max(20, SCREEN_WIDTH * 0.065),
    paddingVertical: spacing.md + 2,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  heroCTAText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#FFFDFB",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heroCTAButtonOutline: {
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "rgba(217,167,86,0.7)",
    paddingHorizontal: Math.max(20, SCREEN_WIDTH * 0.065),
    paddingVertical: spacing.md + 2,
  },
  heroCTATextOutline: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#D9A756",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  /* Scroll Indicator */
  scrollIndicator: {
    position: "absolute",
    bottom: SCREEN_HEIGHT * 0.1,
    alignItems: "center",
    gap: spacing.sm,
  },
  scrollIndicatorText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 10,
    color: "rgba(255,253,251,0.6)",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  scrollIndicatorMouse: {
    width: 24,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(217,167,86,0.5)",
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  scrollIndicatorDot: {
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#D9A756",
  },

  /* ──── Hero Middle Section ──── */
  heroMiddleContainer: {
    width: SCREEN_WIDTH,
    minHeight: SCREEN_HEIGHT * 0.75,
  },
  heroMiddleOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.xl,
  },
  heroMiddleContent: {
    alignItems: "center",
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  heroMiddleSubtitle: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: "#D9A756",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  heroMiddleTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    textAlign: "center",
    lineHeight: typography.fontSize["3xl"] * 1.2,
    marginBottom: spacing.md,
  },
  heroMiddleDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: "rgba(255,253,251,0.85)",
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.8,
    letterSpacing: 0.2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  heroMiddleButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing["2xl"],
  },
  heroMiddleBtn: {
    borderRadius: 50,
    overflow: "hidden",
  },
  heroMiddleBtnGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 50,
  },
  heroMiddleBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#FFFDFB",
    letterSpacing: 1.5,
  },
  heroMiddleBtnOutline: {
    borderWidth: 1.5,
    borderColor: "rgba(217,167,86,0.6)",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    justifyContent: "center",
  },
  heroMiddleBtnOutlineText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#D9A756",
    letterSpacing: 1.5,
  },
  heroMiddleBottomAccent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    width: "80%",
  },
  heroMiddleLocationText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: "rgba(217,167,86,0.7)",
    letterSpacing: 2,
  },

  /* ──── Events Accordion Section ──── */
  eventsSection: {
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.default,
  },
  floatingAccents: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  floatingParticle: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(217,167,86,0.4)",
  },
  eventsSectionHeader: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing["2xl"],
    gap: spacing.md,
  },
  eventsSectionOverline: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: "#D9A756",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  eventsSectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    letterSpacing: -0.3,
    lineHeight: typography.fontSize["3xl"] * 1.15,
    textAlign: "center",
  },
  eventsSectionSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: "rgba(60,31,14,0.8)",
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.75,
    letterSpacing: 0.2,
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  eventsSectionDivider: {
    width: 100,
    height: 1,
  },
  accordionContainer: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  accordionCard: {
    borderRadius: borderRadius["2xl"],
    overflow: "hidden",
    position: "relative",
  },
  accordionTopAccent: {
    position: "absolute",
    top: 0,
    left: "20%",
    right: "20%",
    height: 3,
    zIndex: 10,
  },
  accordionCollapsed: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  accordionCollapsedDate: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: "rgba(217,167,86,0.9)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  accordionCollapsedDivider: {
    width: 2,
    height: 20,
    backgroundColor: "rgba(217,167,86,0.4)",
    borderRadius: 1,
  },
  accordionCollapsedTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: "#FFFDFB",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  accordionContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    gap: spacing.md,
  },
  accordionBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: 30,
    backgroundColor: "rgba(217,167,86,0.2)",
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.5)",
  },
  accordionBadgeText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 10,
    color: "#FFFDFB",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  accordionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: "#FFFDFB",
    lineHeight: typography.fontSize["2xl"] * 1.1,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  accordionPills: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  accordionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs + 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  accordionPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9A756",
  },
  accordionPillText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: "#FFFDFB",
  },
  accordionButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  accordionPrimaryBtn: {
    borderRadius: 50,
    overflow: "hidden",
  },
  accordionPrimaryBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  accordionPrimaryBtnText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 11,
    color: "#FFFDFB",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  accordionSecondaryBtn: {
    borderWidth: 2,
    borderColor: "rgba(217,167,86,0.8)",
    borderRadius: 50,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md - 1,
    justifyContent: "center",
    alignItems: "center",
  },
  accordionSecondaryBtnText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 11,
    color: "#FFFDFB",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  /* ──── Team Horizontal Strip ──── */
  teamSection: {
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
    backgroundColor: colors.background.default,
  },
  teamHeader: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing["2xl"],
    gap: spacing.md,
  },
  teamOverline: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: "#D9A756",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  teamTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    letterSpacing: -0.3,
    lineHeight: typography.fontSize["3xl"] * 1.15,
    textAlign: "center",
  },
  teamSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: "rgba(60,31,14,0.8)",
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.85,
    letterSpacing: 0.2,
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  teamDividerLine: {
    width: 100,
    height: 1,
  },

  /* Zigzag Card */
  zigzagCard: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing["3xl"],
    gap: spacing.xl,
    alignItems: "center",
  },
  zigzagImageSection: {
    width: "100%",
    maxWidth: 340,
    position: "relative",
    alignSelf: "center",
  },
  zigzagFrame: {
    position: "absolute",
    width: "70%",
    height: "70%",
    borderWidth: 2,
    borderColor: "rgba(217,167,86,0.3)",
    zIndex: 0,
  },
  zigzagImageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 4 / 5,
    overflow: "hidden",
    zIndex: 1,
  },
  zigzagImage: {
    width: "100%",
    height: "100%",
  },
  zigzagImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  zigzagGoldCorner: {
    position: "absolute",
    bottom: 0,
    width: 50,
    height: 50,
    zIndex: 3,
    backgroundColor: "transparent",
    borderBottomWidth: 50,
    borderBottomColor: "#D9A756",
    borderLeftWidth: 50,
    borderLeftColor: "transparent",
    opacity: 0.8,
  },
  zigzagDots: {
    position: "absolute",
    flexDirection: "row",
    flexWrap: "wrap",
    width: 40,
    gap: 8,
  },
  zigzagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9A756",
  },
  zigzagContent: {
    width: "100%",
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  zigzagContentLine: {
    width: 60,
    height: 3,
    borderRadius: 2,
  },
  zigzagRoleBadge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(217,167,86,0.15)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(217,167,86,0.3)",
  },
  zigzagRoleBadgeText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 11,
    color: "#D9A756",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  zigzagName: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    lineHeight: typography.fontSize["2xl"] * 1.2,
    textAlign: "center",
  },
  zigzagSpecialty: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: "rgba(60,31,14,0.7)",
    lineHeight: typography.fontSize.base * 1.8,
    textAlign: "center",
    maxWidth: 320,
  },

  /* Team Bottom Decor */
  teamBottomDecor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing["2xl"],
    paddingHorizontal: spacing.base,
  },
  teamBottomLine: {
    flex: 1,
    height: 1,
    maxWidth: 40,
  },
  teamBottomDiamond: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: "#D9A756",
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
  },
  teamBottomText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 10,
    color: "rgba(217,167,86,0.8)",
    letterSpacing: 3,
    textTransform: "uppercase",
    paddingHorizontal: spacing.sm,
  },

  /* ──── Order Online ──── */
  orderSection: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
  },
  orderGradient: {
    borderRadius: borderRadius.lg,
    padding: spacing["2xl"],
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.gold,
  },
  orderOverline: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    letterSpacing: 4,
    color: colors.secondary.main,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  orderTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  orderDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.6,
    marginBottom: spacing.lg,
  },

  /* ──── Quick Contact ──── */
  quickContactSection: {
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.base,
  },
  quickContactGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickContactCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  quickContactLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.secondary.main,
  },
  quickContactValue: {
    fontFamily: typography.fontFamily.headingSemibold,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    textAlign: "center",
  },
  quickContactSub: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  openStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
  },

  /* ──── Specials Popup Modal ──── */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    width: SCREEN_WIDTH - spacing["2xl"] * 2,
    maxWidth: 380,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.gold,
    ...shadows.lg,
  },
  modalClose: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalGradient: {
    padding: spacing.xl,
    alignItems: "center",
  },
  modalOverline: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    letterSpacing: 4,
    color: colors.secondary.main,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  specialPopupCard: {
    width: "100%",
    height: 220,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginVertical: spacing.base,
    position: "relative",
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  specialPopupImage: {
    width: "100%",
    height: "100%",
  },
  specialPopupOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    justifyContent: "flex-end",
    padding: spacing.base,
  },
  specialPopupTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.text.light,
    marginBottom: spacing.xs,
  },
  specialPopupDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.lightMuted,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  paginationDots: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.gold,
  },
  paginationDotActive: {
    backgroundColor: colors.secondary.main,
    width: 24,
    borderRadius: 4,
  },
  popupTapHint: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: "rgba(245,239,230,0.45)",
    textAlign: "center",
    marginTop: spacing.sm,
    letterSpacing: 1,
  },
  modalViewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalViewAllText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.secondary.main,
  },
});
