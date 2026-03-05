import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking,
  Animated,
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
import { eventsService } from "../services/events.service";
import { getImageUrl } from "../services/api";
import type { Event } from "../types/api.types";
import {
  SectionHeader,
  GoldDivider,
  GlassCard,
  ErrorView,
  GoldButton,
  CornerAccents,
  AnimatedBackground,
} from "../components/common/SharedComponents";
import HeroSection from "../components/common/HeroSection";
import Footer from "../components/common/Footer";
import FloatingCallButton from "../components/common/FloatingCallButton";
import LoadingScreen from "../components/common/LoadingScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Date helpers (EST timezone) ──────────────────────────────────────────────
const TZ = "America/Toronto";

const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TZ,
  });
};

const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
};

const getEventDay = (dateString: string): number =>
  parseInt(
    new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      timeZone: TZ,
    }),
    10,
  );

const getEventMonth = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    timeZone: TZ,
  });

// ─── Event period (duration/range) — ported from frontend ─────────────────────
const getEventPeriod = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startHour = parseInt(
    start.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: TZ,
    }),
  );
  const startMinute = parseInt(
    start.toLocaleTimeString("en-US", { minute: "numeric", timeZone: TZ }),
  );
  const endHour = parseInt(
    end.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: TZ,
    }),
  );
  const endMinute = parseInt(
    end.toLocaleTimeString("en-US", { minute: "numeric", timeZone: TZ }),
  );

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: TZ,
    });

  const isStartMidnight = startHour === 0 && startMinute === 0;
  const isEndMidnight = endHour === 0 && endMinute === 0;

  const startDateOnly = new Date(
    start.toLocaleDateString("en-US", { timeZone: TZ }),
  );
  const endDateOnly = new Date(
    end.toLocaleDateString("en-US", { timeZone: TZ }),
  );
  const dayDiff = Math.round(
    (endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24),
  );

  const displayEnd =
    isEndMidnight && dayDiff >= 1 ? new Date(end.getTime() - 1) : end;

  const startDay = start.toLocaleDateString("en-US", {
    day: "numeric",
    timeZone: TZ,
  });
  const startMonth = start.toLocaleDateString("en-US", {
    month: "short",
    timeZone: TZ,
  });
  const displayEndDay = displayEnd.toLocaleDateString("en-US", {
    day: "numeric",
    timeZone: TZ,
  });
  const displayEndMonth = displayEnd.toLocaleDateString("en-US", {
    month: "short",
    timeZone: TZ,
  });

  const displayEndDateOnly = new Date(
    displayEnd.toLocaleDateString("en-US", { timeZone: TZ }),
  );
  const effectiveDayDiff = Math.round(
    (displayEndDateOnly.getTime() - startDateOnly.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  // Same calendar day
  if (dayDiff === 0) return `${fmtTime(start)} - ${fmtTime(end)}`;

  // Overnight (ends next day before noon or at midnight)
  if (dayDiff === 1 && (isEndMidnight || endHour < 12))
    return `${fmtTime(start)} - ${fmtTime(end)}`;

  // Single full day
  if (dayDiff === 1 && isStartMidnight && isEndMidnight) {
    const weekday = start.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: TZ,
    });
    return `${weekday}, ${startMonth} ${startDay}`;
  }

  // Collapsed to same day after display-end adjustment
  if (effectiveDayDiff === 0) {
    const weekday = start.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: TZ,
    });
    return `${weekday}, ${startMonth} ${startDay}`;
  }

  // Multi-day range
  if (startMonth === displayEndMonth)
    return `${startMonth} ${startDay} - ${displayEndDay}`;
  return `${startMonth} ${startDay} - ${displayEndMonth} ${displayEndDay}`;
};

// ─── Event styling helpers ────────────────────────────────────────────────────
const EVENT_COLORS: Record<string, string> = {
  live_music: colors.secondary.main,
  sports_viewing: "#C5933E",
  trivia_night: colors.secondary.dark,
  karaoke: "#D4A857",
  private_party: "#C9984A",
  special_event: colors.secondary.main,
};

const EVENT_LABELS: Record<string, string> = {
  live_music: "Live Music",
  sports_viewing: "Sports",
  trivia_night: "Trivia Night",
  karaoke: "Karaoke",
  private_party: "Private Event",
  special_event: "Special Event",
};

const getEventColor = (type: string) =>
  EVENT_COLORS[type] ?? colors.secondary.main;
const getEventLabel = (type: string) => EVENT_LABELS[type] ?? "Event";

