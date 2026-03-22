import React, { useMemo, useState, useCallback, useRef } from "react";
import ImageViewer from "../components/common/ImageViewer";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
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
import { eventsService } from "../services/events.service";
import { CONTACT_INFO } from "../config/constants";
import { getImageUrl } from "../services/api";
import type { Event, EventType } from "../types/api.types";
import { ErrorView } from "../components/common";
import { EventCardSkeleton } from "../components/common/SkeletonLoader";
import SocialFAB from "../components/common/SocialFAB";
import * as Haptics from "expo-haptics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TZ = "America/Toronto";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });

const fmtTime = (s: string) =>
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });

const fmtDay = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { day: "numeric", timeZone: TZ });

const fmtMonth = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { month: "short", timeZone: TZ });

const shouldDisplay = (event: Event): boolean => {
  if (!event.isActive) return false;
  const now = new Date();
  if (event.displayStartDate && event.displayEndDate) {
    return now >= new Date(event.displayStartDate) && now <= new Date(event.displayEndDate);
  }
  return true;
};

const TYPE_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  live_music:      { label: "Live Music",     icon: "musical-notes", color: "#7C3AED" },
  sports_viewing:  { label: "Sports",         icon: "football",      color: "#1D4ED8" },
  trivia_night:    { label: "Trivia Night",   icon: "help-circle",   color: "#0891B2" },
  karaoke:         { label: "Karaoke",        icon: "mic",           color: "#BE185D" },
  private_party:   { label: "Private Event",  icon: "people",        color: "#059669" },
  special_event:   { label: "Special Event",  icon: "star",          color: colors.primary.main },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

// ─── Event Detail Modal ───────────────────────────────────────────────────────

