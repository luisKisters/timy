import { beforeAll, describe, expect, test } from "vitest";
import PocketBase from "pocketbase";
import { ensureBatchEnabled, ensureCollections } from "@/server/pb-schema";
import { getEventBundle } from "@/server/repo";
import { createEventFromDraft } from "@/app/create/actions";

const PB_URL = process.env.PB_TEST_URL;
const SU_EMAIL = process.env.PB_TEST_SU_EMAIL ?? "test@timy.local";
const SU_PASS = process.env.PB_TEST_SU_PASS ?? "password1234";

describe.skipIf(!PB_URL)("createEventFromDraft (PocketBase integration)", () => {
  beforeAll(async () => {
    const pb = new PocketBase(PB_URL);
    await pb.collection("_superusers").authWithPassword(SU_EMAIL, SU_PASS);
    await ensureCollections(pb);
    await ensureBatchEnabled(pb);
    process.env.POCKETBASE_URL = PB_URL;
    process.env.POCKETBASE_AUTH_TOKEN = pb.authStore.token;
  });

  test("persists with creator, batched slots, and resolved expiry", async () => {
    const slots = [
      { start: "2024-03-18T18:00:00.000Z", end: "2024-03-18T18:30:00.000Z" },
      { start: "2024-03-18T18:30:00.000Z", end: "2024-03-18T19:00:00.000Z" },
    ];
    const { eventId } = await createEventFromDraft({
      title: "Standup",
      hostName: "Luis",
      expiry: "After last slot",
      slots,
    });

    const bundle = await getEventBundle(eventId);
    expect(bundle.event.title).toBe("Standup");
    expect(bundle.event.creator_name).toBe("Luis");
    expect(bundle.slots).toHaveLength(2);
    // "After last slot" resolves to the latest slot end
    expect(bundle.event.expiry).toBeTruthy();
    expect(new Date(bundle.event.expiry as string).toISOString()).toBe(
      "2024-03-18T19:00:00.000Z",
    );
  });
});
