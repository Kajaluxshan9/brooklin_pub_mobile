/**
 * Shared layout constants for consistent spacing across the app.
 *
 * The floating tab bar sits at the bottom of the screen with a margin.
 * On Android "standard" (3-button) navigation the system nav bar is NOT
 * part of the safe-area insets reported by react-native-safe-area-context
 * when the tab bar uses `position: "absolute"`.  We must account for this
 * ourselves so content never hides behind the tab bar OR behind the
 * Android nav buttons.
 */
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Visual height of our custom floating tab bar (icon + label row). */
export const TAB_BAR_HEIGHT = 64;

/**
 * Hook that returns the correct bottom padding for scrollable content so it
 * clears the floating tab bar regardless of Android gesture vs 3-button nav.
 */
export function useScrollBottomPadding() {
  const insets = useSafeAreaInsets();
  const tabBarBottom =
    Math.max(insets.bottom, Platform.OS === "ios" ? 24 : 8) + 8;
  return tabBarBottom + TAB_BAR_HEIGHT + 16;
}

/**
 * Returns the Y-offset where the top of the tab bar sits, useful for
 * positioning FABs and floating elements above the tab bar.
 */
export function useTabBarTopOffset() {
  const insets = useSafeAreaInsets();
  const tabBarBottom =
    Math.max(insets.bottom, Platform.OS === "ios" ? 24 : 8) + 8;
  return tabBarBottom + TAB_BAR_HEIGHT;
}
