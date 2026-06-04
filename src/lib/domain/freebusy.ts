/**
 * Free/busy filtering. Intervals are absolute instants (UTC ISO), so overlap
 * math is timezone-independent. Intervals are half-open `[start, end)`: a
 * candidate that merely *touches* a busy interval (slotStart === busyEnd) is
 * free.
 */

export interface Interval {
  start: string;
  end: string;
}

export function overlaps(a: Interval, b: Interval): boolean {
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();
  return aStart < bEnd && bStart < aEnd;
}

/** Merge busy intervals from one or more calendars into a flat list. */
export function mergeBusy(
  calendars: Record<string, { busy?: Interval[] }> | undefined,
): Interval[] {
  if (!calendars) return [];
  return Object.values(calendars).flatMap((c) => c.busy ?? []);
}

/** Keep only the candidates that don't overlap any busy interval. */
export function freeBusyToFreeSlots<T extends Interval>(
  busy: Interval[],
  candidates: T[],
): T[] {
  return candidates.filter((c) => !busy.some((b) => overlaps(c, b)));
}
