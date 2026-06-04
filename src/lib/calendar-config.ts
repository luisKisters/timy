import type { DraftSlot } from "@/lib/create-draft";

/**
 * Configuration for the "check my calendar" scan, shared between the Times /
 * Vote screens and the create-time gcal endpoint. Encoded into the OAuth
 * `state` so the callback can regenerate the exact candidate slots.
 */
export interface CalendarConfig {
  /** Weekdays to scan, 0 = Sunday … 6 = Saturday. */
  weekdays: number[];
  /** Working-hours window in "HH:MM" wall-clock (event tz). */
  windowStart: string;
  windowEnd: string;
  /** Slot length in minutes. */
  intervalMin: number;
  /** IANA timezone. */
  tz: string;
  /** Anchor instant (ISO) — day 0 of the scan horizon. */
  fromISO: string;
  /** Days to scan ahead. */
  horizonDays: number;
}

// URL-safe base64 that works in both the browser (btoa/atob) and node (Buffer).
function toBase64Url(value: string): string {
  let b64: string;
  if (typeof btoa !== "undefined") {
    const bytes = new TextEncoder().encode(value);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    b64 = btoa(bin);
  } else {
    b64 = Buffer.from(value, "utf8").toString("base64");
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob !== "undefined") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

export function encodeConfig(config: CalendarConfig): string {
  return toBase64Url(JSON.stringify(config));
}

export function decodeConfig(token: string): CalendarConfig {
  return JSON.parse(fromBase64Url(token)) as CalendarConfig;
}

export function encodeSlots(slots: DraftSlot[]): string {
  return toBase64Url(JSON.stringify(slots));
}

export function decodeSlots(token: string): DraftSlot[] {
  try {
    return JSON.parse(fromBase64Url(token)) as DraftSlot[];
  } catch {
    return [];
  }
}
