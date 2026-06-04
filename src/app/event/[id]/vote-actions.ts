"use server";

import { createParticipantWithVotes } from "@/server/repo";

/** Persist a participant's availability for an event (votes written in a batch). */
export async function submitVotes(input: {
  eventId: string;
  name: string;
  availableSlotIds: string[];
  allSlotIds: string[];
}): Promise<{ participantId: string }> {
  const { participantId } = await createParticipantWithVotes({
    eventId: input.eventId,
    name: input.name.trim() || "Anonymous",
    availableSlotIds: input.availableSlotIds,
    allSlotIds: input.allSlotIds,
  });
  return { participantId };
}
