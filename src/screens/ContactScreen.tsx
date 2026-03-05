import React, { useState, useCallback, useRef, useEffect } from "react";
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
  Dimensions,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import * as DocumentPicker from "expo-document-picker";

import HeroSection from "../components/common/HeroSection";
import Footer from "../components/common/Footer";
import FloatingCallButton from "../components/common/FloatingCallButton";
import {
  GoldDivider,
  CornerAccents,
  AnimatedBackground,
} from "../components/common/SharedComponents";

import { useApiWithCache } from "../hooks/useApi";
import { openingHoursService } from "../services/opening-hours.service";
import {
  contactService,
  type ContactFormData,
} from "../services/contact.service";
import type { OpeningHours } from "../types/api.types";
import {
  CONTACT_INFO,
  EXTERNAL_URLS,
  SUBJECT_OPTIONS,
} from "../config/constants";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../config/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ======================================================================
// HELPERS
// ======================================================================

const formatTimeTo12Hour = (time: string): string => {
  const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return time;
  let hour = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hour >= 12 ? "P.M." : "A.M.";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour = hour - 12;
  return minutes === "00"
    ? `${hour} ${period}`
    : `${hour}:${minutes} ${period}`;
};

const formatOpeningHours = (hours: OpeningHours[] | null) => {
  if (!hours || hours.length === 0) {
    return [
      { days: "SUN - THU", time: "11 A.M. - 11 P.M." },
      { days: "FRI - SAT", time: "11 A.M. - 2 A.M." },
    ];
  }
  const dayAbbrev: Record<string, string> = {
    monday: "MON",
    tuesday: "TUE",
    wednesday: "WED",
    thursday: "THU",
    friday: "FRI",
    saturday: "SAT",
    sunday: "SUN",
  };
  const dayOrder = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const timeGroups: Record<string, string[]> = {};
  hours.forEach((h) => {
    const isClosed = !h.isOpen || !h.isActive || !h.openTime || !h.closeTime;
    const timeKey = isClosed ? "Closed" : `${h.openTime} - ${h.closeTime}`;
    const day = dayAbbrev[h.dayOfWeek.toLowerCase()] || h.dayOfWeek;
    if (!timeGroups[timeKey]) timeGroups[timeKey] = [];
    timeGroups[timeKey].push(day);
  });

  const result: { days: string; time: string }[] = [];
  Object.entries(timeGroups).forEach(([time, days]) => {
    days.sort((a, b) => {
      const aIdx = dayOrder.findIndex((d) => dayAbbrev[d] === a);
      const bIdx = dayOrder.findIndex((d) => dayAbbrev[d] === b);
      return aIdx - bIdx;
    });
    let daysStr = "";
    if (days.length === 1) daysStr = days[0];
    else if (days.length === 7) daysStr = "EVERYDAY";
    else {
      const indices = days.map((d) => {
        const key = Object.keys(dayAbbrev).find((k) => dayAbbrev[k] === d);
        return dayOrder.indexOf(key || "");
      });
      const isConsecutive = indices.every(
        (val, i, arr) => i === 0 || val === arr[i - 1] + 1,
      );
      daysStr =
        isConsecutive && days.length >= 2
          ? `${days[0]} - ${days[days.length - 1]}`
          : days.join(" - ");
    }
    let formattedTime = time;
    if (time !== "Closed") {
      const parts = time.split(" - ");
      if (parts.length === 2) {
        formattedTime = `${formatTimeTo12Hour(parts[0].trim())} - ${formatTimeTo12Hour(parts[1].trim())}`;
      }
    }
    result.push({ days: daysStr, time: formattedTime });
  });
  return result;
};

// ======================================================================
// CONTACT INFO CARD
// ======================================================================

interface ContactInfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}

