import type { TimeSlot, Participant, Vote } from "@/types";

export interface SlotScore {
  slot: TimeSlot;
  availableCount: number;
  totalCount: number;
  percentage: number;
}

export function rankSlots(
  slots: TimeSlot[],
  participants: Participant[],
  votes: Vote[]
): SlotScore[] {
  const totalParticipants = participants.length;

  const scores: SlotScore[] = slots.map((slot) => {
    const slotVotes = votes.filter(
      (v) => v.slot_id === slot.id && v.available
    );
    return {
      slot,
      availableCount: slotVotes.length,
      totalCount: totalParticipants,
      percentage: totalParticipants > 0
        ? Math.round((slotVotes.length / totalParticipants) * 100)
        : 0,
    };
  });

  return scores.sort((a, b) => b.availableCount - a.availableCount);
}
