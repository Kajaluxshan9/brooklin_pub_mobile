import React, { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { colors, spacing, typography } from "../config/theme";
import { CONTACT_INFO } from "../config/constants";
import { useScrollBottomPadding } from "../config/layout";
import type { InfoStackParamList } from "../navigation/AppNavigator";
import {
  giftCardsService,
  normalizeGiftCardCode,
  GiftCardApiError,
  GIFT_CARD_CODE_RE,
  type GiftCardCheckResult,
  type GiftCardStatus,
} from "../services/giftcards.service";
import { Card, Field, Notice, PrimaryButton, ScreenHeader, gcStyles } from "../components/giftcards/GiftCardUI";

const STATUS: Record<GiftCardStatus, { label: string; color: string; text: string }> = {
  pending_verification: { label: "Awaiting payment verification", color: "#B45309", text: "We've received your order and are verifying your payment. The recipient will be emailed the gift card and PIN once approved." },
  active: { label: "Active", color: "#15803D", text: "This gift card is active and ready to use at the pub." },
  rejected: { label: "Not approved", color: colors.error, text: "We couldn't verify the payment for this order." },
  fully_redeemed: { label: "Fully used", color: "#6B7280", text: "The full balance of this gift card has been used." },
  frozen: { label: "On hold", color: "#1D4ED8", text: "This gift card is temporarily on hold. Please contact us." },
  void: { label: "Cancelled", color: colors.error, text: "This gift card has been cancelled. Please contact us." },
};

const money = (n: number | null | undefined) => `$${(n ?? 0).toFixed(2)}`;
const date = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "America/Toronto" }) : "—";

export default function GiftCardCheckScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InfoStackParamList>>();
  const bottomPad = useScrollBottomPadding();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GiftCardCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const normalized = normalizeGiftCardCode(code);

  const check = async () => {
    if (!GIFT_CARD_CODE_RE.test(normalized)) {
      setError("Please enter a valid Gift Card ID, e.g. BPGC-7K3M-Q9XA");
      return;
    }
    setCode(normalized);
    setLoading(true);
    setError(null);
    setLocked(false);
    setResult(null);
    try {
      setResult(await giftCardsService.check(normalized, pin || undefined));
    } catch (e) {
      if (e instanceof GiftCardApiError && e.locked) setLocked(true);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const meta = result ? STATUS[result.status] : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Check Gift Card" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.base, paddingBottom: bottomPad }} keyboardShouldPersistTaps="handled">
          <Card>
            <Field
              label="Gift Card ID"
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="BPGC-XXXX-XXXX"
            />
            <Field
              label="PIN (optional — needed to see the balance)"
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              hint="Buyers can leave this empty to check the order status."
            />
            <PrimaryButton
              title={pin ? "Check balance" : "Check status"}
              onPress={check}
              loading={loading}
              disabled={!code.trim() || (pin.length > 0 && pin.length < 4)}
            />
          </Card>

          {error && (
            <Card>
              <Notice tone={locked ? "warning" : "error"}>{error}</Notice>
              {locked && (
                <View style={{ gap: spacing.sm }}>
                  <PrimaryButton title={`Call ${CONTACT_INFO.PHONE}`} icon="call" onPress={() => Linking.openURL(`tel:${CONTACT_INFO.PHONE_RAW}`)} />
                  <PrimaryButton title="Contact Us form" variant="outline" onPress={() => navigation.navigate("Contact")} />
                </View>
              )}
            </Card>
          )}

          {result && meta && (
            <Card>
              <View style={styles.rowBetween}>
                <Text style={[gcStyles.mono, { fontSize: 16, fontWeight: "700" }]} selectable>{result.code}</Text>
                <View style={[styles.badge, { borderColor: meta.color }]}>
                  <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>

              {result.pinVerified && result.balance !== undefined ? (
                <View style={{ alignItems: "center", marginVertical: spacing.lg }}>
                  <Text style={styles.overline}>Available balance</Text>
                  <Text style={styles.balance}>{money(result.balance)}</Text>
                  <Text style={gcStyles.muted}>of {money(result.approvedAmount)} original value</Text>
                </View>
              ) : (
                <Text style={[gcStyles.body, { marginTop: spacing.md }]}>{meta.text}</Text>
              )}

              <View style={{ marginTop: spacing.sm }}>
                <Row label="Purchased" value={date(result.purchasedAt)} />
                <Row label="Amount requested" value={money(result.requestedAmount)} />
                {result.approvedAmount !== null && <Row label="Amount approved" value={money(result.approvedAmount)} />}
                {result.activatedAt && <Row label="Activated" value={date(result.activatedAt)} />}
              </View>

              {result.amountAdjusted && (
                <Notice tone="info">
                  {`We received ${money(result.approvedAmount)} (you requested ${money(result.requestedAmount)}), so the gift card was issued for ${money(result.approvedAmount)}.`}
                </Notice>
              )}
              {result.status === "rejected" && result.rejectionReason && <Notice tone="error">{`Reason: ${result.rejectionReason}`}</Notice>}
              {result.isLocked && <Notice tone="warning">This gift card is locked. Please contact us to unlock it.</Notice>}

              {result.history && result.history.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={[gcStyles.bold, { color: colors.primary.main, marginBottom: 4 }]}>History</Text>
                  {result.history.map((h, i) => (
                    <View key={i} style={[styles.rowBetween, styles.historyRow]}>
                      <Text style={[gcStyles.muted, { flex: 1 }]}>
                        {h.type === "redeem" ? "Used at the pub" : h.type === "issue" ? "Gift card issued" : h.type === "void" ? "Cancelled" : "Balance adjustment"} · {date(h.date)}
                      </Text>
                      <Text style={{ fontFamily: typography.fontFamily.bodyBold, color: h.amount < 0 ? colors.error : "#15803D" }}>
                        {h.amount < 0 ? "−" : "+"}{money(Math.abs(h.amount))}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {!result.pinVerified && result.status === "active" && (
                <Text style={[gcStyles.muted, { marginTop: spacing.md }]}>Enter the 4-digit PIN from the gift card email to see the balance.</Text>
              )}
            </Card>
          )}

          <Text style={[gcStyles.muted, { textAlign: "center" }]}>
            Questions about a gift card? Call {CONTACT_INFO.PHONE} or use our Contact Us form and quote your Gift Card ID.
          </Text>
          <View style={{ height: spacing.md }} />
          <PrimaryButton title="Buy a gift card" variant="outline" icon="gift-outline" onPress={() => navigation.navigate("GiftCards")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.rowBetween, { paddingVertical: 4 }]}>
      <Text style={gcStyles.muted}>{label}</Text>
      <Text style={gcStyles.body}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.default },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  badge: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontFamily: typography.fontFamily.bodySemibold, fontSize: typography.fontSize.xs },
  overline: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#8B6914", fontFamily: typography.fontFamily.bodySemibold },
  balance: { fontFamily: typography.fontFamily.heading, fontSize: 48, color: colors.primary.main },
  historyRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
});
