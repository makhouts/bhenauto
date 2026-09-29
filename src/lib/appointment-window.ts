import { addDays, addMonths, format, startOfMonth, startOfWeek } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { APPOINTMENT_CONFIG } from "./appointmentConfig";

export type CalendarRange = { start: string; end: string };
const dayKey = (date: Date) => format(date, "yyyy-MM-dd");
export function calendarWeek(date: Date): CalendarRange {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return { start: dayKey(start), end: dayKey(addDays(start, 7)) };
}
export function calendarMonth(date: Date): CalendarRange {
  const start = startOfMonth(date);
  return { start: dayKey(start), end: dayKey(addMonths(start, 1)) };
}
export function calendarDay(date: Date): CalendarRange {
  return { start: dayKey(date), end: dayKey(addDays(date, 1)) };
}
export function canonicalRanges(ranges: CalendarRange[]) {
  return [...new Map(ranges.map((range) => [`${range.start}:${range.end}`, range])).values()]
    .filter((range, _index, all) => !all.some((other) => other !== range && other.start <= range.start && other.end >= range.end))
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}
export const appointmentWindowSchema = z.object({
  ranges: z.array(z.object({ start: z.iso.date(), end: z.iso.date() }).refine(({ start, end }) => {
    const days = (Date.parse(end) - Date.parse(start)) / 86_400_000;
    return days > 0 && days <= 42;
  })).min(1).max(8),
  pendingPage: z.number().int().min(1).max(1_000_000),
});
export type AppointmentWindowRequest = z.infer<typeof appointmentWindowSchema>;
export function calendarDateWhere(ranges: CalendarRange[]) {
  return canonicalRanges(ranges).map(({ start, end }) => ({ date: {
    gte: fromZonedTime(`${start}T00:00:00`, APPOINTMENT_CONFIG.timezone),
    lt: fromZonedTime(`${end}T00:00:00`, APPOINTMENT_CONFIG.timezone),
  } }));
}
