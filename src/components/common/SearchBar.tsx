import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../config/theme";
import { useHaptics } from "../../hooks/useHaptics";
import {
  getSearchHistory,
  saveSearch,
  removeSearchItem,
  clearSearchHistory,
  type SearchHistoryItem,
} from "../../utils/searchHistory";

/**
 * SearchBar - Enhanced search component with history and suggestions
 *
 * Features:
 * - Search history stored in AsyncStorage
 * - Recent searches dropdown
 * - Clear button with scale-out animation
 * - Cancel button (iOS style)
 * - Suggestions based on provided data
 * - Debounced search
 * - Focus state animations
 * - Haptic feedback
 * - Accessibility support
 *
 * @example
 * <SearchBar
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   onSearch={handleSearch}
 *   placeholder="Search menu..."
 *   suggestions={menuItems.map(item => item.name)}
 * />
 */

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  showHistory?: boolean;
  debounceDelay?: number;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSearch,
  placeholder = "Search...",
  suggestions = [],
  showHistory = true,
  debounceDelay = 300,
  autoFocus = false,
}: SearchBarProps) {
  const { buttonPress } = useHaptics();

  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounceTimeout = useRef<NodeJS.Timeout>();
  const focusAnim = useRef(new Animated.Value(0)).current;
  const clearButtonScale = useRef(new Animated.Value(0)).current;

  // Load search history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Show/hide clear button based on value
  useEffect(() => {
    Animated.spring(clearButtonScale, {
      toValue: value.length > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 7,
    }).start();
  }, [value]);

  // Animate focus state
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  // Filter suggestions based on input
  useEffect(() => {
    if (value.length >= 2 && suggestions.length > 0) {
      const filtered = suggestions
        .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [value, suggestions]);

  const loadHistory = async () => {
    const history = await getSearchHistory();
    setSearchHistory(history);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleBlur = () => {
    // Delay to allow dropdown item press
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
    }, 200);
  };

  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        // Save to history
        saveSearch(query);
        loadHistory();

        // Trigger search
        onSearch(query);

        // Hide dropdown
        setShowDropdown(false);
      }
    },
    [onSearch],
  );

  const handleChangeText = (text: string) => {
    onChangeText(text);

    // Debounce search
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (text.trim()) {
        handleSearch(text);
      }
    }, debounceDelay);
  };

  const handleClear = () => {
    buttonPress();
    onChangeText("");
    setFilteredSuggestions([]);
  };

  const handleHistoryItemPress = (query: string) => {
    buttonPress();
    onChangeText(query);
    handleSearch(query);
  };

  const handleRemoveHistoryItem = async (query: string) => {
    buttonPress();
    await removeSearchItem(query);
    loadHistory();
  };

  const handleClearHistory = async () => {
    buttonPress();
    await clearSearchHistory();
    loadHistory();
  };

  // Show history or suggestions
  const dropdownData =
    value.length >= 2 && filteredSuggestions.length > 0
      ? filteredSuggestions.map((s) => ({
          type: "suggestion" as const,
          text: s,
        }))
      : showHistory && searchHistory.length > 0
        ? searchHistory.map((h) => ({
            type: "history" as const,
            text: h.query,
          }))
        : [];

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border.light, colors.secondary.main],
  });

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? colors.secondary.main : colors.text.muted}
          style={styles.searchIcon}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={() => handleSearch(value)}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search input"
          accessibilityHint="Enter search query"
        />

        {/* Clear Button */}
        {value.length > 0 && (
          <Animated.View
            style={[
              styles.clearButton,
              {
                transform: [{ scale: clearButtonScale }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Cancel Button (shows when focused) */}
        {isFocused && (
          <TouchableOpacity
            onPress={() => {
              handleClear();
              setShowDropdown(false);
            }}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel search"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Dropdown (History or Suggestions) */}
      {showDropdown && dropdownData.length > 0 && (
        <View style={styles.dropdown}>
          {/* Clear History Button */}
          {value.length === 0 && searchHistory.length > 0 && (
            <TouchableOpacity
              style={styles.clearHistoryButton}
              onPress={handleClearHistory}
              accessibilityRole="button"
              accessibilityLabel="Clear search history"
            >
              <Text style={styles.clearHistoryText}>Clear History</Text>
            </TouchableOpacity>
          )}

          {/* Dropdown Items */}
          <FlatList
            data={dropdownData}
            keyExtractor={(item, index) => `${item.type}-${item.text}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleHistoryItemPress(item.text)}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${item.text}`}
              >
                <Ionicons
                  name={item.type === "history" ? "time-outline" : "search"}
                  size={16}
                  color={colors.text.muted}
                  style={styles.dropdownIcon}
                />
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {item.text}
                </Text>

                {item.type === "history" && (
                  <TouchableOpacity
                    onPress={() => handleRemoveHistoryItem(item.text)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Remove from history"
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={colors.text.muted}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
            style={styles.dropdownList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.base,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: spacing.sm,
  },
  cancelButton: {
    marginLeft: spacing.md,
  },
  cancelText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.secondary.main,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.base,
    ...shadows.md,
    maxHeight: 250,
    zIndex: 1001,
  },
  clearHistoryButton: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    alignItems: "center",
  },
  clearHistoryText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dropdownIcon: {
    marginRight: spacing.sm,
  },
  dropdownText: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
});
