"use server";

import { revalidatePath } from "next/cache";
import { getPocketBaseAdmin } from "@/lib/pb-admin";

export async function confirmSlot(eventId: string, slotId: string) {
  const pb = getPocketBaseAdmin();
  await pb.collection("events").update(eventId, {
    resolved_slot: slotId,
  });
  revalidatePath(`/event/${eventId}/results`);
  revalidatePath(`/event/${eventId}`);
  return { success: true };
}
