"use server";

import { getPocketBaseAdmin } from "@/lib/pb-admin";

export async function submitAvailability(
  eventId: string,
  name: string,
  selectedSlotIds: string[]
) {
  const pb = getPocketBaseAdmin();

  // Create participant
  const participant = await pb.collection("participants").create({
    event_id: eventId,
    name,
  });

  // Fetch all slots for this event
  const slots = await pb.collection("time_slots").getFullList({
    filter: `event_id = "${eventId}"`,
  });

  // Create votes for each slot
  for (const slot of slots) {
    await pb.collection("votes").create({
      participant_id: participant.id,
      slot_id: slot.id,
      available: selectedSlotIds.includes(slot.id),
    });
  }

  return { success: true, participantId: participant.id };
}