const ContactInfoCard = ({ icon, title, children }: ContactInfoCardProps) => (
  <View style={cardStyles.container}>
    <LinearGradient
      colors={[colors.secondary.main, "#B08030", colors.secondary.main]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={cardStyles.topBar}
    />
    <View style={cardStyles.inner}>
      <LinearGradient
        colors={[colors.secondary.main, "#B08030"]}
        style={cardStyles.iconBox}
      >
        <Ionicons name={icon} size={24} color="#fff" />
      </LinearGradient>
      <View style={cardStyles.content}>
        <Text style={cardStyles.title}>{title}</Text>
        {children}
      </View>
    </View>
  </View>
);

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: "hidden",
    ...shadows.card,
  },
  topBar: { height: 3, width: "100%", opacity: 0.7 },
  inner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.base,
    gap: spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.gold,
  },
  content: { flex: 1 },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
});

// ======================================================================
// CONTACT ROW (phone / email)
// ======================================================================

interface ContactRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  subText?: string;
  onPress: () => void;
}

const ContactRow = ({ icon, text, subText, onPress }: ContactRowProps) => (
  <TouchableOpacity
    style={rowStyles.container}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={rowStyles.iconBox}>
      <Ionicons name={icon} size={18} color={colors.secondary.main} />
    </View>
    <View style={rowStyles.textWrap}>
      <Text style={rowStyles.text}>{text}</Text>
      {subText && <Text style={rowStyles.subText}>{subText}</Text>}
    </View>
  </TouchableOpacity>
);

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.glass.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  text: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: "#4A2C17",
  },
  subText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontStyle: "italic",
    marginTop: 2,
  },
});

// ======================================================================
// STYLED TEXT INPUT
// ======================================================================

interface StyledInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: TextInput["props"]["keyboardType"];
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

const StyledInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  multiline,
  numberOfLines,
  required,
  icon,
}: StyledInputProps) => (
  <View style={inputStyles.wrapper}>
    <Text style={inputStyles.label}>
      {label}
      {required && <Text style={{ color: colors.secondary.main }}> *</Text>}
    </Text>
    <View
      style={[
        inputStyles.inputContainer,
        error ? inputStyles.inputError : null,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={colors.secondary.main}
          style={{ marginRight: spacing.sm }}
        />
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          inputStyles.input,
          multiline && {
            minHeight: (numberOfLines || 4) * 22,
            textAlignVertical: "top",
          },
        ]}
      />
    </View>
    {error && <Text style={inputStyles.error}>{error}</Text>}
  </View>
);

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: spacing.base },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.gold,
    paddingHorizontal: spacing.base,
    paddingVertical: Platform.OS === "ios" ? spacing.md : spacing.sm,
    minHeight: 52,
  },
  inputError: { borderColor: colors.error, borderWidth: 1.5 },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    padding: 0,
  },
  error: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

// ======================================================================
// MAIN COMPONENT
// ======================================================================