// ─── Event type cards for "Host Your Event" section ───────────────────────────
const HOST_EVENT_TYPES = [
  {
    icon: "gift-outline" as const,
    title: "Birthday Parties",
    desc: "Celebrate another trip around the sun",
  },
  {
    icon: "school-outline" as const,
    title: "Graduations",
    desc: "Toast to their big achievement",
  },
  {
    icon: "briefcase-outline" as const,
    title: "Private Events",
    desc: "Team building done right",
  },
  {
    icon: "sparkles-outline" as const,
    title: "Special Occasions",
    desc: "Anniversaries, reunions & milestones",
  },
];

const FEATURES = [
  "Private & semi-private spaces for 100+ guests",
  "Customizable food & drink packages",
  "AV equipment for presentations",
  "Dedicated event coordinator",
  "Flexible booking times",
];

// ─── Diagonal Event Item ──────────────────────────────────────────────────────
const EventItem = ({
  event,
  isPast = false,
  onNavigateToContact,
  index = 0,
}: {
  event: Event;
  isPast?: boolean;
  onNavigateToContact: () => void;
  index?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const color = isPast ? colors.primary.light : getEventColor(event.type);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = index * 120;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <View style={styles.eventCard}>
        {/* Image section */}
        <View style={styles.eventImageSection}>
          <Image
            source={{
              uri: event.imageUrls?.[0]
                ? getImageUrl(event.imageUrls[0])
                : "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
            }}
            style={styles.eventImage}
            contentFit="cover"
            transition={300}
          />
          {/* Gradient overlay */}
          <LinearGradient
            colors={["transparent", colors.overlay.warmMedium]}
            style={styles.eventImageOverlay}
          />
          {/* Type badge */}
          <LinearGradient
            colors={
              isPast
                ? [colors.primary.light, colors.primary.main]
                : [color, `${color}DD`]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.eventTypeBadge}
          >
            <Text style={styles.eventTypeBadgeText}>
              {isPast ? "Past Event" : getEventLabel(event.type)}
            </Text>
          </LinearGradient>
          {/* Date circle badge */}
          <LinearGradient
            colors={[color, `${color}DD`]}
            style={styles.eventDateBadge}
          >
            <Text style={styles.eventDateDay}>
              {getEventDay(event.eventStartDate)}
            </Text>
            <Text style={styles.eventDateMonth}>
              {getEventMonth(event.eventStartDate)}
            </Text>
          </LinearGradient>
          <CornerAccents size={10} color={color} />
          {/* Decorative frame border inside image */}
          <View
            style={[styles.eventImageFrame, { borderColor: `${color}40` }]}
          />
        </View>

        {/* Content section */}
        <View style={styles.eventContent}>
          {/* Gold accent line */}
          <LinearGradient
            colors={
              isPast
                ? [colors.primary.light, colors.primary.main]
                : [color, `${color}DD`]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.eventAccentLine}
          />

          <Text style={styles.eventTitle}>{event.title}</Text>

          {/* Info pills */}
          <View style={styles.eventInfoRow}>
            {/* Event period badge (duration / date range) */}
            {event.eventEndDate &&
              event.eventEndDate !== event.eventStartDate && (
                <View
                  style={[
                    styles.eventInfoPill,
                    {
                      borderColor: `${color}40`,
                      backgroundColor: `${color}12`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.eventInfoText,
                      {
                        color,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        fontSize: 10,
                        letterSpacing: 0.5,
                      },
                    ]}
                  >
                    {getEventPeriod(event.eventStartDate, event.eventEndDate)}
                  </Text>
                </View>
              )}
            <View style={styles.eventInfoPill}>
              <Ionicons name="calendar-outline" size={12} color={color} />
              <Text style={styles.eventInfoText}>
                {formatEventDate(event.eventStartDate)}
              </Text>
            </View>
            <View style={styles.eventInfoPill}>
              <Ionicons name="time-outline" size={12} color={color} />
              <Text style={styles.eventInfoText}>
                {formatEventTime(event.eventStartDate)}
              </Text>
            </View>
            <View style={styles.eventInfoPill}>
              <Ionicons name="location-outline" size={12} color={color} />
              <Text style={styles.eventInfoText}>Brooklin Pub</Text>
            </View>
          </View>

          {/* Description */}
          <Text
            style={styles.eventDescription}
            numberOfLines={expanded ? undefined : 3}
          >
            {event.description}
          </Text>

          {/* Action buttons */}
          <View style={styles.eventActions}>
            {event.ticketLink && (
              <TouchableOpacity
                style={styles.eventTicketBtn}
                onPress={() => Linking.openURL(event.ticketLink!)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[color, `${color}DD`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.eventTicketBtnInner}
                >
                  <Text style={styles.eventTicketBtnText}>Get Tickets</Text>
                  <Ionicons
                    name="ticket-outline"
                    size={14}
                    color={colors.background.paper}
                  />
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.eventLearnMoreBtn,
                !event.ticketLink && { borderColor: color },
              ]}
              onPress={() => setExpanded(!expanded)}
              activeOpacity={0.8}
            >
              {event.ticketLink ? (
                <View
                  style={[styles.eventLearnMoreInner, { borderColor: color }]}
                >
                  <Text style={[styles.eventLearnMoreText, { color }]}>
                    {expanded ? "Show Less" : "Learn More"}
                  </Text>
                  <Ionicons
                    name={expanded ? "chevron-up" : "arrow-forward"}
                    size={14}
                    color={color}
                  />
                </View>
              ) : (
                <LinearGradient
                  colors={[color, `${color}DD`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.eventTicketBtnInner}
                >
                  <Text style={styles.eventTicketBtnText}>
                    {expanded ? "Show Less" : "Learn More"}
                  </Text>
                  <Ionicons
                    name={expanded ? "chevron-up" : "arrow-forward"}
                    size={14}
                    color={colors.background.paper}
                  />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function EventsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const {
    data: eventsData,
    loading,
    error,
    refetch,
  } = useApiWithCache<Event[]>("all-events-page", () =>
    eventsService.getAllEvents(),
  );

  const { upcomingEvents, pastEvents } = useMemo(() => {
    if (!eventsData)
      return { upcomingEvents: [] as Event[], pastEvents: [] as Event[] };
    const now = new Date();
    const upcoming: Event[] = [];
    const past: Event[] = [];

    eventsData
      .filter((e) => e.isActive)
      .forEach((event) => {
        const end = new Date(event.eventEndDate);
        (end >= now ? upcoming : past).push(event);
      });

    upcoming.sort(
      (a, b) =>
        new Date(a.eventStartDate).getTime() -
        new Date(b.eventStartDate).getTime(),
    );
    past.sort(
      (a, b) =>
        new Date(b.eventStartDate).getTime() -
        new Date(a.eventStartDate).getTime(),
    );

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [eventsData]);

  // Group events by month
  const groupByMonth = useCallback((events: Event[]) => {
    const grouped: Record<string, Event[]> = {};
    events.forEach((event) => {
      const key = new Date(event.eventStartDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, []);

  const upcomingByMonth = useMemo(
    () => groupByMonth(upcomingEvents),
    [upcomingEvents],
  );
  const pastByMonth = useMemo(() => groupByMonth(pastEvents), [pastEvents]);

  const navigateToContact = useCallback(() => {
    navigation.navigate("ContactTab");
  }, [navigation]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero */}
        <HeroSection
          title="Discover Events"
          overlineText="✦ WHAT'S HAPPENING ✦"
          subtitle="From trivia nights to game days, there's always something happening at The Brooklin Pub. Pull up a chair."
          variant="light"
          height={280}
        />

        {/* ════ Section Header ════ */}
        <View style={styles.sectionHeaderWrap}>
          <GoldDivider width={80} marginVertical={spacing.sm} />
          <Text style={styles.sectionOverline}>◆ Mark Your Calendar ◆</Text>
          <Text style={styles.sectionTitle}>
            Featured{" "}
            <Text style={{ color: colors.secondary.main }}>Experiences</Text>
          </Text>
          <GoldDivider width={120} marginVertical={spacing.md} />
        </View>

        {/* ════ Upcoming Events ════ */}
        {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="calendar-outline"
                size={36}
                color={colors.secondary.main}
              />
            </View>
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptyText}>
              We're planning something special! Check back soon for upcoming
              events.
            </Text>
          </View>
        ) : (
          <>
            {upcomingEvents.length > 0 ? (
              Object.entries(upcomingByMonth).map(([monthYear, events]) => (
                <View key={monthYear} style={styles.monthGroup}>
                  {/* Month header */}
                  <View style={styles.monthHeader}>
                    <Text style={styles.monthTitle}>{monthYear}</Text>
                    <View style={styles.monthLine} />
                    <View style={styles.monthCountBadge}>
                      <Text style={styles.monthCountText}>
                        {events.length} event{events.length > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                  {events.map((event, idx) => (
                    <EventItem
                      key={event.id}
                      event={event}
                      index={idx}
                      onNavigateToContact={navigateToContact}
                    />
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={28}
                    color={colors.secondary.main}
                  />
                </View>
                <Text style={styles.emptyTitle}>No Upcoming Events</Text>
                <Text style={styles.emptyText}>
                  Check back soon for new events!
                </Text>
              </View>
            )}

            {/* ════ Past Events ════ */}
            {pastEvents.length > 0 && (
              <View style={styles.pastSection}>
                <View style={styles.sectionHeaderWrap}>
                  <GoldDivider width={80} marginVertical={spacing.sm} />
                  <Text
                    style={[
                      styles.sectionOverline,
                      { color: colors.primary.light },
                    ]}
                  >
                    ◆ Past Memories ◆
                  </Text>
                  <Text style={styles.sectionTitle}>
                    Previous{" "}
                    <Text style={{ color: colors.primary.light }}>Events</Text>
                  </Text>
                  <GoldDivider width={120} marginVertical={spacing.md} />
                </View>

                {Object.entries(pastByMonth).map(([monthYear, events]) => (
                  <View
                    key={monthYear}
                    style={[styles.monthGroup, { opacity: 0.85 }]}
                  >
                    <View style={styles.monthHeader}>
                      <Text style={[styles.monthTitle, { opacity: 0.8 }]}>
                        {monthYear}
                      </Text>
                      <View
                        style={[
                          styles.monthLine,
                          { backgroundColor: "rgba(139,90,43,0.3)" },
                        ]}
                      />
                      <View
                        style={[
                          styles.monthCountBadge,
                          {
                            backgroundColor: "rgba(139,90,43,0.15)",
                            borderColor: "rgba(139,90,43,0.2)",
                          },
                        ]}
                      >
                        <Text style={styles.monthCountText}>
                          {events.length} event{events.length > 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>
                    {events.map((event, idx) => (
                      <EventItem
                        key={event.id}
                        event={event}
                        isPast
                        index={idx}
                        onNavigateToContact={navigateToContact}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ════ Decorative "More Events Coming Soon" ════ */}
        <View style={styles.moreComingSoon}>
          <View style={styles.moreComingLine} />
          <View style={styles.moreComingDiamond} />
          <Text style={styles.moreComingText}>More Events Coming Soon</Text>
          <View style={styles.moreComingDiamond} />
          <View style={styles.moreComingLine} />
        </View>

        {/* ════ Host Your Event ════ */}
        <LinearGradient
          colors={["#F5EBE0", "#E8D5C4", "#DBC7B0"]}
          style={styles.hostSection}
        >
          <AnimatedBackground variant="light" particleCount={8} />
          <Text style={styles.hostOverline}>◆ Book Brooklin Pub ◆</Text>
          <Text style={styles.hostTitle}>
            Host Your Next{" "}
            <Text style={{ color: colors.secondary.main }}>Celebration</Text>
          </Text>
          <Text style={styles.hostDesc}>
            From milestone birthdays to corporate gatherings, we've got the
            space, the food, and the vibe to make your event one for the books.
          </Text>

          {/* Event type cards */}
          <View style={styles.hostTypesGrid}>
            {HOST_EVENT_TYPES.map((item, i) => (
              <GlassCard key={i} style={styles.hostTypeCard}>
                <Ionicons
                  name={item.icon}
                  size={32}
                  color={colors.secondary.main}
                />
                <Text style={styles.hostTypeTitle}>{item.title}</Text>
                <Text style={styles.hostTypeDesc}>{item.desc}</Text>
              </GlassCard>
            ))}
          </View>

          {/* Features + CTA */}
          <GlassCard style={styles.hostFeaturesCard}>
            <Text style={styles.hostFeaturesTitle}>What We Offer</Text>
            {FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <LinearGradient
                  colors={[colors.secondary.main, colors.secondary.dark]}
                  style={styles.featureCheckCircle}
                >
                  <Text style={styles.featureCheck}>✓</Text>
                </LinearGradient>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}

            <View style={styles.hostCTABox}>
              <LinearGradient
                colors={["#8B5A3C", colors.primary.main]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hostCTAInner}
              >
                <View style={styles.hostCTAIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={colors.secondary.main}
                  />
                </View>
                <Text style={styles.hostCTATitle}>Ready to Plan?</Text>
                <Text style={styles.hostCTADesc}>
                  Let's make your event special
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={navigateToContact}
                >
                  <LinearGradient
                    colors={[colors.secondary.main, colors.secondary.dark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hostCTAButton}
                  >
                    <Text style={styles.hostCTAButtonText}>
                      Book Your Event
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={colors.background.paper}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </GlassCard>
        </LinearGradient>

        <Footer />
      </ScrollView>

      {/* Floating call FAB */}
      <FloatingCallButton />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.default,
  },

  /* Section header */
  sectionHeaderWrap: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  sectionOverline: {
    color: colors.secondary.main,
    letterSpacing: 3,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.primary.dark,
    textAlign: "center",
    letterSpacing: -0.3,
  },

  /* Month group */
  monthGroup: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  monthTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.primary.dark,
  },
  monthLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border.goldStrong,
    borderRadius: 1,
  },
  monthCountBadge: {
    backgroundColor: colors.glass.gold,
    borderWidth: 1,
    borderColor: colors.border.gold,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  monthCountText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
  },

  /* Event card */
  eventCard: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: "hidden",
    ...shadows.card,
  },
  eventImageSection: {
    width: "100%",
    height: 220,
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  eventImageFrame: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 2,
    borderRadius: borderRadius.lg,
  },
  eventTypeBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    zIndex: 5,
  },
  eventTypeBadgeText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 10,
    color: colors.background.paper,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  eventDateBadge: {
    position: "absolute",
    bottom: spacing.md,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.background.paper,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  eventDateDay: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.background.paper,
    lineHeight: 24,
  },
  eventDateMonth: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 9,
    color: colors.background.paper,
    textTransform: "uppercase",
  },

  /* Event content */
  eventContent: {
    padding: spacing.lg,
  },
  eventAccentLine: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  eventTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.primary.dark,
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.xl * 1.25,
  },
  eventInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  eventInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.glass.gold,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.gold,
  },
  eventInfoText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 11,
    color: colors.primary.main,
  },
  eventDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(60,31,14,0.75)",
    lineHeight: typography.fontSize.sm * 1.85,
    marginBottom: spacing.md,
  },
  eventActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  eventTicketBtn: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  eventTicketBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  eventTicketBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 12,
    color: colors.background.paper,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  eventLearnMoreBtn: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  eventLearnMoreInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 1,
    borderRadius: borderRadius.full,
    borderWidth: 2,
  },
  eventLearnMoreText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.base,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border.gold,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.glass.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.primary.light,
    lineHeight: typography.fontSize.base * 1.7,
    textAlign: "center",
  },

  /* Past section */
  pastSection: {
    marginTop: spacing.xl,
  },

  /* More coming soon */
  moreComingSoon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  moreComingLine: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(217,167,86,0.5)",
  },
  moreComingDiamond: {
    width: 10,
    height: 10,
    borderWidth: 1.5,
    borderColor: colors.secondary.main,
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
  },
  moreComingText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: 10,
    color: "rgba(217,167,86,0.8)",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    textAlign: "center",
  },

  /* Host section */
  hostSection: {
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.base,
  },
  hostOverline: {
    textAlign: "center",
    color: colors.secondary.main,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  hostTitle: {
    textAlign: "center",
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.primary.dark,
    marginBottom: spacing.md,
    lineHeight: typography.fontSize["2xl"] * 1.2,
  },
  hostDesc: {
    textAlign: "center",
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
    lineHeight: typography.fontSize.base * 1.8,
    marginBottom: spacing.xl,
    maxWidth: 400,
    alignSelf: "center",
  },
  hostTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  hostTypeCard: {
    width: (SCREEN_WIDTH - spacing.base * 2 - spacing.md) / 2,
    alignItems: "center",
    padding: spacing.lg,
  },
  hostTypeTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.md,
    color: colors.primary.dark,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  hostTypeDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    textAlign: "center",
  },

  /* Features + CTA */
  hostFeaturesCard: {
    padding: spacing.xl,
  },
  hostFeaturesTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.primary.dark,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  featureCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCheck: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  featureText: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.primary.dark,
  },

  /* CTA box */
  hostCTABox: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  hostCTAInner: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  hostCTAIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(217,167,86,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  hostCTATitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.background.paper,
    marginBottom: spacing.xs,
  },
  hostCTADesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: "rgba(255,253,251,0.8)",
    marginBottom: spacing.lg,
  },
  hostCTAButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  hostCTAButtonText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: typography.fontSize.sm,
    color: colors.background.paper,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
});
