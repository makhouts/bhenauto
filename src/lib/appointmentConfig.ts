/**
 * Central configuration for appointment availability.
 * Adjust these values to change working hours, slot duration, etc.
 */

export const APPOINTMENT_CONFIG = {
  /** JS day-of-week indices that are working days (0 = Sunday, 1 = Monday … 6 = Saturday) */
  workingDays: [1, 2, 3, 4, 5] as number[], // Mon–Fri

  /** First slot starts at this hour (24h, local time) */
  startHour: 9, // 09:00

  /** Last slot must start BEFORE this hour */
  endHour: 18, // up to 17:00 for a 60-min slot ending at 18:00

  /** Length of each appointment slot in minutes */
  slotDurationMinutes: 60,

  /** Optional gap between slots in minutes (0 = back-to-back) */
  bufferMinutes: 0,

  /** Maximum concurrent bookings per time slot */
  maxBookingsPerSlot: 1,

  /** IANA timezone for all date/time calculations */
  timezone: "Europe/Brussels",

  /** Services offered in the booking form */
  services: [
    "Onderhoud",
    "Technische Controle",
    "Carrosserie",
    "Herstellingen",
    "Diagnose",
    "Andere",
  ],
} as const;

/**
 * Generate all time slot strings for a working day based on config.
 * Returns an array like ["09:00", "10:00", "11:00", ...]
 */
export function generateDaySlots(): string[] {
  const slots: string[] = [];
  const { startHour, endHour, slotDurationMinutes, bufferMinutes } = APPOINTMENT_CONFIG;
  const stepMinutes = slotDurationMinutes + bufferMinutes;

  let minuteOfDay = startHour * 60;
  const endMinutes = endHour * 60;

  while (minuteOfDay + slotDurationMinutes <= endMinutes) {
    const h = Math.floor(minuteOfDay / 60);
    const m = minuteOfDay % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    minuteOfDay += stepMinutes;
  }

  return slots;
}
