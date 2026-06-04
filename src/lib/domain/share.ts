import { normalizeSpaces } from "./format";

/** Build the prefilled "share the time" message shown on the Results screen. */
export function shareMessage(opts: {
  title: string;
  startISO: string;
  tz: string;
  /** When true, phrase it as an update to an already-confirmed time. */
  changed?: boolean;
}): string {
  const d = new Date(opts.startISO);
  const day = normalizeSpaces(
    new Intl.DateTimeFormat("en-US", {
      timeZone: opts.tz,
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(d),
  );
  const time = normalizeSpaces(
    new Intl.DateTimeFormat("en-US", {
      timeZone: opts.tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d),
  );

  if (opts.changed) {
    return `Update 👋 — ${opts.title} has moved to ${day} at ${time}. See you there!`;
  }
  return `Hey team 👋 — ${opts.title} is confirmed for ${day} at ${time}. See you there!`;
}
