import { beforeAll, describe, expect, test } from "vitest";
import PocketBase from "pocketbase";
import { ensureBatchEnabled, ensureCollections } from "@/server/pb-schema";
import { createEventWithSlots, getEventBundle } from "@/server/repo";
import { confirmSlot } from "@/app/event/[id]/results/actions";

const PB_URL = process.env.PB_TEST_URL;
const SU_EMAIL = process.env.PB_TEST_SU_EMAIL ?? "test@timy.local";
const SU_PASS = process.env.PB_TEST_SU_PASS ?? "password1234";

describe.skipIf(!PB_URL)("confirmSlot (PocketBase integration)", () => {
  beforeAll(async () => {
    const pb = new PocketBase(PB_URL);
    await pb.collection("_superusers").authWithPassword(SU_EMAIL, SU_PASS);
    await ensureCollections(pb);
    await ensureBatchEnabled(pb);
    process.env.POCKETBASE_URL = PB_URL;
    process.env.POCKETBASE_AUTH_TOKEN = pb.authStore.token;
  });

  test("confirms then clears the resolved slot", async () => {
    const { eventId, slotIds } = await createEventWithSlots({
      title: "Confirm me",
      expiry: null,
      slots: [{ start: "2024-03-21T09:00:00.000Z", end: "2024-03-21T09:30:00.000Z" }],
    });

    await confirmSlot(eventId, slotIds[0]);
    let bundle = await getEventBundle(eventId);
    expect(bundle.event.resolved_slot).toBe(slotIds[0]);

    await confirmSlot(eventId, null);
    bundle = await getEventBundle(eventId);
    expect(bundle.event.resolved_slot).toBeFalsy();
  });
});
