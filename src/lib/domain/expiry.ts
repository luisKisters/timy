export type ExpiryOption =
  | "1 day"
  | "3 days"
  | "1 week"
  | "After last slot"
  | "Never";

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  "1 day",
  "3 days",
  "1 week",
  "After last slot",
  "Never",
];

const DAY_MS = 86_400_000;

/**
 * Resolve a poll-close option to an absolute expiry instant (UTC ISO) or
 * `null` for "Never". `now` is injected for testability.
 */
export function computeExpiry(
  option: ExpiryOption,
  opts: { now: Date; slots?: { end: string }[] },
): string | null {
  switch (option) {
    case "Never":
      return null;
    case "1 day":
      return new Date(opts.now.getTime() + DAY_MS).toISOString();
    case "3 days":
      return new Date(opts.now.getTime() + 3 * DAY_MS).toISOString();
    case "1 week":
      return new Date(opts.now.getTime() + 7 * DAY_MS).toISOString();
    case "After last slot": {
      const slots = opts.slots ?? [];
      if (!slots.length) return null;
      const last = slots.reduce(
        (max, s) => Math.max(max, new Date(s.end).getTime()),
        0,
      );
      return new Date(last).toISOString();
    }
  }
}
