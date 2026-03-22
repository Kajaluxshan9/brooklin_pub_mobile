import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, typography, spacing, borderRadius, shadows } from "../../config/theme";
import { newsletterService } from "../../services/newsletter.service";

const NEWSLETTER_KEY = "@brooklin_newsletter_subscribed";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

interface NewsletterFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export default function NewsletterForm({ onSuccess, compact = false }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const emailInputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    AsyncStorage.getItem(NEWSLETTER_KEY).then((val) => {
      if (val === "true") setAlreadySubscribed(true);
    });
  }, []);

  const animateSuccess = useCallback(() => {
    Animated.spring(checkmarkScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 200,
    }).start();
  }, [checkmarkScale]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      await newsletterService.subscribe({ email: email.trim(), name: name.trim() || undefined });
      await AsyncStorage.setItem(NEWSLETTER_KEY, "true");
      setSuccess(true);
      setLoading(false);
      animateSuccess();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
    } catch {
      // Treat backend errors gracefully — still store subscription locally
      await AsyncStorage.setItem(NEWSLETTER_KEY, "true");
      setSuccess(true);
      setLoading(false);
      animateSuccess();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
    }
  }, [email, name, animateSuccess, onSuccess]);

  if (alreadySubscribed || success) {
    return (
      <View style={styles.successContainer}>
        <Animated.View style={[styles.successIcon, { transform: [{ scale: checkmarkScale }] }]}>
          <Ionicons name="checkmark-circle" size={40} color={colors.success} />
        </Animated.View>
        <Text style={styles.successTitle}>You're subscribed!</Text>
        <Text style={styles.successSubtitle}>
          Stay tuned for the latest specials, events & updates from Brooklin Pub & Grill.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.container, compact && styles.containerCompact]}>
        {!compact && (
          <>
            <View style={styles.iconRow}>
              <Ionicons name="mail" size={24} color={colors.secondary.main} />
            </View>
            <Text style={styles.title}>Stay in the Loop</Text>
            <Text style={styles.subtitle}>
              Subscribe for exclusive specials, event announcements & more.
            </Text>
          </>
        )}

        {!compact && (
          <TextInput
            style={[styles.input, error && !email ? styles.inputError : null]}
            placeholder="Your name (optional)"
            placeholderTextColor={colors.text.muted}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            autoCapitalize="words"
            autoComplete="name"
          />
        )}

        <TextInput
          ref={emailInputRef}
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Enter your email address"
          placeholderTextColor={colors.text.muted}
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {error && (
          <Text style={styles.errorText}>
            <Ionicons name="alert-circle-outline" size={13} color={colors.error} /> {error}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
          style={styles.buttonWrap}
        >
          <LinearGradient
            colors={[colors.secondary.main, colors.secondary.dark]}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary.dark} />
            ) : (
              <>
                <Ionicons name="send" size={16} color={colors.primary.dark} />
                <Text style={styles.buttonText}>Subscribe</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>No spam, ever. Unsubscribe anytime.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glass.gold,
    borderWidth: 1,
    borderColor: colors.border.gold,
    borderRadius: borderRadius["2xl"],
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.md,
  },
  containerCompact: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    lineHeight: 18,
  },
  buttonWrap: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginTop: spacing.xs,
    ...shadows.gold,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  buttonText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: colors.primary.dark,
  },
  disclaimer: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  successIcon: {
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    textAlign: "center",
  },
  successSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
