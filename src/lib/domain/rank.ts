import type { TimeSlot, Participant, Vote } from "@/types";

export interface SlotScore {
  slot: TimeSlot;
  availableCount: number;
  totalCount: number;
  percentage: number;
}

/**
 * Rank slots by how many participants are available, descending. Ties break by
 * earliest start so ordering is stable and deterministic.
 */
export function rankSlots(
  slots: TimeSlot[],
  participants: Participant[],
  votes: Vote[],
): SlotScore[] {
  const totalParticipants = participants.length;

  const scores: SlotScore[] = slots.map((slot) => {
    const availableCount = votes.filter(
      (v) => v.slot_id === slot.id && v.available,
    ).length;
    return {
      slot,
      availableCount,
      totalCount: totalParticipants,
      percentage:
        totalParticipants > 0
          ? Math.round((availableCount / totalParticipants) * 100)
          : 0,
    };
  });

  return scores.sort((a, b) => {
    if (b.availableCount !== a.availableCount) {
      return b.availableCount - a.availableCount;
    }
    return a.slot.start.localeCompare(b.slot.start);
  });
}
