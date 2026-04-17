import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApiWithCache } from "../hooks/useApi";
import { openingHoursService } from "../services/opening-hours.service";
import { contactService, type ContactFormData } from "../services/contact.service";
import type { OpeningHours } from "../types/api.types";
import {
  CONTACT_INFO,
  EXTERNAL_URLS,
  SUBJECT_OPTIONS,
} from "../config/constants";
import { colors, typography, spacing, borderRadius, shadows } from "../config/theme";
import FloatingCallButton from "../components/common/FloatingCallButton";
import { useScrollBottomPadding } from "../config/layout";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt12 = (time: string): string => {
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return min === "00" ? `${h} ${period}` : `${h}:${min} ${period}`;
};

const buildHoursDisplay = (hours: OpeningHours[] | null): { days: string; time: string }[] => {
  if (!hours || hours.length === 0) {
    return [
      { days: "Sun – Thu", time: "11 AM – 11 PM" },
      { days: "Fri – Sat", time: "11 AM – 2 AM" },
    ];
  }
  const order = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const abbr: Record<string, string> = {
    monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
    friday: "Fri", saturday: "Sat", sunday: "Sun",
  };
  const groups: Record<string, string[]> = {};
  hours.forEach((h) => {
    const closed = !h.isOpen || !h.isActive || !h.openTime || !h.closeTime;
    const key = closed ? "Closed" : `${h.openTime} - ${h.closeTime}`;
    const day = abbr[h.dayOfWeek?.toLowerCase()] || h.dayOfWeek;
    if (!groups[key]) groups[key] = [];
    groups[key].push(day);
  });
  return Object.entries(groups).map(([time, days]) => {
    days.sort((a, b) => {
      const ai = order.findIndex((d) => abbr[d] === a);
      const bi = order.findIndex((d) => abbr[d] === b);
      return ai - bi;
    });
    const daysStr =
      days.length === 7 ? "Every Day"
      : days.length >= 2 ? `${days[0]} – ${days[days.length - 1]}`
      : days[0];
    const timeStr = time === "Closed" ? "Closed"
      : (() => { const [a, b] = time.split(" - "); return `${fmt12(a.trim())} – ${fmt12(b.trim())}`; })();
    return { days: daysStr, time: timeStr };
  });
};

