import { beforeAll, describe, expect, test } from "vitest";
import PocketBase from "pocketbase";
import { ensureBatchEnabled, ensureCollections } from "@/server/pb-schema";
import {
  createEventWithSlots,
  createParticipantWithVotes,
  getEventBundle,
  setResolvedSlot,
} from "@/server/repo";

const PB_URL = process.env.PB_TEST_URL;
const SU_EMAIL = process.env.PB_TEST_SU_EMAIL ?? "test@timy.local";
const SU_PASS = process.env.PB_TEST_SU_PASS ?? "password1234";

// Integration test — runs only when PB_TEST_URL points at a throwaway
// PocketBase. Without it the suite skips (so `pnpm test` is green everywhere).
describe.skipIf(!PB_URL)("repo (PocketBase integration)", () => {
  beforeAll(async () => {
    const pb = new PocketBase(PB_URL);
    await pb.collection("_superusers").authWithPassword(SU_EMAIL, SU_PASS);
    await ensureCollections(pb);
    await ensureBatchEnabled(pb);
    process.env.POCKETBASE_URL = PB_URL;
    process.env.POCKETBASE_AUTH_TOKEN = pb.authStore.token;
  });

  test("createEventWithSlots persists creator_name and batches slots", async () => {
    const { eventId, slotIds } = await createEventWithSlots({
      title: "Team Standup",
      creatorName: "Luis",
      expiry: null,
      slots: [
        { start: "2024-03-17T14:00:00Z", end: "2024-03-17T14:30:00Z" },
        { start: "2024-03-17T14:30:00Z", end: "2024-03-17T15:00:00Z" },
      ],
    });
    expect(eventId).toBeTruthy();
    expect(slotIds).toHaveLength(2);

    const bundle = await getEventBundle(eventId);
    expect(bundle.event.title).toBe("Team Standup");
    expect(bundle.event.creator_name).toBe("Luis");
    expect(bundle.slots).toHaveLength(2);
    expect(bundle.slots[0].start <= bundle.slots[1].start).toBe(true);
  });

  test("createParticipantWithVotes records availability for ranking", async () => {
    const { eventId, slotIds } = await createEventWithSlots({
      title: "Lunch",
      creatorName: "Host",
      expiry: null,
      slots: [
        { start: "2024-03-18T11:00:00Z", end: "2024-03-18T11:30:00Z" },
        { start: "2024-03-18T12:00:00Z", end: "2024-03-18T12:30:00Z" },
      ],
    });

    await createParticipantWithVotes({
      eventId,
      name: "Ada",
      availableSlotIds: [slotIds[0]],
      allSlotIds: slotIds,
    });
    await createParticipantWithVotes({
      eventId,
      name: "Max",
      availableSlotIds: slotIds,
      allSlotIds: slotIds,
    });

    const bundle = await getEventBundle(eventId);
    expect(bundle.participants).toHaveLength(2);
    expect(bundle.votes).toHaveLength(4);
    const slot0Available = bundle.votes.filter(
      (v) => v.slot_id === slotIds[0] && v.available,
    ).length;
    const slot1Available = bundle.votes.filter(
      (v) => v.slot_id === slotIds[1] && v.available,
    ).length;
    expect(slot0Available).toBe(2);
    expect(slot1Available).toBe(1);
  });

  test("setResolvedSlot confirms and clears a time", async () => {
    const { eventId, slotIds } = await createEventWithSlots({
      title: "Sync",
      expiry: null,
      slots: [{ start: "2024-03-19T09:00:00Z", end: "2024-03-19T09:30:00Z" }],
    });

    const confirmed = await setResolvedSlot(eventId, slotIds[0]);
    expect(confirmed.resolved_slot).toBe(slotIds[0]);

    const cleared = await setResolvedSlot(eventId, null);
    expect(cleared.resolved_slot).toBeFalsy();
  });
});
