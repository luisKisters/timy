import { describe, expect, test } from "vitest";
import { computeExpiry } from "@/lib/domain/expiry";

const now = new Date("2024-03-17T12:00:00Z");

describe("computeExpiry", () => {
  test("relative options add days to `now`", () => {
    expect(computeExpiry("1 day", { now })).toBe("2024-03-18T12:00:00.000Z");
    expect(computeExpiry("3 days", { now })).toBe("2024-03-20T12:00:00.000Z");
    expect(computeExpiry("1 week", { now })).toBe("2024-03-24T12:00:00.000Z");
  });

  test("'Never' → null", () => {
    expect(computeExpiry("Never", { now })).toBeNull();
  });

  test("'After last slot' → latest slot end", () => {
    expect(
      computeExpiry("After last slot", {
        now,
        slots: [
          { end: "2024-03-18T15:00:00Z" },
          { end: "2024-03-20T16:30:00Z" },
          { end: "2024-03-19T09:00:00Z" },
        ],
      }),
    ).toBe("2024-03-20T16:30:00.000Z");
  });

  test("'After last slot' with no slots → null", () => {
    expect(computeExpiry("After last slot", { now, slots: [] })).toBeNull();
  });
});
