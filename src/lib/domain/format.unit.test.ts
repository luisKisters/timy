import { describe, expect, test } from "vitest";
import {
  dayKey,
  dayNumber,
  formatDayLong,
  formatTimeRange,
  weekdayShort,
} from "@/lib/domain/format";

const NY = "America/New_York";

describe("formatTimeRange", () => {
  test("collapses a shared meridiem", () => {
    expect(
      formatTimeRange("2024-03-17T18:00:00Z", "2024-03-17T18:30:00Z", NY),
    ).toBe("2:00 – 2:30 PM");
  });
  test("keeps both meridiems when they differ", () => {
    expect(
      formatTimeRange("2024-03-17T15:30:00Z", "2024-03-17T16:30:00Z", NY),
    ).toBe("11:30 AM – 12:30 PM");
  });
});

describe("day helpers (tz-aware)", () => {
  test("formatDayLong / weekdayShort / dayNumber", () => {
    expect(formatDayLong("2024-03-17T18:00:00Z", NY)).toBe("Sunday, Mar 17");
    expect(weekdayShort("2024-03-17T18:00:00Z", NY)).toBe("SUN");
    expect(dayNumber("2024-03-17T18:00:00Z", NY)).toBe(17);
  });

  test("dayKey reflects the tz calendar date, not UTC", () => {
    // 02:00Z on the 17th is still the 16th, 22:00 in New York
    expect(dayKey("2024-03-17T02:00:00Z", NY)).toBe("2024-03-16");
    expect(dayKey("2024-03-17T18:00:00Z", NY)).toBe("2024-03-17");
  });
});
