import { describe, expect, test } from "vitest";
import {
  freeBusyToFreeSlots,
  mergeBusy,
  overlaps,
} from "@/lib/domain/freebusy";
import { generateSlots } from "@/lib/domain/time";

const busy1 = { start: "2024-03-17T14:00:00Z", end: "2024-03-17T15:00:00Z" };

describe("overlaps (half-open)", () => {
  test("touching intervals do not overlap", () => {
    expect(overlaps({ start: "2024-03-17T13:30:00Z", end: "2024-03-17T14:00:00Z" }, busy1)).toBe(false);
    expect(overlaps({ start: "2024-03-17T15:00:00Z", end: "2024-03-17T15:30:00Z" }, busy1)).toBe(false);
  });
  test("genuinely overlapping intervals do overlap", () => {
    expect(overlaps({ start: "2024-03-17T14:00:00Z", end: "2024-03-17T14:30:00Z" }, busy1)).toBe(true);
    expect(overlaps({ start: "2024-03-17T14:45:00Z", end: "2024-03-17T15:15:00Z" }, busy1)).toBe(true);
  });
});

describe("mergeBusy", () => {
  test("flattens busy arrays from multiple calendars", () => {
    const merged = mergeBusy({
      primary: { busy: [busy1] },
      "team@x": { busy: [{ start: "2024-03-17T16:00:00Z", end: "2024-03-17T16:30:00Z" }] },
      empty: {},
    });
    expect(merged).toHaveLength(2);
  });
  test("handles undefined", () => {
    expect(mergeBusy(undefined)).toEqual([]);
  });
});

describe("freeBusyToFreeSlots", () => {
  test("keeps only candidates that do not overlap any busy interval", () => {
    const candidates = [
      { id: "a", start: "2024-03-17T13:00:00Z", end: "2024-03-17T13:30:00Z" }, // free
      { id: "b", start: "2024-03-17T13:30:00Z", end: "2024-03-17T14:00:00Z" }, // free (touches)
      { id: "c", start: "2024-03-17T14:00:00Z", end: "2024-03-17T14:30:00Z" }, // busy
      { id: "d", start: "2024-03-17T14:30:00Z", end: "2024-03-17T15:00:00Z" }, // busy
      { id: "e", start: "2024-03-17T15:00:00Z", end: "2024-03-17T15:30:00Z" }, // free (touches)
    ];
    const free = freeBusyToFreeSlots([busy1], candidates);
    expect(free.map((s) => s.id)).toEqual(["a", "b", "e"]);
  });

  test("DST: instant-based overlap excludes the right generated slot", () => {
    // Berlin 09:00 on 2024-03-29 (CET) = 08:00Z; a busy block over 08:00–09:00Z
    // must exclude exactly that slot and keep the 10:00 (09:00Z) one.
    const slots = generateSlots({
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      windowStart: "09:00",
      windowEnd: "12:00",
      intervalMin: 60,
      tz: "Europe/Berlin",
      from: new Date("2024-03-29T00:00:00Z"),
      horizonDays: 1,
    });
    const free = freeBusyToFreeSlots(
      [{ start: "2024-03-29T08:00:00Z", end: "2024-03-29T09:00:00Z" }],
      slots,
    );
    expect(slots).toHaveLength(3);
    expect(free).toHaveLength(2);
    expect(free.some((s) => s.start === "2024-03-29T08:00:00.000Z")).toBe(false);
  });
});