export default function ContactScreen() {
  const scrollRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    reservationDate: "",
    reservationTime: "",
    guestCount: undefined,
    position: "",
    message: "",
  });
  const [cvFile, setCvFile] = useState<{
    name: string;
    uri: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  const isReservation = formData.subject === "reservation";
  const isCareers = formData.subject === "careers";

  // Fetch opening hours
  const { data: openingHoursData } = useApiWithCache<OpeningHours[]>(
    "opening-hours",
    () => openingHoursService.getAllOpeningHours(),
  );
  const { data: openStatus } = useApiWithCache("opening-hours-status", () =>
    openingHoursService.getCurrentStatus(),
  );
  const displayHours = formatOpeningHours(openingHoursData);

  // -- Handlers --

  const updateField = useCallback(
    (field: keyof ContactFormData, value: string | number | undefined) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [errors],
  );

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCvFile({
          name: file.name,
          uri: file.uri,
          size: file.size || 0,
          mimeType: file.mimeType || "",
        });
        if (errors.cvFile) setErrors((prev) => ({ ...prev, cvFile: "" }));
      }
    } catch {
      Alert.alert("Error", "Failed to pick document");
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name || formData.name.trim().length < 2)
      newErrors.name = "Please enter your full name";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email))
      newErrors.email = "Please enter a valid email address";
    if (!formData.subject) newErrors.subject = "Please select a subject";
    if (isReservation) {
      if (!formData.reservationDate)
        newErrors.reservationDate = "Please enter a date";
      if (!formData.reservationTime)
        newErrors.reservationTime = "Please enter a time";
      if (formData.guestCount !== undefined && formData.guestCount < 1)
        newErrors.guestCount = "Number of guests must be at least 1";
    }
    if (isCareers && cvFile) {
      if (cvFile.size > 5 * 1024 * 1024)
        newErrors.cvFile = "File size must be less than 5MB";
    }
    if (!formData.message || formData.message.trim().length < 10)
      newErrors.message = "Message should be at least 10 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isReservation, isCareers, cvFile]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let fullMessage = formData.message;
      if (isReservation) {
        fullMessage = `PARTY RESERVATION REQUEST\n\nDate: ${formData.reservationDate}\nTime: ${formData.reservationTime}\nNumber of Guests: ${formData.guestCount}\n\nAdditional Notes:\n${formData.message}`;
      }
      if (isCareers) {
        fullMessage = `CAREERS APPLICATION\n\nCover Letter / Message:\n${formData.message}${cvFile ? `\n\n[CV Attached: ${cvFile.name}]` : ""}`;
      }
      const response = await contactService.submitContactForm({
        ...formData,
        message: fullMessage,
      });
      if (response.success) {
        setSubmitted(true);
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            phone: "",
            subject: "",
            reservationDate: "",
            reservationTime: "",
            guestCount: undefined,
            position: "",
            message: "",
          });
          setCvFile(null);
          setSubmitted(false);
        }, 5000);
      }
    } catch {
      const subjectLine = isReservation
        ? `Party Reservation - ${formData.reservationDate}`
        : isCareers
          ? "Careers Application"
          : SUBJECT_OPTIONS.find((o) => o.value === formData.subject)?.label ||
            "Contact from app";
      const body = `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || "N/A"}\n\n${formData.message}`;
      Linking.openURL(
        `mailto:brooklinpub@gmail.com?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(body)}`,
      ).catch(() => {});
      Alert.alert("Info", "Opening email client as backup...");
    } finally {
      setLoading(false);
    }
  }, [formData, isReservation, isCareers, cvFile, validate]);

  const selectedSubjectLabel =
    SUBJECT_OPTIONS.find((o) => o.value === formData.subject)?.label || "";

  // ======================================================================
  // RENDER
  // ======================================================================

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* === HERO === */}
        <HeroSection
          title="Contact Us"
          overlineText="Get In Touch"
          subtitle="Reservations, private events, or just saying hello — our door is always open"
          variant="light"
          height={260}
        />

        {/* === SECTION HEADER === */}
        <View style={styles.sectionHeaderWrap}>
          <AnimatedBackground variant="light" particleCount={6} />
          <Text style={styles.overline}>{"◆ Your Table's Waiting ◆"}</Text>
          <Text style={styles.sectionTitle}>
            How Can We{" "}
            <Text style={{ color: colors.secondary.main }}>Help You?</Text>
          </Text>
          <Text style={styles.sectionDesc}>
            From reservations to private events, feedback to career
            opportunities — our door is always open. Where every stranger's a
            friend you haven't met.
          </Text>
        </View>

        {/* === CONTACT INFO CARDS === */}
        <View style={styles.cardsContainer}>
          {/* Visit Us */}
          <ContactInfoCard icon="location-outline" title="Visit Us">
            <Text style={styles.addressText}>
              <Text style={styles.addressBold}>15 Baldwin Street</Text>
              {"\n"}Whitby, ON L1M 1A2{"\n"}Canada
            </Text>
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={() =>
                Linking.openURL(
                  "https://maps.google.com/?q=15+Baldwin+Street+Whitby+ON",
                ).catch(() => {})
              }
            >
              <Text style={styles.directionsText}>Get Directions</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={colors.secondary.main}
              />
            </TouchableOpacity>
          </ContactInfoCard>

          {/* Get in Touch */}
          <ContactInfoCard icon="call-outline" title="Get in Touch">
            <ContactRow
              icon="call-outline"
              text={CONTACT_INFO.PHONE}
              onPress={() =>
                Linking.openURL(`tel:${CONTACT_INFO.PHONE_RAW}`).catch(() => {})
              }
            />
            <ContactRow
              icon="mail-outline"
              text={CONTACT_INFO.EMAIL_GENERAL}
              subText="General Inquiries"
              onPress={() =>
                Linking.openURL(`mailto:${CONTACT_INFO.EMAIL_GENERAL}`).catch(
                  () => {},
                )
              }
            />
            <ContactRow
              icon="calendar-outline"
              text={CONTACT_INFO.EMAIL_EVENTS}
              subText="Parties & Events"
              onPress={() =>
                Linking.openURL(`mailto:${CONTACT_INFO.EMAIL_EVENTS}`).catch(
                  () => {},
                )
              }
            />
          </ContactInfoCard>

          {/* Opening Hours */}
          <ContactInfoCard icon="time-outline" title="Opening Hours">
            <View style={styles.hoursContainer}>
              {displayHours.map((h, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.hoursRow,
                    idx < displayHours.length - 1 && styles.hoursRowBorder,
                  ]}
                >
                  <Text style={styles.hoursDays}>{h.days}</Text>
                  <Text
                    style={[
                      styles.hoursTime,
                      h.time === "Closed" && {
                        color: "#c44",
                        fontWeight: "600" as const,
                      },
                    ]}
                  >
                    {h.time}
                  </Text>
                </View>
              ))}
            </View>
          </ContactInfoCard>
        </View>

        {/* === CONTACT FORM === */}
        <View style={styles.formWrapper}>
          <LinearGradient
            colors={[colors.secondary.main, "#B08030", colors.secondary.main]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.formTopBar}
          />
          <CornerAccents />

          {submitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark-circle" size={64} color="#fff" />
              </View>
              <Text style={styles.successTitle}>
                {isReservation
                  ? "Reservation Request Sent!"
                  : isCareers
                    ? "Application Submitted!"
                    : "Message Sent!"}
              </Text>
              <Text style={styles.successDesc}>
                {isReservation
                  ? "Thank you! We'll confirm your party reservation shortly via email."
                  : isCareers
                    ? "Thank you for your interest! Our team will review your application and get back to you soon."
                    : "Thank you for reaching out! We'll get back to you within 24 hours."}
              </Text>
              <View style={styles.confirmBox}>
                <Ionicons name="mail" size={24} color={colors.secondary.main} />
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={styles.confirmLabel}>Confirmation sent to</Text>
                  <Text style={styles.confirmEmail}>{formData.email}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.formInner}>
              {/* Form Header */}
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Let's Talk</Text>
                <Text style={styles.formSubtitle}>
                  We'd love to hear from you! Whether you're planning a visit,
                  looking to join our team, or just want to say hi — drop us a
                  line.
                </Text>
                <View style={styles.responseBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.responseText}>
                    We typically respond within 48 hours
                  </Text>
                </View>
              </View>

              {/* Name */}
              <StyledInput
                label="Your Name"
                value={formData.name}
                onChangeText={(t) => updateField("name", t)}
                placeholder="Enter your full name"
                error={errors.name}
                required
              />

              {/* Email & Phone */}
              <StyledInput
                label="Email Address"
                value={formData.email}
                onChangeText={(t) => updateField("email", t)}
                placeholder="your@email.com"
                keyboardType="email-address"
                error={errors.email}
                required
              />
              <StyledInput
                label="Phone Number"
                value={formData.phone || ""}
                onChangeText={(t) => updateField("phone", t)}
                placeholder="(optional)"
                keyboardType="phone-pad"
              />

              {/* Subject Picker */}
              <View style={inputStyles.wrapper}>
                <Text style={inputStyles.label}>
                  Subject
                  <Text style={{ color: colors.secondary.main }}> *</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    inputStyles.inputContainer,
                    errors.subject ? inputStyles.inputError : null,
                  ]}
                  onPress={() => setShowSubjectPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      inputStyles.input,
                      !selectedSubjectLabel && { color: colors.text.muted },
                    ]}
                  >
                    {selectedSubjectLabel || "Select a subject"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={colors.secondary.main}
                  />
                </TouchableOpacity>
                {errors.subject && (
                  <Text style={inputStyles.error}>{errors.subject}</Text>
                )}
              </View>

              {/* Reservation Fields */}
              {isReservation && (
                <View style={styles.conditionalSection}>
                  <View style={styles.conditionalHeader}>
                    <View style={styles.conditionalIconBox}>
                      <Ionicons
                        name="calendar"
                        size={20}
                        color={colors.secondary.main}
                      />
                    </View>
                    <Text style={styles.conditionalTitle}>
                      Party Reservation Details
                    </Text>
                  </View>
                  <StyledInput
                    label="Date"
                    value={formData.reservationDate || ""}
                    onChangeText={(t) => updateField("reservationDate", t)}
                    placeholder="e.g. 2026-03-15"
                    error={errors.reservationDate}
                    required
                    icon="calendar-outline"
                  />
                  <StyledInput
                    label="Time"
                    value={formData.reservationTime || ""}
                    onChangeText={(t) => updateField("reservationTime", t)}
                    placeholder="e.g. 7:00 PM"
                    error={errors.reservationTime}
                    required
                    icon="time-outline"
                  />
                  <StyledInput
                    label="Number of Guests"
                    value={formData.guestCount?.toString() || ""}
                    onChangeText={(t) => {
                      const num = parseInt(t, 10);
                      updateField(
                        "guestCount",
                        t === "" ? undefined : isNaN(num) ? undefined : num,
                      );
                    }}
                    placeholder="Enter number of guests"
                    keyboardType="number-pad"
                    error={errors.guestCount}
                    icon="people-outline"
                  />
                </View>
              )}

              {/* Careers Fields */}
              {isCareers && (
                <View style={styles.conditionalSection}>
                  <View style={styles.conditionalHeader}>
                    <View style={styles.conditionalIconBox}>
                      <Ionicons
                        name="briefcase"
                        size={20}
                        color={colors.secondary.main}
                      />
                    </View>
                    <Text style={styles.conditionalTitle}>Upload Your CV</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={pickDocument}
                    activeOpacity={0.7}
                  >
                    {cvFile ? (
                      <View style={{ alignItems: "center" }}>
                        <Text style={styles.uploadedFileName}>
                          {" " + cvFile.name}
                        </Text>
                        <Text style={styles.uploadChangeText}>
                          Tap to change file
                        </Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: "center" }}>
                        <Text
                          style={{ fontSize: 32, marginBottom: spacing.sm }}
                        >
                          {""}
                        </Text>
                        <Text style={styles.uploadMainText}>
                          Tap to upload your CV
                        </Text>
                        <Text style={styles.uploadSubText}>
                          PDF, DOC, or DOCX (Max 5MB)
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.cvFile && (
                    <Text style={inputStyles.error}>{errors.cvFile}</Text>
                  )}
                </View>
              )}

              {/* Message */}
              <StyledInput
                label={
                  isReservation
                    ? "Special Requests / Notes"
                    : isCareers
                      ? "Cover Letter / Why you want to join us"
                      : "Your Message"
                }
                value={formData.message}
                onChangeText={(t) => updateField("message", t)}
                placeholder={
                  isReservation
                    ? "Any dietary restrictions, special occasions, seating preferences..."
                    : isCareers
                      ? "Tell us about yourself, your experience, and why you'd be a great fit..."
                      : "Tell us how we can help you..."
                }
                multiline
                numberOfLines={isReservation ? 3 : 5}
                error={errors.message}
                required
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    loading
                      ? ["rgba(217,167,86,0.5)", "rgba(176,128,48,0.5)"]
                      : [colors.secondary.main, "#B08030"]
                  }
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="send"
                        size={20}
                        color={colors.background.paper}
                      />
                      <Text style={styles.submitText}>
                        {isReservation
                          ? "Request Reservation"
                          : isCareers
                            ? "Submit Application"
                            : "Send Message"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* === MAP SECTION === */}
        <View style={styles.mapSection}>
          <Text style={styles.overline}>{" Find Us "}</Text>
          <Text style={styles.mapTitle}>Visit Our Location</Text>
          <View style={styles.mapContainer}>
            <WebView
              source={{
                html: `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>*{margin:0;padding:0}iframe{width:100%;height:100%;border:0}</style></head>
<body><iframe src="${EXTERNAL_URLS.GOOGLE_MAPS_EMBED}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></body></html>`,
              }}
              style={styles.mapWebView}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["https://*", "http://*"]}
              scrollEnabled={false}
              nestedScrollEnabled={false}
              startInLoadingState
              allowsInlineMediaPlayback
            />
            <View style={styles.mapBorder} pointerEvents="none" />
          </View>
        </View>

        {/* === FOOTER === */}
        <Footer openStatus={openStatus} />

        {/* === SUBJECT PICKER MODAL === */}
        <Modal
          visible={showSubjectPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSubjectPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSubjectPicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Subject</Text>
                <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.text.primary}
                  />
                </TouchableOpacity>
              </View>
              <GoldDivider width="100%" marginVertical={spacing.sm} />
              <FlatList
                data={SUBJECT_OPTIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      formData.subject === item.value &&
                        styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      updateField("subject", item.value);
                      setShowSubjectPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        formData.subject === item.value &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {formData.subject === item.value && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.secondary.main}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>

      {/* Floating call FAB */}
      <FloatingCallButton />
    </KeyboardAvoidingView>
  );
}

