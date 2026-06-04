import { beforeAll, describe, expect, test } from "vitest";
import PocketBase from "pocketbase";
import {
  applyAccessRules,
  ensureBatchEnabled,
  ensureCollections,
} from "@/server/pb-schema";
import { createEventWithSlots, getEventBundle } from "@/server/repo";

const PB_URL = process.env.PB_TEST_URL;
const SU_EMAIL = process.env.PB_TEST_SU_EMAIL ?? "test@timy.local";
const SU_PASS = process.env.PB_TEST_SU_PASS ?? "password1234";

describe.skipIf(!PB_URL)("access rules gate", () => {
  let pb: PocketBase;

  beforeAll(async () => {
    pb = new PocketBase(PB_URL);
    await pb.collection("_superusers").authWithPassword(SU_EMAIL, SU_PASS);
    await ensureCollections(pb);
    await ensureBatchEnabled(pb);
    process.env.POCKETBASE_URL = PB_URL;
    process.env.POCKETBASE_AUTH_TOKEN = pb.authStore.token;
  });

  test("locks list/create/update/delete; admin client still works", async () => {
    await applyAccessRules(pb);

    for (const name of ["events", "time_slots", "participants", "votes"]) {
      const col = await pb.collections.getOne(name);
      expect(col.listRule == null).toBe(true);
      expect(col.createRule == null).toBe(true);
      expect(col.updateRule == null).toBe(true);
      expect(col.deleteRule == null).toBe(true);
    }

    // The admin repo bypasses rules → create + read still succeed.
    const { eventId } = await createEventWithSlots({
      title: "Rules check",
      expiry: null,
      slots: [{ start: "2024-03-22T09:00:00.000Z", end: "2024-03-22T09:30:00.000Z" }],
    });
    const bundle = await getEventBundle(eventId);
    expect(bundle.event.title).toBe("Rules check");
  });
});
