/** Timezone-aware display helpers shared by every screen. */

// Recent ICU (Node 22+) emits a narrow no-break space (U+202F) before AM/PM.
// Normalise to a regular space so output is stable and display is consistent.
const ODD_SPACES = /[  ]/g;
export function normalizeSpaces(value: string): string {
  return value.replace(ODD_SPACES, " ");
}

export function formatTimeRange(
  startISO: string,
  endISO: string,
  tz: string,
): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  // "2:00 PM" → keep the meridiem only on the end ("2:00 – 2:30 PM").
  const start = normalizeSpaces(fmt.format(new Date(startISO)));
  const end = normalizeSpaces(fmt.format(new Date(endISO)));
  const startNoMeridiem = start.replace(/\s?[AP]M$/, "");
  const startMeridiem = start.match(/[AP]M$/)?.[0];
  const endMeridiem = end.match(/[AP]M$/)?.[0];
  return startMeridiem === endMeridiem
    ? `${startNoMeridiem} – ${end}`
    : `${start} – ${end}`;
}

export function formatDayLong(startISO: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(startISO));
}

export function weekdayShort(startISO: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  })
    .format(new Date(startISO))
    .toUpperCase();
}

export function dayNumber(startISO: string, tz: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, day: "numeric" }).format(
      new Date(startISO),
    ),
  );
}

/**
 * Normalize a PocketBase datetime ("2024-03-18 14:00:00.000Z") to strict ISO
 * ("2024-03-18T14:00:00.000Z") so every browser (incl. Safari/Firefox) parses it.
 */
export function pbToISO(value: string): string {
  return value.includes("T") ? value : value.replace(" ", "T");
}

/** Stable per-day key (YYYY-MM-DD in tz) for grouping slots by day. */
export function dayKey(startISO: string, tz: string): string {
  const map: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(startISO))) {
    map[p.type] = p.value;
  }
  return `${map.year}-${map.month}-${map.day}`;
}
