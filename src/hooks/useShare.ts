import { useCallback } from "react";
import * as Sharing from "expo-sharing";
import { Share, Platform } from "react-native";

interface ShareOptions {
  title: string;
  message: string;
  url?: string;
}

/**
 * Hook for native sharing using React Native's built-in Share API with
 * expo-sharing as a fallback for file sharing.
 */
export function useShare() {
  const shareContent = useCallback(async ({ title, message, url }: ShareOptions) => {
    try {
      const shareMessage = url ? `${message}\n\n${url}` : message;
      await Share.share(
        { title, message: shareMessage, url: Platform.OS === "ios" ? url : undefined },
        { dialogTitle: title }
      );
    } catch (err) {
      console.warn("[useShare] Share failed:", err);
    }
  }, []);

  const shareMenuItem = useCallback((name: string, description: string, price?: string) => {
    const priceStr = price ? ` - ${price}` : "";
    shareContent({
      title: `${name} at Brooklin Pub & Grill`,
      message: `Check out ${name}${priceStr} at Brooklin Pub & Grill!\n\n${description}\n\nVisit us at 15 Baldwin Street, Whitby, ON`,
    });
  }, [shareContent]);

  const shareEvent = useCallback((name: string, description: string, date?: string) => {
    const dateStr = date ? `\nDate: ${date}` : "";
    shareContent({
      title: `${name} at Brooklin Pub & Grill`,
      message: `Join us for ${name} at Brooklin Pub & Grill!${dateStr}\n\n${description}\n\nVisit us at 15 Baldwin Street, Whitby, ON`,
    });
  }, [shareContent]);

  const shareSpecial = useCallback((name: string, description: string) => {
    shareContent({
      title: `${name} - Brooklin Pub & Grill`,
      message: `Don't miss: ${name} at Brooklin Pub & Grill!\n\n${description}\n\nVisit us at 15 Baldwin Street, Whitby, ON`,
    });
  }, [shareContent]);

  const shareRestaurant = useCallback(() => {
    shareContent({
      title: "Brooklin Pub & Grill",
      message: "Check out Brooklin Pub & Grill! Great food, drinks & events in Whitby, ON.\n\n15 Baldwin Street, Whitby, ON L1M 1A2\n(905) 425-3055",
    });
  }, [shareContent]);

  return { shareContent, shareMenuItem, shareEvent, shareSpecial, shareRestaurant };
}
