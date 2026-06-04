import { describe, expect, test } from "vitest";
import { generateICS } from "@/lib/ics";

describe("generateICS", () => {
  test("emits a valid VEVENT with summary + start/end", () => {
    const ics = generateICS({
      title: "Team Standup",
      start: new Date("2024-03-18T14:00:00.000Z"),
      end: new Date("2024-03-18T14:30:00.000Z"),
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Team Standup");
    expect(ics).toContain("DTSTART:20240318T140000Z");
    expect(ics).toContain("DTEND:20240318T143000Z");
    expect(ics.trim().endsWith("END:VCALENDAR")).toBe(true);
  });
});
