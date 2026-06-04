import { describe, expect, test } from "vitest";
import {
  type CalendarConfig,
  decodeConfig,
  decodeSlots,
  encodeConfig,
  encodeSlots,
} from "@/lib/calendar-config";

describe("calendar-config codec", () => {
  test("config round-trips through base64url", () => {
    const config: CalendarConfig = {
      weekdays: [1, 2, 3, 4, 5],
      windowStart: "09:00",
      windowEnd: "17:00",
      intervalMin: 30,
      tz: "Europe/Berlin",
      fromISO: "2024-03-29T00:00:00.000Z",
      horizonDays: 14,
    };
    expect(decodeConfig(encodeConfig(config))).toEqual(config);
  });

  test("slots round-trip; bad token decodes to []", () => {
    const slots = [{ start: "2024-03-29T08:00:00.000Z", end: "2024-03-29T08:30:00.000Z" }];
    expect(decodeSlots(encodeSlots(slots))).toEqual(slots);
    expect(decodeSlots("!!!not-valid!!!")).toEqual([]);
  });
});
