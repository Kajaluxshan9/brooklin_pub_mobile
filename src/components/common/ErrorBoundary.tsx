import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius, shadows } from "../../config/theme";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <LinearGradient
            colors={[colors.background.default, colors.background.paper]}
            style={StyleSheet.absoluteFill}
          />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="warning" size={48} color={colors.secondary.main} />
            </View>
            <Text style={styles.title}>Something Went Wrong</Text>
            <Text style={styles.subtitle}>
              We encountered an unexpected error. Please try again.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.secondary.main, colors.secondary.dark]}
                style={styles.buttonGradient}
              >
                <Ionicons name="refresh" size={18} color={colors.primary.dark} />
                <Text style={styles.buttonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["4xl"],
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.glass.gold,
    borderWidth: 1,
    borderColor: colors.border.gold,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    ...shadows.gold,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["3xl"],
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing["2xl"],
  },
  errorBox: {
    backgroundColor: "rgba(138,42,42,0.08)",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.xl,
    width: "100%",
  },
  errorText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    lineHeight: 18,
  },
  button: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...shadows.gold,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.base,
  },
  buttonText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: colors.primary.dark,
  },
});

export default ErrorBoundary;
