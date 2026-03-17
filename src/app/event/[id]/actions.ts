"use server";

import { revalidatePath } from "next/cache";
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
    filter: `event_id = '${eventId}'`,
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

export async function updateAvailability(
  participantId: string,
  name: string,
  selectedSlotIds: string[],
  eventId: string
) {
  const pb = getPocketBaseAdmin();

  await pb.collection("participants").update(participantId, { name });

  const slots = await pb.collection("time_slots").getFullList({
    filter: `event_id = '${eventId}'`,
  });

  const existingVotes = await pb.collection("votes").getFullList({
    filter: `participant_id = '${participantId}'`,
  });

  for (const slot of slots) {
    const existing = existingVotes.find((v) => v.slot_id === slot.id);
    const available = selectedSlotIds.includes(slot.id);
    if (existing) {
      await pb.collection("votes").update(existing.id, { available });
    } else {
      await pb.collection("votes").create({ participant_id: participantId, slot_id: slot.id, available });
    }
  }

  return { success: true };
}

export async function addSlotsToEvent(
  eventId: string,
  slots: { date: string; startTime: string; endTime: string }[]
) {
  const pb = getPocketBaseAdmin();
  for (const slot of slots) {
    await pb.collection("time_slots").create({
      event_id: eventId,
      start: new Date(`${slot.date}T${slot.startTime}:00`).toISOString(),
      end: new Date(`${slot.date}T${slot.endTime}:00`).toISOString(),
    });
  }
  revalidatePath(`/event/${eventId}`);
  revalidatePath(`/event/${eventId}/results`);
  return { success: true };
}

export async function removeSlot(slotId: string, eventId: string) {
  const pb = getPocketBaseAdmin();
  // Delete associated votes first
  const votes = await pb.collection("votes").getFullList({ filter: `slot_id = '${slotId}'` });
  for (const vote of votes) {
    await pb.collection("votes").delete(vote.id);
  }
  await pb.collection("time_slots").delete(slotId);
  revalidatePath(`/event/${eventId}`);
  revalidatePath(`/event/${eventId}/results`);
  return { success: true };
}

export async function saveSharedAIKey(eventId: string, provider: string, apiKey: string) {
  const { saveEventAIKey } = await import("@/lib/ai-config-server");
  await saveEventAIKey(eventId, provider, apiKey);
  revalidatePath(`/event/${eventId}`);
}

export async function clearSharedAIKey(eventId: string) {
  const { clearEventAIKey } = await import("@/lib/ai-config-server");
  await clearEventAIKey(eventId);
  revalidatePath(`/event/${eventId}`);
}