// ======================================================================
// STYLES
// ======================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  contentContainer: { paddingBottom: 0 },

  sectionHeaderWrap: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["2xl"],
  },
  overline: {
    color: colors.secondary.main,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  sectionDesc: {
    color: colors.primary.main,
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 500,
    letterSpacing: 0.2,
  },

  cardsContainer: {
    paddingHorizontal: spacing.base,
    gap: spacing.base,
    marginBottom: spacing.xl,
  },

  addressText: {
    color: "#4A2C17",
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  addressBold: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  directionsText: {
    color: colors.secondary.main,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },

  hoursContainer: { marginTop: spacing.xs },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  hoursRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  hoursDays: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    letterSpacing: 0.5,
  },
  hoursTime: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
  },

  formWrapper: {
    marginHorizontal: spacing.base,
    marginBottom: spacing["2xl"],
    borderRadius: borderRadius["2xl"],
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.gold,
    overflow: "hidden",
    ...shadows.lg,
  },
  formTopBar: { height: 4, width: "100%" },
  formInner: { padding: spacing.lg },

  formHeader: { alignItems: "center", marginBottom: spacing.xl },
  formTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  formSubtitle: {
    color: colors.primary.main,
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: spacing.base,
  },
  responseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.glass.gold,
    borderWidth: 1,
    borderColor: colors.border.gold,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  responseText: {
    color: colors.primary.main,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },

  conditionalSection: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    backgroundColor: "rgba(217,167,86,0.05)",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border.gold,
    marginBottom: spacing.base,
  },
  conditionalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  conditionalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(217,167,86,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  conditionalTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },

  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border.goldStrong,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  uploadedFileName: {
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xs,
  },
  uploadChangeText: {
    color: colors.primary.main,
    fontSize: typography.fontSize.sm,
  },
  uploadMainText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xs,
  },
  uploadSubText: {
    color: colors.primary.main,
    fontSize: typography.fontSize.sm,
  },

  submitButton: {
    alignSelf: "center",
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.gold,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing["2xl"],
    minHeight: 52,
  },
  submitText: {
    color: colors.background.paper,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },

  successContainer: {
    alignItems: "center",
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.lg,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  successTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  successDesc: {
    color: colors.primary.main,
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 400,
    marginBottom: spacing.xl,
  },
  confirmBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    backgroundColor: "rgba(217,167,86,0.1)",
    borderWidth: 2,
    borderColor: "rgba(217,167,86,0.3)",
  },
  confirmLabel: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    marginBottom: 2,
  },
  confirmEmail: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.base,
  },

  mapSection: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing["2xl"],
    alignItems: "center",
  },
  mapTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  mapContainer: {
    width: "100%",
    height: 280,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.lg,
  },
  mapWebView: { flex: 1 },
  mapBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: "rgba(217,167,86,0.4)",
    borderRadius: borderRadius.xl,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.medium,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["2xl"],
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: "70%",
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.base,
  },
  modalOptionSelected: { backgroundColor: "rgba(217,167,86,0.1)" },
  modalOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  modalOptionTextSelected: {
    color: colors.secondary.main,
    fontWeight: typography.fontWeight.semibold,
  },
});
