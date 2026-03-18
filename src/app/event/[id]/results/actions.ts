"use server";

import { revalidatePath } from "next/cache";
import { getPocketBaseAdmin } from "@/lib/pb-admin";

export async function confirmSlot(eventId: string, slotId: string) {
  const pb = getPocketBaseAdmin();
  try {
    await pb.collection("events").update(eventId, { resolved_slot: slotId });
  } catch (err) {
    console.error("[confirmSlot] PocketBase update failed:", err);
    throw new Error("Failed to confirm slot");
  }
  revalidatePath(`/event/${eventId}/results`);
  revalidatePath(`/event/${eventId}`);
  return { success: true };
}

export async function unconfirmSlot(eventId: string) {
  const pb = getPocketBaseAdmin();
  try {
    await pb.collection("events").update(eventId, { resolved_slot: null });
  } catch (err) {
    console.error("[unconfirmSlot] PocketBase update failed:", err);
    throw new Error("Failed to unconfirm slot");
  }
  revalidatePath(`/event/${eventId}/results`);
  revalidatePath(`/event/${eventId}`);
  return { success: true };
}
