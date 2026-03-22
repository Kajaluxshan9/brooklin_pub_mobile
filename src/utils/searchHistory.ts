import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Search History Utility
 *
 * Manages search history persistence using AsyncStorage.
 * Stores last 10 searches with timestamps and frequency counts.
 */

const SEARCH_HISTORY_KEY = "@brooklin_pub:search_history";
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  count: number;
}

/**
 * Get search history from storage
 */
export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  try {
    const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (history) {
      const parsed = JSON.parse(history);
      // Sort by timestamp (most recent first)
      return parsed.sort(
        (a: SearchHistoryItem, b: SearchHistoryItem) =>
          b.timestamp - a.timestamp,
      );
    }
    return [];
  } catch (error) {
    console.error("Failed to get search history:", error);
    return [];
  }
};

/**
 * Save a search query to history
 */
export const saveSearch = async (query: string): Promise<void> => {
  try {
    if (!query.trim()) return;

    const history = await getSearchHistory();
    const existingIndex = history.findIndex(
      (item) => item.query.toLowerCase() === query.toLowerCase(),
    );

    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex].timestamp = Date.now();
      history[existingIndex].count += 1;
    } else {
      // Add new entry
      history.unshift({
        query: query.trim(),
        timestamp: Date.now(),
        count: 1,
      });
    }

    // Keep only the most recent MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    await AsyncStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(trimmedHistory),
    );
  } catch (error) {
    console.error("Failed to save search:", error);
  }
};

/**
 * Clear all search history
 */
export const clearSearchHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
};

/**
 * Remove a specific search item from history
 */
export const removeSearchItem = async (query: string): Promise<void> => {
  try {
    const history = await getSearchHistory();
    const filteredHistory = history.filter(
      (item) => item.query.toLowerCase() !== query.toLowerCase(),
    );

    await AsyncStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(filteredHistory),
    );
  } catch (error) {
    console.error("Failed to remove search item:", error);
  }
};

/**
 * Get popular searches (by frequency)
 */
export const getPopularSearches = async (
  limit: number = 5,
): Promise<string[]> => {
  try {
    const history = await getSearchHistory();
    // Sort by count (most frequent first)
    const sorted = history.sort((a, b) => b.count - a.count);
    return sorted.slice(0, limit).map((item) => item.query);
  } catch (error) {
    console.error("Failed to get popular searches:", error);
    return [];
  }
};
