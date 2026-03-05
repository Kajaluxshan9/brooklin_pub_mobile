import { useMemo } from "react";
import { useApiWithCache } from "./useApi";
import { specialsService } from "../services/specials.service";
import type { Special } from "../types/api.types";
import { SPECIAL_TYPES } from "../config/constants";

export const isSpecialVisible = (special: Special): boolean => {
  if (!special.isActive) return false;

  const now = new Date();

  if (special.displayStartDate && special.displayEndDate) {
    const startDate = new Date(special.displayStartDate);
    const endDate = new Date(special.displayEndDate);
    return now >= startDate && now <= endDate;
  }

  if (special.type === SPECIAL_TYPES.DAILY) return true;
  return true;
};

export const isDailySpecial = (special: Special): boolean => {
  return (
    special.type === SPECIAL_TYPES.DAILY ||
    special.type === SPECIAL_TYPES.DAY_TIME ||
    special.specialCategory === SPECIAL_TYPES.LATE_NIGHT
  );
};

export const isOtherSpecial = (special: Special): boolean => {
  return !isDailySpecial(special);
};

export interface VisibleSpecialsResult {
  visibleSpecials: Special[];
  dailySpecials: Special[];
  otherSpecials: Special[];
  hasDailySpecials: boolean;
  hasOtherSpecials: boolean;
  specialCategories: { label: string; path: string; id: string }[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVisibleSpecials(): VisibleSpecialsResult {
  const {
    data: specialsData,
    loading,
    error,
    refetch,
  } = useApiWithCache<Special[]>("active-specials", () =>
    specialsService.getActiveSpecials(),
  );

  const visibleSpecials = useMemo(() => {
    if (!specialsData) return [];
    return specialsData.filter(isSpecialVisible);
  }, [specialsData]);

  const dailySpecials = useMemo(
    () => visibleSpecials.filter(isDailySpecial),
    [visibleSpecials],
  );
  const otherSpecials = useMemo(
    () => visibleSpecials.filter(isOtherSpecial),
    [visibleSpecials],
  );

  const hasDailySpecials = dailySpecials.length > 0;
  const hasOtherSpecials = otherSpecials.length > 0;

  const specialCategories = useMemo(() => {
    const categories: { label: string; path: string; id: string }[] = [];
    if (hasDailySpecials)
      categories.push({
        label: "Daily Specials",
        path: "/special/daily",
        id: "daily",
      });
    if (hasOtherSpecials)
      categories.push({
        label: "Other Specials",
        path: "/special/other",
        id: "other",
      });
    return categories;
  }, [hasDailySpecials, hasOtherSpecials]);

  return {
    visibleSpecials,
    dailySpecials,
    otherSpecials,
    hasDailySpecials,
    hasOtherSpecials,
    specialCategories,
    loading,
    error,
    refetch,
  };
}
