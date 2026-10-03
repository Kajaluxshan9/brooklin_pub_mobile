import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { colors, spacing, borderRadius, typography } from "../config/theme";
import { CONTACT_INFO } from "../config/constants";
import { useScrollBottomPadding } from "../config/layout";
import type { InfoStackParamList } from "../navigation/AppNavigator";
import { giftCardsService, type GiftCardPublicSettings } from "../services/giftcards.service";
import { Card, Chip, Field, Notice, PrimaryButton, ScreenHeader, gcStyles } from "../components/giftcards/GiftCardUI";

type Method = "interac" | "bank_deposit";
type Slip = { uri: string; name: string; type: string; size?: number };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s.]{7,30}$/;
const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const SLIP_TYPES = ["image/jpeg", "image/png", "application/pdf"];

function CopyRow({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <View style={styles.copyRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.copyLabel}>{label}</Text>
        <Text style={styles.copyValue} selectable>{value}</Text>
      </View>
      <TouchableOpacity
        accessibilityLabel={`Copy ${label}`}
        onPress={async () => {
          await Clipboard.setStringAsync(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        style={styles.copyBtn}
      >
        <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color={copied ? colors.success : colors.primary.main} />
      </TouchableOpacity>
    </View>
  );
}

export default function GiftCardsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<InfoStackParamList>>();
  const bottomPad = useScrollBottomPadding();

  const [settings, setSettings] = useState<GiftCardPublicSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);

  const [preset, setPreset] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isForSelf, setIsForSelf] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState<Method | null>(null);
  const [slip, setSlip] = useState<Slip | null>(null);
  const [slipError, setSlipError] = useState<string | null>(null);
  const [paidConfirmed, setPaidConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultCode, setResultCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedAck, setSavedAck] = useState(false);
  const [done, setDone] = useState(false);

  const load = () => {
    setLoadError(null);
    giftCardsService
      .getSettings()
      .then((s) => {
        setSettings(s);
        if (s.interac && !s.bankDeposit) setMethod("interac");
        if (!s.interac && s.bankDeposit) setMethod("bank_deposit");
      })
      .catch((e) => setLoadError(e.message));
  };
  useEffect(load, []);

  const amount = preset ?? (custom ? Number(custom) : NaN);
  const amountError = useMemo(() => {
    if (!settings || preset !== null) return null;
    if (!custom) return "Please choose an amount";
    if (!/^\d+(\.\d{1,2})?$/.test(custom)) return "Enter a valid amount";
    if (amount < settings.customAmountMin || amount > settings.customAmountMax)
      return `Custom amount must be between $${settings.customAmountMin} and $${settings.customAmountMax}`;
    return null;
  }, [settings, preset, custom, amount]);

  const errs = {
    buyerName: !buyerName.trim() ? "Required" : null,
    buyerEmail: !EMAIL_RE.test(buyerEmail.trim()) ? "Enter a valid email" : null,
    buyerPhone: !PHONE_RE.test(buyerPhone.trim()) ? "Enter a valid phone number" : null,
    recipientName: !isForSelf && !recipientName.trim() ? "Required" : null,
    recipientEmail: !isForSelf && !EMAIL_RE.test(recipientEmail.trim()) ? "Enter a valid email" : null,
  };
  const detailsValid = Object.values(errs).every((e) => !e);

  const acceptSlip = (a: { uri: string; name: string; type: string; size?: number | null }) => {
    if (!SLIP_TYPES.includes(a.type)) return setSlipError("Please choose a JPG, PNG or PDF file.");
    if (a.size && a.size > MAX_SLIP_BYTES) return setSlipError("File is too large. Maximum size is 5 MB.");
    setSlip({ uri: a.uri, name: a.name, type: a.type, size: a.size ?? undefined });
  };

  /** Screenshots usually live in Photos; quality < 1 makes iOS re-encode HEIC as JPEG. */
  const pickPhoto = async () => {
    setSlipError(null);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: false });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    const isPng = (a.mimeType || a.fileName || a.uri).toLowerCase().includes("png");
    acceptSlip({
      uri: a.uri,
      name: a.fileName || `payment-slip.${isPng ? "png" : "jpg"}`,
      type: isPng ? "image/png" : "image/jpeg",
      size: a.fileSize,
    });
  };

  const pickFile = async () => {
    setSlipError(null);
    const res = await DocumentPicker.getDocumentAsync({ type: SLIP_TYPES, copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    const lower = a.name.toLowerCase();
    const type = a.mimeType || (lower.endsWith(".pdf") ? "application/pdf" : lower.endsWith(".png") ? "image/png" : "image/jpeg");
    acceptSlip({ uri: a.uri, name: a.name, type, size: a.size });
  };

  const next = () => {
    setTouched(true);
    if (step === 0 && amountError) return;
    if (step === 1 && !detailsValid) return;
    setTouched(false);
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setTouched(true);
    if (!method || !slip || !paidConfirmed) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await giftCardsService.purchase({
        amount,
        paymentMethod: method,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        buyerPhone: buyerPhone.trim(),
        isForSelf,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        message: message.trim() || undefined,
        slip: { uri: slip.uri, name: slip.name, type: slip.type },
      });
      setResultCode(res.code);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const callPub = () => Linking.openURL(`tel:${CONTACT_INFO.PHONE_RAW}`);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Gift Cards" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]} keyboardShouldPersistTaps="handled">
          <Text style={gcStyles.h1}>Give the gift of Brooklin</Text>
          <Text style={[gcStyles.muted, { marginBottom: spacing.base }]}>Never expires · No fees · Use over multiple visits</Text>

          <TouchableOpacity onPress={() => navigation.navigate("GiftCardCheck")} style={{ marginBottom: spacing.base }}>
            <Text style={styles.link}>Already have a gift card? Check balance or status →</Text>
          </TouchableOpacity>

          {loadError && (
            <Card>
              <Notice tone="error">{loadError}</Notice>
              <PrimaryButton title="Try again" onPress={load} variant="outline" />
            </Card>
          )}
          {!settings && !loadError && <ActivityIndicator color={colors.primary.main} style={{ marginTop: 40 }} />}

          {settings && !settings.isEnabled && (
            <Card>
              <Text style={gcStyles.h2}>Online sales are paused</Text>
              <Text style={gcStyles.body}>Please call us or visit the pub to buy a gift card.</Text>
              <View style={{ height: spacing.md }} />
              <PrimaryButton title={`Call ${CONTACT_INFO.PHONE}`} icon="call" onPress={callPub} />
            </Card>
          )}

          {settings?.isEnabled && done && (
            <Card>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} style={{ alignSelf: "center" }} />
              <Text style={[gcStyles.h2, { textAlign: "center", marginTop: spacing.sm }]}>Thank you!</Text>
              <Text style={[gcStyles.body, { textAlign: "center" }]}>
                We've emailed a confirmation to {buyerEmail}. Once we verify your payment, {isForSelf ? "you'll" : `${recipientName} will`} receive the gift card and its 4-digit PIN by email.
              </Text>
              <Text style={[gcStyles.mono, { textAlign: "center", fontSize: 20, marginVertical: spacing.base }]} selectable>{resultCode}</Text>
              <PrimaryButton title="Check order status" onPress={() => navigation.navigate("GiftCardCheck")} />
            </Card>
          )}

          {settings?.isEnabled && !done && (
            <Card>
              <Text style={styles.stepText}>Step {step + 1} of 3</Text>

              {step === 0 && (
                <>
                  <Text style={gcStyles.h2}>Choose an amount</Text>
                  <View style={styles.chips}>
                    {settings.presetAmounts.map((a) => (
                      <Chip key={a} label={`$${a}`} selected={preset === a} onPress={() => { setPreset(a); setCustom(""); }} />
                    ))}
                  </View>
                  {settings.customAmountEnabled && (
                    <View style={{ marginTop: spacing.md }}>
                      <Field
                        label={`Or a custom amount ($${settings.customAmountMin}–$${settings.customAmountMax})`}
                        value={custom}
                        onChangeText={(t) => { setCustom(t.replace(/[^\d.]/g, "")); setPreset(null); }}
                        keyboardType="decimal-pad"
                        placeholder="$"
                        error={touched ? amountError : null}
                      />
                    </View>
                  )}
                  {touched && amountError && !settings.customAmountEnabled && <Notice tone="error">{amountError}</Notice>}
                </>
              )}

              {step === 1 && (
                <>
                  <Text style={gcStyles.h2}>Your details</Text>
                  <Field label="Your name" value={buyerName} onChangeText={setBuyerName} autoComplete="name" maxLength={120} error={touched ? errs.buyerName : null} />
                  <Field label="Your email" value={buyerEmail} onChangeText={setBuyerEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={touched ? errs.buyerEmail : null} />
                  <Field label="Your phone" value={buyerPhone} onChangeText={setBuyerPhone} keyboardType="phone-pad" autoComplete="tel" error={touched ? errs.buyerPhone : null} />
                  <View style={styles.switchRow}>
                    <Text style={gcStyles.body}>This gift card is for me</Text>
                    <Switch value={isForSelf} onValueChange={setIsForSelf} trackColor={{ true: colors.secondary.main }} thumbColor="#fff" accessibilityLabel="This gift card is for me" />
                  </View>
                  {!isForSelf && (
                    <>
                      <Text style={[gcStyles.h2, { fontSize: 19, marginTop: spacing.sm }]}>Who is it for?</Text>
                      <Field label="Recipient's name" value={recipientName} onChangeText={setRecipientName} maxLength={120} error={touched ? errs.recipientName : null} />
                      <Field label="Recipient's email" value={recipientEmail} onChangeText={setRecipientEmail} keyboardType="email-address" autoCapitalize="none" hint="The gift card and PIN will be sent here" error={touched ? errs.recipientEmail : null} />
                    </>
                  )}
                  <Field label="Personal message (optional)" value={message} onChangeText={setMessage} multiline maxLength={500} hint={`${message.length}/500`} />
                </>
              )}

              {step === 2 && (
                <>
                  <Text style={gcStyles.h2}>Send your payment</Text>
                  <Text style={gcStyles.body}>
                    Transfer <Text style={gcStyles.bold}>${amount.toFixed(2)}</Text> using one of the options below, then upload a screenshot of your payment confirmation.
                  </Text>

                  {settings.interac && settings.bankDeposit && (
                    <View style={[styles.chips, { marginTop: spacing.md }]}>
                      <Chip label="e-Transfer" selected={method === "interac"} onPress={() => setMethod("interac")} />
                      <Chip label="Bank deposit" selected={method === "bank_deposit"} onPress={() => setMethod("bank_deposit")} />
                    </View>
                  )}
                  {touched && !method && <Notice tone="error">Please choose a payment method.</Notice>}

                  {method === "interac" && settings.interac && (
                    <View style={styles.payBox}>
                      <Text style={styles.payTitle}>Interac e-Transfer</Text>
                      <CopyRow label="Send to" value={settings.interac.email} />
                      <CopyRow label="Recipient name" value={settings.interac.recipientName} />
                      <CopyRow label="Amount" value={`$${amount.toFixed(2)}`} />
                      {settings.interac.instructions ? <Text style={[gcStyles.muted, { marginTop: 8 }]}>{settings.interac.instructions}</Text> : null}
                    </View>
                  )}
                  {method === "bank_deposit" && settings.bankDeposit && (
                    <View style={styles.payBox}>
                      <Text style={styles.payTitle}>Bank deposit</Text>
                      <CopyRow label="Bank" value={settings.bankDeposit.bankName} />
                      <CopyRow label="Account name" value={settings.bankDeposit.accountName} />
                      <CopyRow label="Institution #" value={settings.bankDeposit.institutionNumber} />
                      <CopyRow label="Transit #" value={settings.bankDeposit.transitNumber} />
                      <CopyRow label="Account #" value={settings.bankDeposit.accountNumber} />
                      <CopyRow label="Amount" value={`$${amount.toFixed(2)}`} />
                      {settings.bankDeposit.instructions ? <Text style={[gcStyles.muted, { marginTop: 8 }]}>{settings.bankDeposit.instructions}</Text> : null}
                    </View>
                  )}

                  <Text style={[styles.payTitle, { marginTop: spacing.base }]}>Payment slip</Text>
                  <View style={styles.uploadRow}>
                    <TouchableOpacity onPress={pickPhoto} style={[styles.upload, touched && !slip && { borderColor: colors.error }]} accessibilityRole="button" accessibilityLabel="Choose payment screenshot from photos">
                      <Ionicons name="image-outline" size={26} color={colors.primary.main} />
                      <Text style={[gcStyles.body, { textAlign: "center", marginTop: 6 }]}>Photo / screenshot</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickFile} style={[styles.upload, touched && !slip && { borderColor: colors.error }]} accessibilityRole="button" accessibilityLabel="Choose payment slip file">
                      <Ionicons name="document-attach-outline" size={26} color={colors.primary.main} />
                      <Text style={[gcStyles.body, { textAlign: "center", marginTop: 6 }]}>File (PDF)</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[gcStyles.muted, { marginTop: 6 }]}>{slip ? `Selected: ${slip.name}` : "JPG, PNG or PDF · max 5 MB"}</Text>
                  {slip && slip.type !== "application/pdf" && <Image source={{ uri: slip.uri }} style={styles.preview} resizeMode="contain" />}
                  {slipError && <Notice tone="error">{slipError}</Notice>}
                  {touched && !slip && !slipError && <Notice tone="error">Please upload your payment slip.</Notice>}

                  <TouchableOpacity style={styles.checkRow} onPress={() => setPaidConfirmed((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: paidConfirmed }}>
                    <Ionicons name={paidConfirmed ? "checkbox" : "square-outline"} size={22} color={touched && !paidConfirmed ? colors.error : colors.primary.main} />
                    <Text style={[gcStyles.muted, { flex: 1 }]}>
                      I have sent ${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}. The gift card is activated only after Brooklin Pub verifies the payment, and is issued for the amount actually received.
                    </Text>
                  </TouchableOpacity>
                  {submitError && <Notice tone="error">{submitError}</Notice>}
                </>
              )}

              <View style={styles.navRow}>
                {step > 0 ? (
                  <View style={{ flex: 1 }}><PrimaryButton title="Back" variant="outline" onPress={() => setStep((s) => s - 1)} disabled={submitting} /></View>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                <View style={{ width: spacing.md }} />
                <View style={{ flex: 1.4 }}>
                  {step < 2 ? (
                    <PrimaryButton title="Continue" onPress={next} />
                  ) : (
                    <PrimaryButton title="Submit order" onPress={submit} loading={submitting} />
                  )}
                </View>
              </View>
            </Card>
          )}

          <Text style={[gcStyles.muted, { textAlign: "center", marginTop: spacing.sm }]}>
            Questions? Call {CONTACT_INFO.PHONE} or use our Contact Us form.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Mandatory "save your ID" popup — Android back button is ignored until copied + acknowledged */}
      <Modal visible={!!resultCode && !done} transparent animationType="fade" onRequestClose={() => undefined}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Ionicons name="warning" size={40} color={colors.secondary.main} style={{ alignSelf: "center" }} />
            <Text style={[gcStyles.h2, { textAlign: "center", marginTop: spacing.sm }]}>Save your Gift Card ID</Text>
            <Text style={[gcStyles.body, { textAlign: "center" }]}>
              Your order has been received. <Text style={gcStyles.bold}>Please copy and keep this ID safe.</Text> You'll need it to check your order status, and our team will ask for it if you contact us.
            </Text>
            <View style={styles.codeBox}>
              <Text style={[gcStyles.mono, { fontSize: 22, fontWeight: "700", textAlign: "center" }]} selectable>{resultCode}</Text>
            </View>
            <PrimaryButton
              title={copied ? "Copied" : "Copy Gift Card ID"}
              icon={copied ? "checkmark" : "copy-outline"}
              onPress={async () => {
                if (resultCode) await Clipboard.setStringAsync(resultCode);
                setCopied(true);
              }}
            />
            <TouchableOpacity
              style={[styles.checkRow, { justifyContent: "center", opacity: copied ? 1 : 0.4 }]}
              disabled={!copied}
              onPress={() => setSavedAck((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: savedAck, disabled: !copied }}
            >
              <Ionicons name={savedAck ? "checkbox" : "square-outline"} size={22} color={colors.primary.main} />
              <Text style={gcStyles.body}>I have saved my Gift Card ID</Text>
            </TouchableOpacity>
            <PrimaryButton title="Close" variant="outline" disabled={!copied || !savedAck} onPress={() => setDone(true)} />
            <Text style={[gcStyles.muted, { textAlign: "center", marginTop: spacing.md }]}>
              Need help? Call {CONTACT_INFO.PHONE} or use the Contact Us form.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.default },
  content: { padding: spacing.base },
  link: { color: colors.primary.main, fontFamily: typography.fontFamily.bodySemibold, textDecorationLine: "underline" },
  stepText: { fontFamily: typography.fontFamily.bodySemibold, color: colors.secondary.dark, fontSize: typography.fontSize.xs, letterSpacing: 1, textTransform: "uppercase", marginBottom: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, marginBottom: spacing.sm },
  payBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: "rgba(217,167,86,0.08)", borderWidth: 1, borderColor: colors.border.gold },
  payTitle: { fontFamily: typography.fontFamily.bodyBold, color: colors.primary.main, fontSize: typography.fontSize.md, marginBottom: 4 },
  copyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(106,58,30,0.08)" },
  copyLabel: { fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#8B6914", fontFamily: typography.fontFamily.bodySemibold },
  copyValue: { fontFamily: typography.fontFamily.bodySemibold, color: colors.text.primary, fontSize: typography.fontSize.base },
  copyBtn: { padding: 8 },
  uploadRow: { flexDirection: "row", gap: spacing.sm },
  upload: { flex: 1, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border.goldStrong, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: "center", backgroundColor: "#fff" },
  preview: { width: "100%", height: 200, marginTop: spacing.sm, borderRadius: borderRadius.md, backgroundColor: "#f5f5f5" },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: spacing.md },
  navRow: { flexDirection: "row", marginTop: spacing.lg },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay.medium, justifyContent: "center", padding: spacing.lg },
  modalCard: { backgroundColor: colors.background.paper, borderRadius: borderRadius.xl, padding: spacing.xl, gap: spacing.sm },
  codeBox: { borderWidth: 2, borderStyle: "dashed", borderColor: colors.secondary.main, backgroundColor: "#FDF3E7", borderRadius: borderRadius.md, paddingVertical: spacing.base, marginVertical: spacing.md },
});
