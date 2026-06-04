"use server";

import { createEventWithSlots } from "@/server/repo";
import { computeExpiry, type ExpiryOption } from "@/lib/domain/expiry";
import type { DraftSlot } from "@/lib/create-draft";

export interface CreateEventActionInput {
  title: string;
  hostName: string;
  expiry: ExpiryOption;
  slots: DraftSlot[];
}

/**
 * Persist a finished create-wizard draft. Resolves the poll-close option to an
 * absolute instant, then writes the event + all slots via the batched repo.
 */
export async function createEventFromDraft(
  input: CreateEventActionInput,
): Promise<{ eventId: string }> {
  const expiryISO = computeExpiry(input.expiry, {
    now: new Date(),
    slots: input.slots,
  });

  const { eventId } = await createEventWithSlots({
    title: input.title.trim() || "Untitled meeting",
    creatorName: input.hostName.trim() || undefined,
    expiry: expiryISO,
    slots: input.slots,
  });

  return { eventId };
}
