import { expect, test } from "vitest";
import { rankSlots } from "@/lib/resolve";
import type { TimeSlot, Participant, Vote } from "@/types";

// Smoke test: confirms the `unit` project runs in node and the `@/*` alias resolves.
test("rankSlots scores availability (node env + alias smoke)", () => {
  const slots: TimeSlot[] = [
    { id: "s1", event_id: "e1", start: "", end: "", created: "", updated: "" },
  ];
  const participants: Participant[] = [
    { id: "p1", event_id: "e1", name: "Ada", created: "", updated: "" },
  ];
  const votes: Vote[] = [
    { id: "v1", participant_id: "p1", slot_id: "s1", available: true, created: "", updated: "" },
  ];

  const ranked = rankSlots(slots, participants, votes);

  expect(ranked).toHaveLength(1);
  expect(ranked[0].availableCount).toBe(1);
  expect(ranked[0].percentage).toBe(100);
});
