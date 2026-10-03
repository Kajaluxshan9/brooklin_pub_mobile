import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors, typography, spacing, borderRadius, shadows } from "../../config/theme";

/** Shared building blocks for the gift card screens. */

export function ScreenHeader({ title }: { title: string }) {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={22} color={colors.primary.main} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.text.muted}
        style={[styles.input, props.multiline && { minHeight: 90, textAlignVertical: "top" }, !!error && styles.inputError]}
        accessibilityLabel={label}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  icon,
  variant = "solid",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "solid" | "outline";
}) {
  const solid = variant === "solid";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      style={[styles.btn, solid ? styles.btnSolid : styles.btnOutline, (disabled || loading) && { opacity: 0.45 }]}
    >
      {loading ? (
        <ActivityIndicator color={solid ? "#fff" : colors.primary.main} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={solid ? "#fff" : colors.primary.main} style={{ marginRight: 8 }} />}
          <Text style={[styles.btnText, !solid && { color: colors.primary.main }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "error" | "success"; children: React.ReactNode }) {
  const map = {
    info: { bg: "rgba(217,167,86,0.12)", fg: colors.primary.main, icon: "information-circle" as const },
    warning: { bg: "rgba(245,158,11,0.12)", fg: "#92400E", icon: "warning" as const },
    error: { bg: "rgba(138,42,42,0.1)", fg: colors.error, icon: "alert-circle" as const },
    success: { bg: "rgba(34,197,94,0.12)", fg: "#166534", icon: "checkmark-circle" as const },
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: map.bg }]}>
      <Ionicons name={map.icon} size={18} color={map.fg} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>{typeof children === "string" ? <Text style={[styles.noticeText, { color: map.fg }]}>{children}</Text> : children}</View>
    </View>
  );
}

export const gcStyles = StyleSheet.create({
  h1: { fontFamily: typography.fontFamily.heading, fontSize: 28, color: colors.primary.main, marginBottom: spacing.sm },
  h2: { fontFamily: typography.fontFamily.heading, fontSize: 22, color: colors.primary.main, marginBottom: spacing.sm },
  body: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.base, color: colors.text.primary, lineHeight: 22 },
  muted: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.sm, color: colors.text.muted, lineHeight: 19 },
  bold: { fontFamily: typography.fontFamily.bodyBold },
  mono: { fontFamily: "monospace", letterSpacing: 2, color: "#2A1509" },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.glass.gold },
  headerTitle: { fontFamily: typography.fontFamily.heading, fontSize: 22, color: colors.primary.main },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.base,
    ...shadows.card,
  },
  label: { fontFamily: typography.fontFamily.bodySemibold, fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: typography.fontSize.xs, marginTop: 4, fontFamily: typography.fontFamily.body },
  hint: { color: colors.text.muted, fontSize: typography.fontSize.xs, marginTop: 4, fontFamily: typography.fontFamily.body },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: borderRadius.md, paddingVertical: 14, paddingHorizontal: spacing.lg, minHeight: 50 },
  btnSolid: { backgroundColor: colors.primary.main },
  btnOutline: { borderWidth: 1.5, borderColor: colors.primary.main, backgroundColor: "transparent" },
  btnText: { color: "#fff", fontFamily: typography.fontFamily.bodyBold, fontSize: typography.fontSize.md },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border.goldStrong,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
    flexGrow: 1,
    flexBasis: "45%",
    margin: 4,
    backgroundColor: "#fff",
  },
  chipSelected: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  chipText: { fontFamily: typography.fontFamily.bodyBold, fontSize: 18, color: colors.primary.main },
  chipTextSelected: { color: "#fff" },
  notice: { flexDirection: "row", gap: 8, padding: spacing.md, borderRadius: borderRadius.md, marginVertical: spacing.sm },
  noticeText: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.sm, lineHeight: 19 },
});
