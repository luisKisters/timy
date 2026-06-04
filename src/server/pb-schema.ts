import type PocketBase from "pocketbase";

/**
 * Idempotently create the four Timy collections (events, time_slots,
 * participants, votes). Shared by the setup-db script and the repo integration
 * test so the schema is defined in exactly one place.
 *
 * Rules ship OPEN — see src/server/access-rules.ts for why and the Phase 11 gate.
 */
export async function ensureCollections(pb: PocketBase): Promise<void> {
  const existing = await pb.collections.getFullList();
  const names = new Set(existing.map((c) => c.name));

  const openRules = {
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: null,
  };

  if (!names.has("events")) {
    await pb.collections.create({
      name: "events",
      type: "base",
      ...openRules,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "text" },
        { name: "creator_name", type: "text" },
        { name: "expiry", type: "date" },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
  }
  const events = await pb.collections.getOne("events");

  if (!names.has("time_slots")) {
    await pb.collections.create({
      name: "time_slots",
      type: "base",
      ...openRules,
      fields: [
        { name: "event_id", type: "relation", required: true, maxSelect: 1, collectionId: events.id, cascadeDelete: true },
        { name: "start", type: "date", required: true },
        { name: "end", type: "date", required: true },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
  }
  const timeSlots = await pb.collections.getOne("time_slots");

  const hasResolved = events.fields.some((f: { name: string }) => f.name === "resolved_slot");
  if (!hasResolved) {
    await pb.collections.update(events.id, {
      fields: [
        ...events.fields,
        { name: "resolved_slot", type: "relation", maxSelect: 1, collectionId: timeSlots.id, required: false },
      ],
    });
  }

  if (!names.has("participants")) {
    await pb.collections.create({
      name: "participants",
      type: "base",
      ...openRules,
      fields: [
        { name: "event_id", type: "relation", required: true, maxSelect: 1, collectionId: events.id, cascadeDelete: true },
        { name: "name", type: "text", required: true },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
  }
  const participants = await pb.collections.getOne("participants");

  if (!names.has("votes")) {
    await pb.collections.create({
      name: "votes",
      type: "base",
      ...openRules,
      fields: [
        { name: "participant_id", type: "relation", required: true, maxSelect: 1, collectionId: participants.id, cascadeDelete: true },
        { name: "slot_id", type: "relation", required: true, maxSelect: 1, collectionId: timeSlots.id, cascadeDelete: true },
        { name: "available", type: "bool" },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
  }
}

/** Enable the batch API, required for the repo's batched writes. */
export async function ensureBatchEnabled(pb: PocketBase): Promise<void> {
  await pb.settings.update({
    batch: { enabled: true, maxRequests: 200, timeout: 30, maxBodySize: 0 },
  });
}
