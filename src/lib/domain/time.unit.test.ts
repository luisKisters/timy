import { describe, expect, test } from "vitest";
import {
  generateSlots,
  slotWithinConfig,
  tzOffsetMs,
  zonedWallTimeToUtc,
} from "@/lib/domain/time";

const BERLIN = "Europe/Berlin";
const NY = "America/New_York";

describe("tzOffsetMs", () => {
  test("Berlin is +1h in winter (CET), +2h in summer (CEST)", () => {
    expect(tzOffsetMs(BERLIN, new Date("2024-01-01T00:00:00Z"))).toBe(3_600_000);
    expect(tzOffsetMs(BERLIN, new Date("2024-07-01T00:00:00Z"))).toBe(7_200_000);
  });
});

describe("zonedWallTimeToUtc", () => {
  test("maps wall time to the correct UTC instant per season", () => {
    expect(zonedWallTimeToUtc(2024, 1, 1, 9, 0, BERLIN).toISOString()).toBe(
      "2024-01-01T08:00:00.000Z",
    );
    expect(zonedWallTimeToUtc(2024, 7, 1, 9, 0, BERLIN).toISOString()).toBe(
      "2024-07-01T07:00:00.000Z",
    );
  });
});

describe("generateSlots", () => {
  test("produces interval-stepped slots across a window (9–17 @30 = 16)", () => {
    const slots = generateSlots({
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      windowStart: "09:00",
      windowEnd: "17:00",
      intervalMin: 30,
      tz: BERLIN,
      from: new Date("2024-06-03T00:00:00Z"),
      horizonDays: 1,
    });
    expect(slots).toHaveLength(16);
    // half-open: each slot's end equals the next slot's start
    expect(slots[0].end).toBe(slots[1].start);
  });

  test("includes only the selected weekdays", () => {
    // Mondays only, over a week from a Friday → exactly 2024-04-01 (Mon)
    const slots = generateSlots({
      weekdays: [1],
      windowStart: "09:00",
      windowEnd: "10:00",
      intervalMin: 60,
      tz: BERLIN,
      from: new Date("2024-03-29T12:00:00Z"),
      horizonDays: 7,
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].start.startsWith("2024-04-01")).toBe(true);
  });

  test("DST spring-forward (Berlin): same 09:00 window shifts UTC across the boundary", () => {
    const slots = generateSlots({
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      windowStart: "09:00",
      windowEnd: "10:00",
      intervalMin: 60,
      tz: BERLIN,
      from: new Date("2024-03-29T12:00:00Z"),
      horizonDays: 5, // 03-29 … 04-02, transition on 03-31
    });
    const before = slots.find((s) => s.start.startsWith("2024-03-29"));
    const after = slots.find((s) => s.start.startsWith("2024-04-01"));
    expect(before?.start).toBe("2024-03-29T08:00:00.000Z"); // CET (+1)
    expect(after?.start).toBe("2024-04-01T07:00:00.000Z"); // CEST (+2)
  });

  test("DST fall-back (New York): 09:00 window shifts UTC across the boundary", () => {
    const slots = generateSlots({
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      windowStart: "09:00",
      windowEnd: "10:00",
      intervalMin: 60,
      tz: NY,
      from: new Date("2024-11-01T12:00:00Z"),
      horizonDays: 5, // 11-01 … 11-05, transition on 11-03
    });
    const before = slots.find((s) => s.start.startsWith("2024-11-01"));
    const after = slots.find((s) => s.start.startsWith("2024-11-04"));
    expect(before?.start).toBe("2024-11-01T13:00:00.000Z"); // EDT (-4)
    expect(after?.start).toBe("2024-11-04T14:00:00.000Z"); // EST (-5)
  });

  test("does not crash generating across a spring-forward gap", () => {
    const slots = generateSlots({
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      windowStart: "01:00",
      windowEnd: "04:00",
      intervalMin: 60,
      tz: BERLIN,
      from: new Date("2024-03-31T00:00:00Z"),
      horizonDays: 1,
    });
    expect(slots).toHaveLength(3);
  });

  test("returns nothing for empty weekdays, inverted window, or zero interval", () => {
    const base = {
      windowStart: "09:00",
      windowEnd: "17:00",
      intervalMin: 30,
      tz: BERLIN,
      from: new Date("2024-06-03T00:00:00Z"),
      horizonDays: 7,
    };
    expect(generateSlots({ ...base, weekdays: [] })).toEqual([]);
    expect(generateSlots({ ...base, weekdays: [1], windowEnd: "09:00" })).toEqual([]);
    expect(generateSlots({ ...base, weekdays: [1], intervalMin: 0 })).toEqual([]);
  });
});

describe("slotWithinConfig", () => {
  const NY = "America/New_York";
  // 2024-03-18 is a Monday; 14:00Z = 10:00 EDT
  const monMorning = "2024-03-18T14:00:00.000Z";

  test("true when the slot's weekday + local time fall inside the window", () => {
    expect(
      slotWithinConfig(monMorning, {
        weekdays: [1],
        windowStart: "09:00",
        windowEnd: "17:00",
        tz: NY,
      }),
    ).toBe(true);
  });

  test("false when the weekday is not selected", () => {
    expect(
      slotWithinConfig(monMorning, {
        weekdays: [2, 3],
        windowStart: "09:00",
        windowEnd: "17:00",
        tz: NY,
      }),
    ).toBe(false);
  });

  test("false when outside the working-hours window", () => {
    expect(
      slotWithinConfig(monMorning, {
        weekdays: [1],
        windowStart: "11:00",
        windowEnd: "17:00",
        tz: NY,
      }),
    ).toBe(false);
  });
});
