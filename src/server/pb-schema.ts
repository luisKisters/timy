import type PocketBase from "pocketbase";
import { TARGET_RULES } from "./access-rules";

type FieldDef = Record<string, unknown> & { name: string };

/** The two autodate fields every collection carries (sortable creation order). */
const AUTODATE: FieldDef[] = [
  { name: "created", type: "autodate", onCreate: true, onUpdate: false },
  { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
];

/**
 * Add any declared fields missing from an existing collection (matched by name).
 * Non-destructive: existing fields keep their ids; only new fields are appended.
 * This is what lets setup self-heal schema drift — e.g. a collection created by
 * an older schema version that predates the autodate `created`/`updated` fields.
 */
async function ensureFields(
  pb: PocketBase,
  collectionName: string,
  desired: FieldDef[],
): Promise<void> {
  const col = await pb.collections.getOne(collectionName);
  const have = new Set(col.fields.map((f: { name: string }) => f.name));
  const missing = desired.filter((f) => !have.has(f.name));
  if (missing.length === 0) return;
  await pb.collections.update(col.id, { fields: [...col.fields, ...missing] });
}

/**
 * Idempotently create the four Timy collections (events, time_slots,
 * participants, votes) AND reconcile their fields, so an existing collection
 * that drifted from this schema (missing fields) gets healed too. Shared by the
 * setup-db script and the repo integration test so the schema is defined in
 * exactly one place.
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

  // events — created first so others can reference it.
  const eventFields: FieldDef[] = [
    { name: "title", type: "text", required: true },
    { name: "description", type: "text" },
    { name: "creator_name", type: "text" },
    { name: "expiry", type: "date" },
    ...AUTODATE,
  ];
  if (!names.has("events")) {
    await pb.collections.create({ name: "events", type: "base", ...openRules, fields: eventFields });
  }
  const events = await pb.collections.getOne("events");

  // time_slots — references events.
  const timeSlotFields: FieldDef[] = [
    { name: "event_id", type: "relation", required: true, maxSelect: 1, collectionId: events.id, cascadeDelete: true },
    { name: "start", type: "date", required: true },
    { name: "end", type: "date", required: true },
    ...AUTODATE,
  ];
  if (!names.has("time_slots")) {
    await pb.collections.create({ name: "time_slots", type: "base", ...openRules, fields: timeSlotFields });
  }
  const timeSlots = await pb.collections.getOne("time_slots");

  // events.resolved_slot references time_slots, so add it once time_slots exists.
  await ensureFields(pb, "events", [
    ...eventFields,
    { name: "resolved_slot", type: "relation", maxSelect: 1, collectionId: timeSlots.id, required: false },
  ]);
  await ensureFields(pb, "time_slots", timeSlotFields);

  // participants — references events.
  const participantFields: FieldDef[] = [
    { name: "event_id", type: "relation", required: true, maxSelect: 1, collectionId: events.id, cascadeDelete: true },
    { name: "name", type: "text", required: true },
    ...AUTODATE,
  ];
  if (!names.has("participants")) {
    await pb.collections.create({ name: "participants", type: "base", ...openRules, fields: participantFields });
  }
  await ensureFields(pb, "participants", participantFields);
  const participants = await pb.collections.getOne("participants");

  // votes — references participants and time_slots.
  const voteFields: FieldDef[] = [
    { name: "participant_id", type: "relation", required: true, maxSelect: 1, collectionId: participants.id, cascadeDelete: true },
    { name: "slot_id", type: "relation", required: true, maxSelect: 1, collectionId: timeSlots.id, cascadeDelete: true },
    { name: "available", type: "bool" },
    ...AUTODATE,
  ];
  if (!names.has("votes")) {
    await pb.collections.create({ name: "votes", type: "base", ...openRules, fields: voteFields });
  }
  await ensureFields(pb, "votes", voteFields);
}

/** Enable the batch API, required for the repo's batched writes. */
export async function ensureBatchEnabled(pb: PocketBase): Promise<void> {
  await pb.settings.update({
    batch: { enabled: true, maxRequests: 200, timeout: 30, maxBodySize: 0 },
  });
}

/**
 * Apply the tightened (superuser-only list/create/update/delete) access rules
 * from access-rules.ts. The admin client bypasses rules, so the app is
 * unaffected; the browser never reads PocketBase directly.
 */
export async function applyAccessRules(pb: PocketBase): Promise<void> {
  for (const [name, rules] of Object.entries(TARGET_RULES)) {
    const col = await pb.collections.getOne(name);
    await pb.collections.update(col.id, rules);
  }
}
