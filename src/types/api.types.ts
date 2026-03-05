// API Response Types matching backend entities

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number | null;
  preparationTime?: number;
  allergens?: string[];
  dietaryInfo?: string[];
  isAvailable: boolean;
  imageUrls: string[];
  sortOrder: number;
  categoryId: string;
  hasMeasurements: boolean;
  createdAt: string;
  updatedAt: string;
  category?: MenuCategory;
  measurements?: MenuItemMeasurement[];
}

export interface MenuItemMeasurement {
  id: string;
  menuItemId: string;
  measurementTypeId: string;
  price: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  measurementType?: MeasurementType;
  measurementTypeEntity?: MeasurementType;
}

export interface MeasurementType {
  id: string;
  name: string;
  unit: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  primaryCategoryId?: string;
  createdAt: string;
  updatedAt: string;
  primaryCategory?: PrimaryCategory;
  menuItems?: MenuItem[];
}

export interface PrimaryCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: MenuCategory[];
}

export enum SpecialType {
  DAILY = "daily",
  GAME_TIME = "game_time",
  DAY_TIME = "day_time",
  CHEF = "chef",
  SEASONAL = "seasonal",
}

export enum DayOfWeek {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

export enum SpecialCategory {
  REGULAR = "regular",
  LATE_NIGHT = "late_night",
}

export interface Special {
  id: string;
  title: string;
  description: string;
  type: SpecialType;
  dayOfWeek?: DayOfWeek;
  specialCategory?: SpecialCategory;
  displayStartDate?: string;
  displayEndDate?: string;
  specialStartDate?: string;
  specialEndDate?: string;
  isActive: boolean;
  imageUrls: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export enum EventType {
  LIVE_MUSIC = "live_music",
  SPORTS_VIEWING = "sports_viewing",
  TRIVIA_NIGHT = "trivia_night",
  KARAOKE = "karaoke",
  PRIVATE_PARTY = "private_party",
  SPECIAL_EVENT = "special_event",
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  displayStartDate: string;
  displayEndDate: string;
  eventStartDate: string;
  eventEndDate: string;
  isActive: boolean;
  imageUrls: string[];
  ticketLink?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningHours {
  id: string;
  dayOfWeek: string;
  openTime: string | null;
  closeTime: string | null;
  isOpen: boolean;
  isActive: boolean;
  isClosedNextDay?: boolean;
  specialNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningHoursStatus {
  isOpen: boolean;
  currentHours?: OpeningHours | null;
  nextOpenTime?: string | null;
  currentDay?: string;
  todayHours?: OpeningHours | null;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  categoryId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: StoryCategory;
}

export interface StoryCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  stories?: Story[];
}
