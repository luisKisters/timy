import { describe, expect, test } from "vitest";
import { rankSlots } from "@/lib/domain/rank";
import type { Participant, TimeSlot, Vote } from "@/types";

function slot(id: string, start: string): TimeSlot {
  return { id, event_id: "e", start, end: start, created: "", updated: "" };
}
function p(id: string): Participant {
  return { id, event_id: "e", name: id, created: "", updated: "" };
}
function v(participant_id: string, slot_id: string, available: boolean): Vote {
  return { id: `${participant_id}-${slot_id}`, participant_id, slot_id, available, created: "", updated: "" };
}

describe("rankSlots", () => {
  test("ranks by available count desc, then earliest start", () => {
    const slots = [
      slot("s1", "2024-03-17T14:00:00Z"),
      slot("s2", "2024-03-18T10:00:00Z"),
      slot("s3", "2024-03-19T15:00:00Z"),
    ];
    const participants = [p("p1"), p("p2"), p("p3")];
    const votes = [
      v("p1", "s1", true), v("p2", "s1", true), // s1: 2
      v("p1", "s2", true), v("p2", "s2", true), v("p3", "s2", true), // s2: 3
      v("p1", "s3", true), // s3: 1
    ];
    const ranked = rankSlots(slots, participants, votes);
    expect(ranked.map((r) => r.slot.id)).toEqual(["s2", "s1", "s3"]);
    expect(ranked[0]).toMatchObject({ availableCount: 3, totalCount: 3, percentage: 100 });
    expect(ranked[1].percentage).toBe(67);
  });

  test("ties break by earliest start", () => {
    const slots = [
      slot("late", "2024-03-19T15:00:00Z"),
      slot("early", "2024-03-17T15:00:00Z"),
    ];
    const participants = [p("p1")];
    const votes = [v("p1", "late", true), v("p1", "early", true)];
    const ranked = rankSlots(slots, participants, votes);
    expect(ranked.map((r) => r.slot.id)).toEqual(["early", "late"]);
  });

  test("0 participants → 0%", () => {
    const ranked = rankSlots([slot("s1", "2024-03-17T14:00:00Z")], [], []);
    expect(ranked[0].percentage).toBe(0);
  });
});