const EventDetailModal = ({
  event,
  visible,
  onClose,
}: {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!event) return null;
  const imageUrl = event.imageUrls?.[0] ? getImageUrl(event.imageUrls[0]) : null;
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.special_event;
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Image or gradient banner */}
            {imageUrl ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerUri(imageUrl)} style={styles.modalBannerWrap}>
                <Image source={{ uri: imageUrl }} style={styles.modalBanner} contentFit="contain" transition={300} />
              </TouchableOpacity>
            ) : (
              <LinearGradient
                colors={[colors.primary.dark, colors.primary.main]}
                style={[styles.modalBanner, { alignItems: "center", justifyContent: "center" }]}
              >
                <Ionicons name={cfg.icon} size={52} color={colors.secondary.main} />
              </LinearGradient>
            )}

            <View style={styles.modalBody}>
              {/* Type badge */}
              <View style={[styles.typeBadge, { backgroundColor: cfg.color + "22", borderColor: cfg.color + "55" }]}>
                <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>

              {/* Title */}
              <Text style={styles.modalTitle}>{event.title}</Text>

              {/* Date / Time rows */}
              <View style={styles.modalMeta}>
                <View style={styles.modalMetaRow}>
                  <View style={styles.metaIconWrap}>
                    <Ionicons name="calendar-outline" size={16} color={colors.secondary.main} />
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{fmtDate(event.eventStartDate)}</Text>
                  </View>
                </View>
                <View style={styles.modalMetaRow}>
                  <View style={styles.metaIconWrap}>
                    <Ionicons name="time-outline" size={16} color={colors.secondary.main} />
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Time</Text>
                    <Text style={styles.metaValue}>
                      {fmtTime(event.eventStartDate)} – {fmtTime(event.eventEndDate)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              {event.description ? (
                <Text style={styles.modalDesc}>{event.description}</Text>
              ) : null}

              {/* Actions */}
              <View style={styles.modalActions}>
                {event.ticketLink && (
                  <TouchableOpacity
                    style={styles.ticketBtn}
                    onPress={() => Linking.openURL(event.ticketLink!)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[colors.secondary.main, colors.secondary.dark]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.ticketBtnGradient}
                    >
                      <Ionicons name="ticket-outline" size={16} color="#1A0D0A" />
                      <Text style={styles.ticketBtnText}>Get Tickets</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.inquireBtn}
                  onPress={() => Linking.openURL(`mailto:brooklinpubevents@gmail.com?subject=Event Inquiry: ${event.title}`)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail-outline" size={16} color={colors.primary.main} />
                  <Text style={styles.inquireBtnText}>Inquire</Text>
                </TouchableOpacity>
              </View>
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

// ─── Event Card ───────────────────────────────────────────────────────────────

const EventCard = React.memo(({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) => {
  const imageUrl = event.imageUrls?.[0] ? getImageUrl(event.imageUrls[0]) : null;
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.special_event;

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.85}>
      {/* Date badge */}
      <View style={styles.dateBadge}>
        <Text style={styles.dateBadgeDay}>{fmtDay(event.eventStartDate)}</Text>
        <Text style={styles.dateBadgeMonth}>{fmtMonth(event.eventStartDate)}</Text>
      </View>

      {/* Main content */}
      <View style={styles.cardContent}>
        {/* Image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} contentFit="cover" transition={300} />
        ) : (
          <LinearGradient
            colors={[colors.primary.dark, colors.primary.main]}
            style={[styles.cardImage, { alignItems: "center", justifyContent: "center" }]}
          >
            <Ionicons name={cfg.icon} size={24} color={colors.secondary.main} />
          </LinearGradient>
        )}

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={[styles.cardTypePill, { backgroundColor: cfg.color + "18", borderColor: cfg.color + "44" }]}>
            <Ionicons name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[styles.cardTypePillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>

          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={12} color={colors.text.muted} />
            <Text style={styles.cardMetaText}>
              {fmtDate(event.eventStartDate)} · {fmtTime(event.eventStartDate)}
            </Text>
          </View>

          {event.ticketLink && (
            <View style={styles.ticketsAvailablePill}>
              <Ionicons name="ticket-outline" size={11} color={colors.secondary.dark} />
              <Text style={styles.ticketsAvailableText}>Tickets Available</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EventsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: events,
    loading,
    error,
    refetch,
  } = useApiWithCache<Event[]>("active-events", () => eventsService.getActiveEvents());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sortedEvents = useMemo((): Event[] => {
    if (!events) return [];
    return events
      .filter(shouldDisplay)
      .sort((a, b) => new Date(a.eventStartDate).getTime() - new Date(b.eventStartDate).getTime());
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!activeFilter) return sortedEvents;
    return sortedEvents.filter((e) => (e.type as string) === activeFilter);
  }, [sortedEvents, activeFilter]);

  // Build filter chips from event types present in data
  const presentTypes = useMemo(() => {
    const types = new Set(sortedEvents.map((e) => e.type));
    return ALL_TYPES.filter((t) => types.has(t as any));
  }, [sortedEvents]);

  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <Text style={styles.headerSubtitle}>
          {sortedEvents.length > 0
            ? `${sortedEvents.length} upcoming event${sortedEvents.length !== 1 ? "s" : ""}`
            : "What's on at Brooklin Pub"}
        </Text>
      </View>

      {/* ── Type Filter Chips ── */}
      {presentTypes.length > 0 && (
        <View style={styles.filterRow}>
          <FlatList
            horizontal
            data={[null, ...presentTypes]}
            keyExtractor={(item) => item ?? "all"}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            renderItem={({ item }) => {
              const isActive = item === activeFilter;
              const cfg = item ? TYPE_CONFIG[item] : null;
              return (
                <TouchableOpacity
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveFilter(item);
                  }}
                  activeOpacity={0.75}
                >
                  {cfg && (
                    <Ionicons
                      name={cfg.icon}
                      size={13}
                      color={isActive ? "#FFFDFB" : cfg.color}
                    />
                  )}
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {item ? TYPE_CONFIG[item].label : "All Events"}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* ── Events List ── */}
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
        {loading ? (
          <View style={styles.skeletonWrap}>
            {[1, 2, 3].map((i) => <EventCardSkeleton key={i} />)}
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={52} color={colors.border.gold} />
            <Text style={styles.emptyTitle}>
              {activeFilter ? "No events of this type" : "No Upcoming Events"}
            </Text>
            <Text style={styles.emptyDesc}>
              {activeFilter
                ? "Try a different filter or check back later."
                : "We're always planning something new. Check back soon!"}
            </Text>
            {activeFilter && (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => setActiveFilter(null)}
              >
                <Text style={styles.clearFilterText}>Show All Events</Text>
              </TouchableOpacity>
            )}

            {/* Host an event CTA */}
            <View style={styles.hostCTA}>
              <LinearGradient
                colors={[colors.primary.dark, "#2A1208"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.hostCTATitle}>Host Your Event Here</Text>
              <Text style={styles.hostCTADesc}>
                Birthdays, corporate events, sports watch parties and more.
              </Text>
              <TouchableOpacity
                style={styles.hostCTABtn}
                onPress={() => navigation.navigate("InfoTab", { screen: "Contact" })}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.secondary.main, colors.secondary.dark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.hostCTABtnGradient}
                >
                  <Text style={styles.hostCTABtnText}>Get In Touch</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedEvent(event);
                  setShowModal(true);
                }}
              />
            ))}

            {/* Host CTA at bottom */}
            <View style={[styles.hostCTA, { marginTop: spacing.base }]}>
              <LinearGradient
                colors={[colors.primary.dark, "#2A1208"]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.hostCTATitle}>Host Your Own Event</Text>
              <Text style={styles.hostCTADesc}>
                Private parties, corporate events, live music bookings.
              </Text>
              <TouchableOpacity
                style={styles.hostCTABtn}
                onPress={() => navigation.navigate("InfoTab", { screen: "Contact" })}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.secondary.main, colors.secondary.dark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.hostCTABtnGradient}
                >
                  <Text style={styles.hostCTABtnText}>Contact Us</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Event Detail Modal ── */}
      <EventDetailModal
        event={selectedEvent}
        visible={showModal}
        onClose={() => setShowModal(false)}
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

  // ── Filter
  filterRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.paper,
    borderWidth: 1.5,
    borderColor: colors.border.light,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  filterChipTextActive: {
    color: "#FFFDFB",
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.base },
  skeletonWrap: { paddingHorizontal: spacing.base },
  eventsList: { paddingHorizontal: spacing.base },

  // ── Event Card
  eventCard: {
    flexDirection: "row",
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  dateBadge: {
    width: 52,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary.main,
    alignSelf: "stretch",
  },
  dateBadgeDay: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.secondary.main,
    lineHeight: 28,
  },
  dateBadgeMonth: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs - 1,
    color: "rgba(217,167,86,0.7)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.sm,
  },
  cardImage: {
    width: 72,
    height: 72,
    margin: spacing.sm,
    borderRadius: borderRadius.md,
  },
  cardInfo: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xs,
    gap: 4,
  },
  cardTypePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  cardTypePillText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.headingMedium,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 21,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  ticketsAvailablePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ticketsAvailableText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 10,
    color: colors.secondary.dark,
  },

  // ── Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.xl,
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
    maxWidth: "85%",
  },
  clearFilterBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.full,
  },
  clearFilterText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#FFFDFB",
  },

  // ── Host CTA
  hostCTA: {
    marginHorizontal: 0,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  hostCTATitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: "#FFFDFB",
  },
  hostCTADesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: "rgba(255,253,251,0.65)",
    lineHeight: 22,
  },
  hostCTABtn: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  hostCTABtnGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  hostCTABtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#1A0D0A",
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
    maxHeight: "90%",
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
  modalBannerWrap: {
    position: "relative",
  },
  modalBanner: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  modalBody: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  typeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  typeBadgeText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    letterSpacing: 0.3,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    lineHeight: 38,
    marginBottom: spacing.base,
  },
  modalMeta: {
    gap: spacing.md,
    marginBottom: spacing.base,
    padding: spacing.base,
    backgroundColor: "rgba(217,167,86,0.06)",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  metaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(217,167,86,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  metaValue: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  modalDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    lineHeight: 24,
    marginBottom: spacing.base,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ticketBtn: {
    flex: 1,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...shadows.gold,
  },
  ticketBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
  },
  ticketBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: "#1A0D0A",
  },
  inquireBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border.gold,
  },
  inquireBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
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