// ─── Form Field ───────────────────────────────────────────────────────────────

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  multiline,
  lines = 4,
  required,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: TextInput["props"]["keyboardType"];
  multiline?: boolean;
  lines?: number;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>
      {label}{required && <Text style={styles.required}> *</Text>}
    </Text>
    <View style={[styles.fieldInput, error ? styles.fieldInputError : null, multiline && styles.fieldInputMulti]}>
      {icon && <Ionicons name={icon} size={16} color={error ? colors.error : colors.text.muted} style={styles.fieldIcon} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={lines}
        style={[styles.fieldTextInput, multiline && { minHeight: lines * 22, textAlignVertical: "top" }]}
      />
    </View>
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const scrollBottomPad = useScrollBottomPadding();
  const scrollRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<ContactFormData>({
    name: "", email: "", phone: "", subject: "",
    reservationDate: "", reservationTime: "",
    guestCount: undefined, position: "", message: "",
  });
  const [cvFile, setCvFile] = useState<{ name: string; uri: string; size: number; mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isReservation = formData.subject === "reservation";
  const isCareers = formData.subject === "careers";

  const { data: openingHoursData, refetch: hoursRefetch } = useApiWithCache<OpeningHours[]>(
    "opening-hours", () => openingHoursService.getAllOpeningHours(),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hoursRefetch();
    setRefreshing(false);
  }, [hoursRefetch]);

  const displayHours = buildHoursDisplay(openingHoursData ?? null);

  const setField = useCallback(
    (field: keyof ContactFormData, value: string | number | undefined) => {
      setFormData((p) => ({ ...p, [field]: value }));
      if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
    },
    [errors],
  );

  const pickDocument = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const f = res.assets[0];
        setCvFile({ name: f.name, uri: f.uri, size: f.size ?? 0, mimeType: f.mimeType ?? "" });
      }
    } catch {
      Alert.alert("Error", "Failed to pick document");
    }
  }, []);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!formData.name?.trim() || formData.name.trim().length < 2) e.name = "Enter your full name";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Enter a valid email";
    if (!formData.subject) e.subject = "Select a subject";
    if (isReservation) {
      if (!formData.reservationDate) e.reservationDate = "Enter a date";
      if (!formData.reservationTime) e.reservationTime = "Enter a time";
    }
    if (cvFile && cvFile.size > 5 * 1024 * 1024) e.cvFile = "File must be under 5 MB";
    if (!formData.message?.trim() || formData.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData, isReservation, cvFile]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let msg = formData.message;
      if (isReservation) {
        msg = `PARTY RESERVATION\n\nDate: ${formData.reservationDate}\nTime: ${formData.reservationTime}\nGuests: ${formData.guestCount}\n\n${formData.message}`;
      } else if (isCareers) {
        msg = `CAREERS APPLICATION\n\n${formData.message}${cvFile ? `\n\n[CV: ${cvFile.name}]` : ""}`;
      }
      const res = await contactService.submitContactForm({
        ...formData, message: msg,
        ...(isCareers && cvFile ? { cvFile: { uri: cvFile.uri, name: cvFile.name, type: cvFile.mimeType || "application/pdf" } } : {}),
      });
      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          setFormData({ name: "", email: "", phone: "", subject: "", reservationDate: "", reservationTime: "", guestCount: undefined, position: "", message: "" });
          setCvFile(null);
          setSubmitted(false);
        }, 5000);
      }
    } catch {
      const subj = isReservation ? `Party Reservation - ${formData.reservationDate}`
        : isCareers ? "Careers Application"
        : SUBJECT_OPTIONS.find((o) => o.value === formData.subject)?.label ?? "Contact from app";
      const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`;
      Linking.openURL(`mailto:${CONTACT_INFO.EMAIL_GENERAL}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`).catch(() => {});
    } finally {
      setLoading(false);
    }
  }, [formData, isReservation, isCareers, cvFile, validate]);

  const selectedSubjectLabel = SUBJECT_OPTIONS.find((o) => o.value === formData.subject)?.label ?? "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        style={[styles.root, { paddingTop: insets.top }]}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        keyboardShouldPersistTaps="handled"
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
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Contact Us</Text>
          <Text style={styles.headerSubtitle}>We'd love to hear from you</Text>
        </View>

        {/* ── Quick Contact ── */}
        <View style={styles.quickContactRow}>
          <TouchableOpacity
            style={styles.quickContactBtn}
            onPress={() => Linking.openURL(`tel:${CONTACT_INFO.PHONE_RAW}`)}
            activeOpacity={0.8}
          >
            <View style={styles.quickContactIcon}>
              <Ionicons name="call" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.quickContactText}>{CONTACT_INFO.PHONE}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickContactBtn}
            onPress={() =>
              Linking.openURL(`mailto:${CONTACT_INFO.EMAIL_GENERAL}`)
            }
            activeOpacity={0.8}
          >
            <View style={styles.quickContactIcon}>
              <Ionicons name="mail" size={20} color={colors.primary.main} />
            </View>
            <Text style={styles.quickContactText}>
              {CONTACT_INFO.EMAIL_GENERAL}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Contact Form ── */}
        <View style={styles.section}>
          <Text style={styles.sectionOverline}>Get In Touch</Text>
          <Text style={styles.sectionTitle}>Send a Message</Text>

          {submitted ? (
            <View style={styles.successCard}>
              <LinearGradient
                colors={["rgba(34,197,94,0.12)", "rgba(34,197,94,0.06)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
              </View>
              <Text style={styles.successTitle}>Message Sent!</Text>
              <Text style={styles.successDesc}>
                Thanks for reaching out. We'll get back to you within 24 hours.
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
              <Field
                label="Full Name"
                value={formData.name}
                onChangeText={(v) => setField("name", v)}
                placeholder="Your name"
                error={errors.name}
                required
                icon="person-outline"
              />
              <Field
                label="Email"
                value={formData.email}
                onChangeText={(v) => setField("email", v)}
                placeholder="your@email.com"
                error={errors.email}
                required
                icon="mail-outline"
                keyboardType="email-address"
              />
              <Field
                label="Phone"
                value={formData.phone ?? ""}
                onChangeText={(v) => setField("phone", v)}
                placeholder="(optional)"
                icon="call-outline"
                keyboardType="phone-pad"
              />

              {/* Subject picker */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>
                  Subject <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.fieldInput,
                    errors.subject ? styles.fieldInputError : null,
                  ]}
                  onPress={() => setShowSubjectPicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="list-outline"
                    size={16}
                    color={errors.subject ? colors.error : colors.text.muted}
                    style={styles.fieldIcon}
                  />
                  <Text
                    style={[
                      styles.fieldTextInput,
                      !selectedSubjectLabel && { color: colors.text.muted },
                    ]}
                  >
                    {selectedSubjectLabel || "Select a subject…"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
                {errors.subject ? (
                  <Text style={styles.fieldError}>{errors.subject}</Text>
                ) : null}
              </View>

              {/* Conditional reservation fields */}
              {isReservation && (
                <>
                  <Field
                    label="Date"
                    value={formData.reservationDate ?? ""}
                    onChangeText={(v) => setField("reservationDate", v)}
                    placeholder="e.g. Saturday, March 29"
                    error={errors.reservationDate}
                    required
                    icon="calendar-outline"
                  />
                  <Field
                    label="Time"
                    value={formData.reservationTime ?? ""}
                    onChangeText={(v) => setField("reservationTime", v)}
                    placeholder="e.g. 7:00 PM"
                    error={errors.reservationTime}
                    required
                    icon="time-outline"
                  />
                  <Field
                    label="Number of Guests"
                    value={formData.guestCount?.toString() ?? ""}
                    onChangeText={(v) =>
                      setField("guestCount", v ? parseInt(v, 10) : undefined)
                    }
                    placeholder="e.g. 8"
                    icon="people-outline"
                    keyboardType="number-pad"
                  />
                </>
              )}

              {/* Conditional careers fields */}
              {isCareers && (
                <>
                  <Field
                    label="Position of Interest"
                    value={formData.position ?? ""}
                    onChangeText={(v) => setField("position", v)}
                    placeholder="e.g. Server, Cook…"
                    icon="briefcase-outline"
                  />
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>
                      Attach CV <Text style={styles.optional}>(optional)</Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.fieldInput,
                        errors.cvFile ? styles.fieldInputError : null,
                      ]}
                      onPress={pickDocument}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={
                          cvFile ? "document-attach" : "cloud-upload-outline"
                        }
                        size={16}
                        color={errors.cvFile ? colors.error : colors.text.muted}
                        style={styles.fieldIcon}
                      />
                      <Text
                        style={[
                          styles.fieldTextInput,
                          !cvFile && { color: colors.text.muted },
                        ]}
                      >
                        {cvFile ? cvFile.name : "Upload PDF or Word doc…"}
                      </Text>
                      {cvFile && (
                        <TouchableOpacity
                          onPress={() => setCvFile(null)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color={colors.text.muted}
                          />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                    {errors.cvFile ? (
                      <Text style={styles.fieldError}>{errors.cvFile}</Text>
                    ) : null}
                  </View>
                </>
              )}

              <Field
                label="Message"
                value={formData.message}
                onChangeText={(v) => setField("message", v)}
                placeholder="Tell us how we can help…"
                error={errors.message}
                required
                multiline
                lines={5}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.primary.main, colors.primary.dark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFDFB" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color="#FFFDFB" />
                      <Text style={styles.submitBtnText}>Send Message</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Opening Hours ── */}
        <View style={styles.section}>
          <Text style={styles.sectionOverline}>Hours</Text>
          <Text style={styles.sectionTitle}>When We're Open</Text>

          <View style={styles.hoursCard}>
            {displayHours.map(({ days, time }, i) => (
              <View
                key={i}
                style={[
                  styles.hoursRow,
                  i < displayHours.length - 1 && styles.hoursRowBorder,
                ]}
              >
                <Text style={styles.hoursDays}>{days}</Text>
                <Text
                  style={[
                    styles.hoursTime,
                    time === "Closed" && styles.hoursTimeClosed,
                  ]}
                >
                  {time}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Address ── */}
        <View style={styles.section}>
          <Text style={styles.sectionOverline}>Location</Text>
          <Text style={styles.sectionTitle}>Find Us</Text>

          <View style={styles.addressCard}>
            <View style={styles.addressRow}>
              <View style={styles.addressIcon}>
                <Ionicons
                  name="location"
                  size={20}
                  color={colors.secondary.main}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressText}>
                  {CONTACT_INFO.ADDRESS.STREET}
                </Text>
                <Text style={styles.addressText}>
                  {CONTACT_INFO.ADDRESS.CITY}, {CONTACT_INFO.ADDRESS.PROVINCE}{" "}
                  {CONTACT_INFO.ADDRESS.POSTAL}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={() => Linking.openURL(EXTERNAL_URLS.GOOGLE_MAPS)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.secondary.main, colors.secondary.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.directionsBtnGradient}
              >
                <Ionicons name="navigate" size={14} color="#1A0D0A" />
                <Text style={styles.directionsBtnText}>Get Directions</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Events Contact ── */}
        <View style={[styles.section, { paddingTop: 0 }]}>
          <View style={styles.eventsContactCard}>
            <Ionicons name="calendar" size={20} color={colors.secondary.main} />
            <View style={{ flex: 1 }}>
              <Text style={styles.eventsContactTitle}>
                Private Events & Bookings
              </Text>
              <Text style={styles.eventsContactEmail}>
                {CONTACT_INFO.EMAIL_EVENTS}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.emailBtn}
              onPress={() =>
                Linking.openURL(`mailto:${CONTACT_INFO.EMAIL_EVENTS}`)
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-forward"
                size={16}
                color={colors.primary.main}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Subject Picker Modal ── */}
      <Modal
        visible={showSubjectPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowSubjectPicker(false)}
        >
          <Pressable
            style={[
              styles.pickerSheet,
              { paddingBottom: insets.bottom + spacing.base },
            ]}
            onPress={() => {}}
          >
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Select Subject</Text>
            {SUBJECT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.pickerOption,
                  formData.subject === opt.value && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  setField("subject", opt.value);
                  setShowSubjectPicker(false);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    formData.subject === opt.value &&
                      styles.pickerOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {formData.subject === opt.value && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.secondary.main}
                  />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <FloatingCallButton />
    </KeyboardAvoidingView>
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

  // ── Quick Contact
  quickContactRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  quickContactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.base,
  },
  quickContactIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(217,167,86,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickContactText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    flex: 1,
  },

  // ── Sections
  section: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.base,
  },
  sectionOverline: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.xs,
    color: colors.secondary.main,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    marginBottom: spacing.base,
  },

  // ── Form
  form: { gap: 0 },
  fieldWrap: { marginBottom: spacing.base },
  fieldLabel: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: { color: colors.secondary.main },
  optional: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  fieldInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? spacing.md : spacing.sm,
    minHeight: 50,
  },
  fieldInputError: {
    borderColor: colors.error,
  },
  fieldInputMulti: {
    alignItems: "flex-start",
    paddingVertical: spacing.md,
  },
  fieldIcon: {
    marginRight: spacing.sm,
  },
  fieldTextInput: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    padding: 0,
    margin: 0,
  },
  fieldError: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },

  // ── Submit
  submitBtn: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginTop: spacing.sm,
    ...shadows.md,
  },
  submitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
  },
  submitBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: "#FFFDFB",
    letterSpacing: 0.3,
  },

  // ── Success Card
  successCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    gap: spacing.sm,
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(34,197,94,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
  },
  successDesc: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Hours
  hoursCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: "hidden",
    ...shadows.sm,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  hoursRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  hoursDays: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  hoursTime: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: colors.secondary.dark,
  },
  hoursTimeClosed: {
    color: colors.text.muted,
    fontFamily: typography.fontFamily.body,
  },

  // ── Address
  addressCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.base,
    gap: spacing.base,
    ...shadows.sm,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(217,167,86,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 22,
  },
  directionsBtn: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  directionsBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  directionsBtnText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.sm,
    color: "#1A0D0A",
  },

  // ── Events Contact Card
  eventsContactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.base,
    ...shadows.sm,
  },
  eventsContactTitle: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  eventsContactEmail: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  emailBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(217,167,86,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Subject Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius["2xl"],
    borderTopRightRadius: borderRadius["2xl"],
    paddingTop: spacing.md,
    paddingHorizontal: spacing.base,
    ...shadows.lg,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.gold,
    alignSelf: "center",
    marginBottom: spacing.base,
  },
  pickerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pickerOptionActive: {
    backgroundColor: "rgba(217,167,86,0.06)",
  },
  pickerOptionText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  pickerOptionTextActive: {
    color: colors.secondary.dark,
    fontFamily: typography.fontFamily.bodySemibold,
  },
});
