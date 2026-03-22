import { useCallback } from "react";
import * as Haptics from "expo-haptics";

/**
 * Enhanced haptic feedback hook with contextual patterns
 *
 * Provides haptic feedback patterns for various user interactions.
 * All methods safely handle errors to prevent crashes on unsupported devices.
 *
 * @example
 * const haptics = useHaptics();
 * haptics.buttonPress(); // Light feedback for button presses
 * haptics.formSuccess(); // Success notification for form submission
 */
export function useHaptics() {
  // ============================================================
  // Basic Impact Feedback
  // ============================================================

  const light = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const medium = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const heavy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, []);

  // ============================================================
  // Notification Feedback
  // ============================================================

  const success = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  }, []);

  const error = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {},
    );
  }, []);

  const warning = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
  }, []);

  // ============================================================
  // Selection Feedback
  // ============================================================

  const selection = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  // ============================================================
  // Contextual Patterns (NEW)
  // ============================================================

  /**
   * Button press feedback (light impact)
   * Use for: All button presses, touchable items
   */
  const buttonPress = useCallback(() => {
    light();
  }, [light]);

  /**
   * Toggle switch ON feedback (selection)
   * Use for: Switches, checkboxes, radio buttons when turning ON
   */
  const toggleOn = useCallback(() => {
    selection();
  }, [selection]);

  /**
   * Toggle switch OFF feedback (light impact)
   * Use for: Switches, checkboxes, radio buttons when turning OFF
   */
  const toggleOff = useCallback(() => {
    light();
  }, [light]);

  /**
   * Swipe action feedback (medium impact)
   * Use for: Swipe gestures, swipeable list items
   */
  const swipeAction = useCallback(() => {
    medium();
  }, [medium]);

  /**
   * Bottom sheet snap point reached (light impact)
   * Use for: Bottom sheet snapping to a position
   */
  const snapPoint = useCallback(() => {
    light();
  }, [light]);

  /**
   * Form submission success (success notification)
   * Use for: Successful form submissions, data saves
   */
  const formSuccess = useCallback(() => {
    success();
  }, [success]);

  /**
   * Form validation error (error notification)
   * Use for: Form validation failures, input errors
   */
  const formError = useCallback(() => {
    error();
  }, [error]);

  /**
   * Long press detected (heavy impact)
   * Use for: Long press gestures triggering actions
   */
  const longPress = useCallback(() => {
    heavy();
  }, [heavy]);

  /**
   * Modal/dialog opened (light impact)
   * Use for: Modal, dialog, bottom sheet opening
   */
  const modalOpen = useCallback(() => {
    light();
  }, [light]);

  /**
   * Modal/dialog closed (light impact)
   * Use for: Modal, dialog, bottom sheet closing
   */
  const modalClose = useCallback(() => {
    light();
  }, [light]);

  /**
   * Scroll/page indicator change (selection)
   * Use for: Carousel page change, tab switches
   */
  const pageChange = useCallback(() => {
    selection();
  }, [selection]);

  /**
   * Item deletion feedback (medium impact)
   * Use for: Deleting items, removing from lists
   */
  const itemDelete = useCallback(() => {
    medium();
  }, [medium]);

  /**
   * Pull to refresh triggered (medium impact)
   * Use for: Pull to refresh activation
   */
  const refreshTrigger = useCallback(() => {
    medium();
  }, [medium]);

  return {
    // Basic patterns
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,

    // Contextual patterns
    buttonPress,
    toggleOn,
    toggleOff,
    swipeAction,
    snapPoint,
    formSuccess,
    formError,
    longPress,
    modalOpen,
    modalClose,
    pageChange,
    itemDelete,
    refreshTrigger,
  };
}
