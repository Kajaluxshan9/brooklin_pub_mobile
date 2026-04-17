const TZ = "America/Toronto";

export const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });

export const fmtTime = (s: string) =>
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });

export const fmtDay = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { day: "numeric", timeZone: TZ });

export const fmtMonth = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { month: "short", timeZone: TZ });

export const isEventDisplayable = (event: { isActive: boolean; displayStartDate?: string; displayEndDate?: string }): boolean => {
  if (!event.isActive) return false;
  const now = new Date();
  if (event.displayStartDate && event.displayEndDate) {
    return now >= new Date(event.displayStartDate) && now <= new Date(event.displayEndDate);
  }
  return true;
};
