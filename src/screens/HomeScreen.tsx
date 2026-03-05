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
  Linking,
  Modal,
  ImageBackground,
  Animated,
  Easing,
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
} from "../components/common/SharedComponents";
import ImageCard from "../components/common/ImageCard";
import FloatingCallButton from "../components/common/FloatingCallButton";
import Footer from "../components/common/Footer";
import LoadingScreen from "../components/common/LoadingScreen";

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

  // Data fetching
  const { dailySpecials, loading: specialsLoading } = useVisibleSpecials();
  const { data: allSpecials } = useApiWithCache<Special[]>(
    "active-specials-popup",
    () => specialsService.getActiveSpecials(),
  );
  const popupSpecials = (allSpecials ?? []).filter(shouldShowInPopup);
  const { data: events, loading: eventsLoading } = useApiWithCache<Event[]>(
    "upcoming-events",
    () => eventsService.getUpcomingEvents(),
  );
  const { data: activeEvents } = useApiWithCache<Event[]>(
    "active-events-home",
    () => eventsService.getActiveEvents(),
  );
  const { data: openStatus } = useApiWithCache<OpeningHoursStatus>(
    "opening-status",
    () => openingHoursService.getCurrentStatus(),
  );

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

  const isLoading = eventsLoading && specialsLoading;
  if (isLoading) return <LoadingScreen />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
              "rgba(74,44,23,0.65)",
              "rgba(60,31,14,0.75)",
              "rgba(74,44,23,0.7)",
            ]}
            style={styles.heroGradient}
          >
            {/* Animated floating particles */}
            <View style={styles.particleContainer}>
              {Array.from({ length: 12 }).map((_, i) => (
                <AnimatedParticle
                  key={i}
                  delay={i * 300}
                  style={[
                    styles.particle,
                    {
                      left: `${8 + Math.random() * 84}%` as any,
                      top: `${8 + Math.random() * 84}%` as any,
                      width: 4 + (i % 3) * 2,
                      height: 4 + (i % 3) * 2,
                      backgroundColor: "rgba(217,167,86,0.4)",
                    },
                  ]}
                />
              ))}
            </View>

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

              {/* CTA Button */}
              <TouchableOpacity
                style={styles.heroCTAButton}
                onPress={() => navigation.navigate("MenuTab")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#D9A756", "#B8923F"]}
                  style={styles.heroCTAGradient}
                >
                  <Text style={styles.heroCTAText}>EXPLORE OUR MENU</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Scroll indicator */}
            <ScrollIndicator />
          </LinearGradient>
        </View>

        {/* ══════════ HERO MIDDLE SECTION ══════════ */}
        <ImageBackground
          source={require("../assets/images/hero-bg.jpg")}
          style={styles.heroMiddleContainer}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              "rgba(26,13,10,0.9)",
              "rgba(74,44,23,0.7)",
              "rgba(26,13,10,0.9)",
            ]}
            style={styles.heroMiddleOverlay}
          >
            {/* Floating particles */}
            <View style={styles.particleContainer}>
              {Array.from({ length: 8 }).map((_, i) => (
                <AnimatedParticle
                  key={`mid-particle-${i}`}
                  delay={i * 500}
                  style={[
                    styles.particle,
                    {
                      left: `${10 + Math.random() * 80}%` as any,
                      top: `${10 + Math.random() * 80}%` as any,
                      width: 4 + (i % 3) * 2,
                      height: 4 + (i % 3) * 2,
                      backgroundColor: "rgba(217,167,86,0.3)",
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.heroMiddleContent}>
              <Text style={styles.heroMiddleSubtitle}>◆ Est. 2014 ◆</Text>
              <Text style={styles.heroMiddleTitle}>
                A Local Favorite for{"\n"}
                <Text style={{ color: colors.secondary.main }}>
                  Over a Decade
                </Text>
              </Text>
              <GoldDivider style={{ width: 100, marginVertical: spacing.md }} />
              <Text style={styles.heroMiddleDesc}>
                Experience the warmth of our classic pub atmosphere, where great
                food, cold drinks, and unforgettable moments come together. A
                place where neighbors become friends and every visit feels like
                coming home.
              </Text>
              <View style={styles.heroMiddleButtons}>
                <TouchableOpacity
                  style={styles.heroMiddleBtn}
                  onPress={() => navigation.navigate("MenuTab")}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#D9A756", "#B8923F"]}
                    style={styles.heroMiddleBtnGradient}
                  >
                    <Text style={styles.heroMiddleBtnText}>Explore Menu</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.heroMiddleBtn, styles.heroMiddleBtnOutline]}
                  onPress={() => navigation.navigate("AboutTab")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroMiddleBtnOutlineText}>Our Story</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.heroMiddleBottomAccent}>
                <LinearGradient
                  colors={["transparent", "rgba(217,167,86,0.5)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 1, flex: 1 }}
                />
                <Text style={styles.heroMiddleLocationText}>
                  Brooklin, Ontario
                </Text>
                <LinearGradient
                  colors={["rgba(217,167,86,0.5)", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 1, flex: 1 }}
                />
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* ══════════ UPCOMING EVENTS ACCORDION ══════════ */}
        {displayableEvents.length > 0 && (
          <View style={styles.eventsSection}>
            {/* Floating accent elements */}
            <View style={styles.floatingAccents}>
              {Array.from({ length: 6 }).map((_, i) => (
                <AnimatedParticle
                  key={`event-particle-${i}`}
                  delay={i * 400}
                  style={[
                    styles.floatingParticle,
                    {
                      left: `${5 + ((i * 13) % 90)}%` as any,
                      top: `${15 + ((i * 12) % 70)}%` as any,
                      width: 6 + (i % 3) * 2,
                      height: 6 + (i % 3) * 2,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Header */}
            <View style={styles.eventsSectionHeader}>
              <GoldAccentLine width={80} />
              <Text style={styles.eventsSectionOverline}>
                ◆ What's Happening ◆
              </Text>
              <Text style={styles.eventsSectionTitle}>
                Upcoming{" "}
                <Text style={{ color: colors.secondary.main }}>Events</Text>
              </Text>
              <Text style={styles.eventsSectionSubtitle}>
                Unforgettable experiences, live entertainment, and celebrations
                that bring our community together
              </Text>
              <LinearGradient
                colors={["transparent", "rgba(217,167,86,0.5)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.eventsSectionDivider}
              />
            </View>

            {/* Accordion Cards */}
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
          </View>
        )}

        {/* ══════════ TEAM ZIGZAG SECTION ══════════ */}
        <View style={styles.teamSection}>
          {/* Header */}
          <View style={styles.teamHeader}>
            <GoldAccentLine width={80} />
            <Text style={styles.teamOverline}>
              ◆ The Heart of Brooklin Pub ◆
            </Text>
            <Text style={styles.teamTitle}>
              Meet Our{" "}
              <Text style={{ color: colors.secondary.main }}>
                Dedicated Team
              </Text>
            </Text>
            <Text style={styles.teamSubtitle}>
              The passionate people behind every exceptional meal, warm welcome,
              and unforgettable moment at Brooklin Pub.
            </Text>
            <LinearGradient
              colors={["transparent", "rgba(217,167,86,0.5)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.teamDividerLine}
            />
          </View>

          {/* Zigzag Cards */}
          {TEAM_MEMBERS.map((member, index) => (
            <TeamZigzagCard
              key={member.id}
              member={member}
              index={index}
              onPress={() => navigation.navigate("AboutTab")}
            />
          ))}

          {/* Bottom decorative element */}
          <View style={styles.teamBottomDecor}>
            <LinearGradient
              colors={["transparent", "rgba(217,167,86,0.5)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.teamBottomLine}
            />
            <View style={styles.teamBottomDiamond} />
            <Text style={styles.teamBottomText}>
              SERVING WITH PRIDE SINCE 2014
            </Text>
            <View style={styles.teamBottomDiamond} />
            <LinearGradient
              colors={["rgba(217,167,86,0.5)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.teamBottomLine}
            />
          </View>
        </View>

        {/* ══════════ ORDER ONLINE CTA SECTION ══════════ */}
        <View style={styles.orderSection}>
          <LinearGradient
            colors={[
              "rgba(217,167,86,0.12)",
              "rgba(217,167,86,0.05)",
              "rgba(217,167,86,0.12)",
            ]}
            style={styles.orderGradient}
          >
            <Text style={styles.orderOverline}>HUNGRY?</Text>
            <Text style={styles.orderTitle}>Order Online</Text>
            <Text style={styles.orderDesc}>
              Skip the wait and order your favorites for pickup or delivery
            </Text>
            <GoldButton
              title="Order Now"
              onPress={() => Linking.openURL(EXTERNAL_URLS.ORDER_ONLINE)}
              icon={
                <Ionicons
                  name="restaurant-outline"
                  size={18}
                  color={colors.primary.dark}
                />
              }
            />
          </LinearGradient>
        </View>

        {/* ══════════ CONTACT QUICK INFO ══════════ */}
        <View style={styles.quickContactSection}>
          <SectionHeader title="Visit Us" subtitle="Come Say Hello" />
          <View style={styles.quickContactGrid}>
            <GlassCard style={styles.quickContactCard}>
              <Ionicons
                name="location-outline"
                size={24}
                color={colors.secondary.main}
              />
              <Text style={styles.quickContactLabel}>Address</Text>
              <Text style={styles.quickContactValue}>
                {CONTACT_INFO.ADDRESS.STREET}
              </Text>
              <Text style={styles.quickContactSub}>
                {CONTACT_INFO.ADDRESS.CITY}, {CONTACT_INFO.ADDRESS.PROVINCE}
              </Text>
            </GlassCard>
            <GlassCard style={styles.quickContactCard}>
              <Ionicons
                name="call-outline"
                size={24}
                color={colors.secondary.main}
              />
              <Text style={styles.quickContactLabel}>Phone</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${CONTACT_INFO.PHONE_RAW}`)}
              >
                <Text
                  style={[
                    styles.quickContactValue,
                    { color: colors.secondary.main },
                  ]}
                >
                  {CONTACT_INFO.PHONE}
                </Text>
              </TouchableOpacity>
              <Text style={styles.quickContactSub}>Tap to call</Text>
            </GlassCard>
          </View>

          {openStatus && (
            <View
              style={[
                styles.openStatusBanner,
                {
                  backgroundColor: openStatus.isOpen
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(138,42,42,0.1)",
                  borderColor: openStatus.isOpen
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(138,42,42,0.3)",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: openStatus.isOpen
                      ? colors.success
                      : colors.error,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: openStatus.isOpen ? colors.success : colors.error,
                  },
                ]}
              >
                {openStatus.isOpen
                  ? "We're Currently Open!"
                  : "We're Currently Closed"}
              </Text>
            </View>
          )}
        </View>

        {/* ══════════ FOOTER ══════════ */}
        <Footer openStatus={openStatus} />
      </ScrollView>

      {/* ══════════ FLOATING CALL BUTTON ══════════ */}
      <FloatingCallButton />

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

  /* ──── Landing Hero ──── */
  heroContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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
  heroCTAButton: {
    marginTop: spacing.xl,
    borderRadius: 50,
    overflow: "hidden",
    ...shadows.gold,
  },
  heroCTAGradient: {
    paddingHorizontal: Math.max(24, SCREEN_WIDTH * 0.08),
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
    paddingVertical: spacing["3xl"],
    backgroundColor: colors.background.default,
    position: "relative",
    overflow: "hidden",
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

  /* ──── Team Zigzag Section ──── */
  teamSection: {
    paddingVertical: spacing["3xl"],
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
