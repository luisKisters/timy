import { describe, expect, test } from "vitest";
import { shareMessage } from "@/lib/domain/share";

describe("shareMessage", () => {
  const base = {
    title: "Team Standup",
    startISO: "2024-03-17T18:00:00Z", // 2:00 PM EDT, Sunday Mar 17
    tz: "America/New_York",
  };

  test("confirmed message is tz-formatted", () => {
    expect(shareMessage(base)).toBe(
      "Hey team 👋 — Team Standup is confirmed for Sunday, Mar 17 at 2:00 PM. See you there!",
    );
  });

  test("changed message phrases it as an update", () => {
    expect(shareMessage({ ...base, changed: true })).toBe(
      "Update 👋 — Team Standup has moved to Sunday, Mar 17 at 2:00 PM. See you there!",
    );
  });
});
