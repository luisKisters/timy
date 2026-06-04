import { beforeAll, describe, expect, test } from "vitest";
import PocketBase from "pocketbase";
import { ensureBatchEnabled, ensureCollections } from "@/server/pb-schema";
import { createEventWithSlots, getEventBundle } from "@/server/repo";
import { submitVotes } from "@/app/event/[id]/vote-actions";

const PB_URL = process.env.PB_TEST_URL;
const SU_EMAIL = process.env.PB_TEST_SU_EMAIL ?? "test@timy.local";
const SU_PASS = process.env.PB_TEST_SU_PASS ?? "password1234";

describe.skipIf(!PB_URL)("submitVotes (PocketBase integration)", () => {
  beforeAll(async () => {
    const pb = new PocketBase(PB_URL);
    await pb.collection("_superusers").authWithPassword(SU_EMAIL, SU_PASS);
    await ensureCollections(pb);
    await ensureBatchEnabled(pb);
    process.env.POCKETBASE_URL = PB_URL;
    process.env.POCKETBASE_AUTH_TOKEN = pb.authStore.token;
  });

  test("creates a participant and votes for the available slots", async () => {
    const { eventId, slotIds } = await createEventWithSlots({
      title: "Vote me",
      expiry: null,
      slots: [
        { start: "2024-03-20T10:00:00.000Z", end: "2024-03-20T10:30:00.000Z" },
        { start: "2024-03-20T11:00:00.000Z", end: "2024-03-20T11:30:00.000Z" },
      ],
    });

    await submitVotes({
      eventId,
      name: "Ada",
      availableSlotIds: [slotIds[0]],
      allSlotIds: slotIds,
    });

    const bundle = await getEventBundle(eventId);
    expect(bundle.participants).toHaveLength(1);
    expect(bundle.participants[0].name).toBe("Ada");
    expect(bundle.votes).toHaveLength(2);
    expect(bundle.votes.filter((v) => v.available)).toHaveLength(1);
    const yes = bundle.votes.find((v) => v.available);
    expect(yes?.slot_id).toBe(slotIds[0]);
  });
});
