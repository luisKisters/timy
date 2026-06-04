/**
 * Timezone-aware slot generation.
 *
 * All math is done against an IANA timezone using half-open `[start, end)`
 * instants. Wall-clock times (e.g. "09:00") are converted to absolute UTC
 * instants using the tz offset *on that specific date*, so DST transitions are
 * handled correctly (the same 09:00 window maps to a different UTC instant on
 * either side of a spring-forward / fall-back boundary).
 */

export interface GenerateSlotsOptions {
  /** Selected weekdays, 0 = Sunday … 6 = Saturday (matches `Date.getUTCDay`). */
  weekdays: number[];
  /** Window start as "HH:MM" wall-clock time in `tz`. */
  windowStart: string;
  /** Window end as "HH:MM" wall-clock time in `tz` (exclusive). */
  windowEnd: string;
  /** Slot length in minutes. */
  intervalMin: number;
  /** IANA timezone, e.g. "Europe/Berlin". */
  tz: string;
  /** Anchor instant; its calendar date in `tz` is day 0 of the horizon. */
  from: Date;
  /** Number of calendar days to scan (default 14). */
  horizonDays?: number;
}

export interface GeneratedSlot {
  /** UTC ISO instant. */
  start: string;
  /** UTC ISO instant (exclusive). */
  end: string;
}

/** The tz offset (wall − UTC) in milliseconds for `instant` in `tz`. */
export function tzOffsetMs(tz: string, instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUTC - instant.getTime();
}

/** Convert a wall-clock date-time in `tz` to the matching UTC instant. */
export function zonedWallTimeToUtc(
  year: number,
  month1: number, // 1-based month
  day: number,
  hour: number,
  minute: number,
  tz: string,
): Date {
  const guess = Date.UTC(year, month1 - 1, day, hour, minute);
  const offset1 = tzOffsetMs(tz, new Date(guess));
  let result = guess - offset1;
  // Refine once: around a DST transition the offset at the guess can differ
  // from the offset at the resolved instant.
  const offset2 = tzOffsetMs(tz, new Date(result));
  if (offset2 !== offset1) result = guess - offset2;
  return new Date(result);
}

function parseHHMM(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** The calendar Y/M/D of an instant as seen in `tz`. */
function calendarDateInTz(instant: Date, tz: string): { y: number; m: number; d: number } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(instant)) map[p.type] = p.value;
  return { y: Number(map.year), m: Number(map.month), d: Number(map.d ?? map.day) };
}

export function generateSlots(opts: GenerateSlotsOptions): GeneratedSlot[] {
  const { weekdays, intervalMin, tz, from } = opts;
  const horizon = opts.horizonDays ?? 14;
  const startMin = parseHHMM(opts.windowStart);
  const endMin = parseHHMM(opts.windowEnd);

  if (
    !weekdays.length ||
    intervalMin <= 0 ||
    endMin <= startMin ||
    horizon <= 0
  ) {
    return [];
  }

  const want = new Set(weekdays);
  const base = calendarDateInTz(from, tz);
  const slots: GeneratedSlot[] = [];

  for (let i = 0; i < horizon; i++) {
    // Pure calendar arithmetic via a UTC holder (no DST drift on the date).
    const holder = new Date(Date.UTC(base.y, base.m - 1, base.d + i));
    const y = holder.getUTCFullYear();
    const m = holder.getUTCMonth() + 1;
    const d = holder.getUTCDate();
    if (!want.has(holder.getUTCDay())) continue;

    for (let t = startMin; t + intervalMin <= endMin; t += intervalMin) {
      const s = t;
      const e = t + intervalMin;
      const start = zonedWallTimeToUtc(y, m, d, Math.floor(s / 60), s % 60, tz);
      const end = zonedWallTimeToUtc(y, m, d, Math.floor(e / 60), e % 60, tz);
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
  }

  slots.sort((a, b) => a.start.localeCompare(b.start));
  return slots;
}
