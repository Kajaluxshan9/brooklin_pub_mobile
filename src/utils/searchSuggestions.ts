/**
 * Search Suggestions Utility
 *
 * Provides search suggestions based on fuzzy matching and Levenshtein distance.
 */

/**
 * Popular search terms (hardcoded)
 */
export const POPULAR_SEARCHES = [
  "burger",
  "steak",
  "wings",
  "salad",
  "pasta",
  "gluten free",
  "vegetarian",
  "vegan",
  "seafood",
  "dessert",
];

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching and "did you mean?" suggestions
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1, // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Get search suggestions based on query
 */
export function getSuggestions<
  T extends { name: string; description?: string },
>(query: string, items: T[], maxSuggestions: number = 5): string[] {
  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const suggestions = new Set<string>();

  // 1. Exact prefix matches (highest priority)
  items.forEach((item) => {
    const name = item.name.toLowerCase();
    const desc = item.description?.toLowerCase() || "";

    if (name.startsWith(lowerQuery)) {
      suggestions.add(item.name);
    } else if (desc.startsWith(lowerQuery)) {
      suggestions.add(item.name);
    }
  });

  // 2. Contains matches (medium priority)
  items.forEach((item) => {
    const name = item.name.toLowerCase();
    const desc = item.description?.toLowerCase() || "";

    if (name.includes(lowerQuery) && !name.startsWith(lowerQuery)) {
      suggestions.add(item.name);
    } else if (desc.includes(lowerQuery) && !desc.startsWith(lowerQuery)) {
      suggestions.add(item.name);
    }
  });

  // 3. Fuzzy matches (low priority) - only if query is long enough
  if (lowerQuery.length >= 3) {
    items.forEach((item) => {
      const name = item.name.toLowerCase();
      const distance = levenshteinDistance(lowerQuery, name);
      const threshold = Math.floor(lowerQuery.length * 0.4); // 40% tolerance

      if (distance <= threshold && !suggestions.has(item.name)) {
        suggestions.add(item.name);
      }
    });
  }

  return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Get "Did you mean?" suggestion for a query
 */
export function getDidYouMeanSuggestion(
  query: string,
  items: string[],
): string | null {
  if (!query.trim() || query.length < 3) {
    return null;
  }

  const lowerQuery = query.toLowerCase();
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  items.forEach((item) => {
    const lowerItem = item.toLowerCase();
    const distance = levenshteinDistance(lowerQuery, lowerItem);

    // Only suggest if reasonably close but not exact
    if (distance > 0 && distance < 3 && distance < bestDistance) {
      bestMatch = item;
      bestDistance = distance;
    }
  });

  return bestMatch;
}

/**
 * Filter items based on search query
 */
export function filterBySearch<
  T extends { name: string; description?: string },
>(query: string, items: T[]): T[] {
  if (!query.trim()) {
    return items;
  }

  const lowerQuery = query.toLowerCase();

  return items.filter((item) => {
    const name = item.name.toLowerCase();
    const desc = item.description?.toLowerCase() || "";

    return name.includes(lowerQuery) || desc.includes(lowerQuery);
  });
}
