/**
 * The pub runs on Brooklin, Ontario time. Always derive "today" and "now"
 * from America/Toronto, never from the visitor's device clock/time zone.
 * Intl's tz database handles EST/EDT (daylight saving) automatically.
 */

export const TORONTO_TZ = "America/Toronto";

export const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type WeekdayKey = (typeof WEEKDAYS)[number];

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TORONTO_TZ,
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Current weekday and time of day in Toronto. */
export function getTorontoNow(date: Date = new Date()): {
  dayIndex: number;
  dayKey: WeekdayKey;
  hours: number;
  minutes: number;
  minutesOfDay: number;
} {
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dayKey = get("weekday").toLowerCase() as WeekdayKey;
  const dayIndex = Math.max(0, WEEKDAYS.indexOf(dayKey));
  const hours = Number(get("hour")) % 24; // some engines emit "24" at midnight
  const minutes = Number(get("minute"));
  return { dayIndex, dayKey: WEEKDAYS[dayIndex], hours, minutes, minutesOfDay: hours * 60 + minutes };
}
