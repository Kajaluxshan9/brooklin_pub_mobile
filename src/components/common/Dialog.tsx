import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Modal } from "./Modal";
import { colors, typography, spacing, borderRadius } from "../../config/theme";
import { useHaptics } from "../../hooks/useHaptics";

/**
 * Dialog - Pre-configured modal dialogs for common use cases
 *
 * Features:
 * - Four variants: alert, confirm, input, custom
 * - Primary and secondary action buttons
 * - Input variant with text field
 * - Haptic feedback for actions
 * - Accessibility support
 *
 * @example
 * <Dialog
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   variant="confirm"
 *   title="Delete Item?"
 *   message="Are you sure you want to delete this item? This cannot be undone."
 *   primaryAction={{ label: "Delete", onPress: handleDelete }}
 *   secondaryAction={{ label: "Cancel", onPress: () => setIsOpen(false) }}
 * />
 */

export interface DialogAction {
  label: string;
  onPress: (inputValue?: string) => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  variant?: "alert" | "confirm" | "input" | "custom";
  title: string;
  message?: string;
  primaryAction?: DialogAction;
  secondaryAction?: DialogAction;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
  children?: React.ReactNode; // For custom variant
}

export function Dialog({
  visible,
  onClose,
  variant = "alert",
  title,
  message,
  primaryAction,
  secondaryAction,
  inputPlaceholder = "Enter text...",
  inputDefaultValue = "",
  children,
}: DialogProps) {
  const [inputValue, setInputValue] = useState(inputDefaultValue);
  const { buttonPress } = useHaptics();

  const handlePrimaryAction = () => {
    buttonPress();
    if (variant === "input") {
      primaryAction?.onPress(inputValue);
    } else {
      primaryAction?.onPress();
    }
    onClose();
  };

  const handleSecondaryAction = () => {
    buttonPress();
    secondaryAction?.onPress();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="centered"
      showCloseButton={false}
      dismissible={variant === "alert" || !primaryAction}
      enableGesture={false}
      animationType="scale"
    >
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>

        {/* Message */}
        {message && <Text style={styles.message}>{message}</Text>}

        {/* Input (input variant only) */}
        {variant === "input" && (
          <TextInput
            style={styles.input}
            placeholder={inputPlaceholder}
            placeholderTextColor={colors.text.muted}
            value={inputValue}
            onChangeText={setInputValue}
            autoFocus
            accessibilityLabel="Dialog input field"
          />
        )}

        {/* Custom content */}
        {variant === "custom" && children}

        {/* Actions */}
        <View style={styles.actions}>
          {/* Secondary Action (left) */}
          {secondaryAction && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSecondaryAction}
              disabled={secondaryAction.disabled}
              accessibilityRole="button"
              accessibilityLabel={secondaryAction.label}
            >
              <Text style={styles.secondaryButtonText}>
                {secondaryAction.label}
              </Text>
            </TouchableOpacity>
          )}

          {/* Primary Action (right) */}
          {primaryAction && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                primaryAction.destructive && styles.destructiveButton,
                primaryAction.disabled && styles.disabledButton,
              ]}
              onPress={handlePrimaryAction}
              disabled={primaryAction.disabled}
              accessibilityRole="button"
              accessibilityLabel={primaryAction.label}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  primaryAction.destructive && styles.destructiveButtonText,
                ]}
              >
                {primaryAction.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.base,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize["2xl"],
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  message: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.base,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: colors.secondary.main,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border.goldStrong,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: colors.primary.dark,
  },
  destructiveButtonText: {
    color: "#fff",
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.bodySemibold,
    fontSize: typography.fontSize.base,
    color: colors.secondary.main,
  },
});
