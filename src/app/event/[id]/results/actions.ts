"use server";

import { revalidatePath } from "next/cache";
import { setResolvedSlot } from "@/server/repo";

/** Confirm a slot as the chosen time (or clear it with `null`). */
export async function confirmSlot(
  eventId: string,
  slotId: string | null,
): Promise<void> {
  await setResolvedSlot(eventId, slotId);
  try {
    revalidatePath(`/event/${eventId}/results`);
    revalidatePath(`/event/${eventId}`);
  } catch {
    // revalidatePath is a no-op / throws outside a request context (e.g. tests)
  }
}
