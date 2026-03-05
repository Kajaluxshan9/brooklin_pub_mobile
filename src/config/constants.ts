/**
 * Application Constants
 * Centralized configuration for external URLs, API settings, and app-wide constants
 */

// =============================================================================
// API BASE URL - Change this to your backend URL
// =============================================================================

export const API_BASE_URL = "https://api.brooklinpub.com";

// =============================================================================
// EXTERNAL URLS
// =============================================================================

export const EXTERNAL_URLS = {
  ORDER_ONLINE:
    "https://www.eastserve.ca/ordering/restaurant/menu?company_uid=f0d6a7d8-6663-43c6-af55-0d11a9773920&restaurant_uid=29e4ef84-c523-4a58-9e4b-6546d6637312&facebook=true",

  SOCIAL: {
    FACEBOOK: "https://www.facebook.com/brooklinpub",
    INSTAGRAM: "https://www.instagram.com/brooklinpubngrill/",
    TIKTOK: "https://www.tiktok.com/@brooklinpubngrill",
  },

  GOOGLE_MAPS: "https://maps.google.com/?q=Brooklin+Pub+and+Grill",
  GOOGLE_MAPS_EMBED:
    "https://maps.google.com/maps?q=Brooklin%20Pub%20%26%20Grill%2015%20Baldwin%20St%20Whitby%20ON&t=&z=17&ie=UTF8&iwloc=&output=embed",
} as const;

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const API_CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000,
  STALE_TIME: 2 * 60 * 1000,
  REQUEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// =============================================================================
// UI CONFIGURATION
// =============================================================================

export const UI_CONFIG = {
  ANIMATION: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 400,
  },
  DROPDOWN_CLOSE_DELAY: 200,
  SEARCH_DEBOUNCE: 300,
  ITEMS_PER_PAGE: 12,
} as const;

// =============================================================================
// SPECIAL TYPES
// =============================================================================

export const SPECIAL_TYPES = {
  DAILY: "daily",
  DAY_TIME: "day_time",
  LATE_NIGHT: "late_night",
  GAME_TIME: "game_time",
  CHEF: "chef",
  SEASONAL: "seasonal",
} as const;

export type SpecialTypeConst =
  (typeof SPECIAL_TYPES)[keyof typeof SPECIAL_TYPES];

// =============================================================================
// CONTACT INFO
// =============================================================================

export const CONTACT_INFO = {
  PHONE: "(905) 425-3055",
  PHONE_RAW: "9054253055",
  EMAIL_GENERAL: "brooklinpub@gmail.com",
  EMAIL_EVENTS: "brooklinpubevents@gmail.com",
  ADDRESS: {
    STREET: "15 Baldwin Street",
    CITY: "Whitby",
    PROVINCE: "ON",
    POSTAL: "L1M 1A2",
    COUNTRY: "Canada",
    FULL: "15 Baldwin Street, Whitby, ON L1M 1A2, Canada",
  },
} as const;

// =============================================================================
// SUBJECT OPTIONS FOR CONTACT
// =============================================================================

export const SUBJECT_OPTIONS = [
  { value: "general", label: "General Inquiry" },
  { value: "reservation", label: "Party Reservation" },
  { value: "event", label: "Event Inquiry" },
  { value: "catering", label: "Catering Request" },
  { value: "feedback", label: "Feedback" },
  { value: "careers", label: "Careers" },
  { value: "other", label: "Other" },
] as const;
