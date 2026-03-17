import PocketBase from "pocketbase";

const POCKETBASE_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const POCKETBASE_AUTH_TOKEN = process.env.POCKETBASE_AUTH_TOKEN || "";

async function main() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.authStore.save(POCKETBASE_AUTH_TOKEN);

  console.log(`Connected to PocketBase at ${POCKETBASE_URL}`);

  // Check if collections already exist
  const existing = await pb.collections.getFullList();
  const existingNames = new Set(existing.map((c) => c.name));

  // 1. Events collection (without resolved_slot relation — added after time_slots exists)
  if (!existingNames.has("events")) {
    console.log("Creating 'events' collection...");
    const events = await pb.collections.create({
      name: "events",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: null,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "description", type: "text" },
        { name: "creator_name", type: "text" },
        { name: "expiry", type: "date" },
      ],
    });
    console.log(`  Created events (id: ${events.id})`);
  } else {
    console.log("'events' collection already exists, skipping.");
  }

  // Get events collection ID for relations
  const eventsCol = await pb.collections.getOne("events");

  // 2. Time slots collection
  if (!existingNames.has("time_slots")) {
    console.log("Creating 'time_slots' collection...");
    const timeSlots = await pb.collections.create({
      name: "time_slots",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: null,
      fields: [
        { name: "event_id", type: "relation", required: true, maxSelect: 1, collectionId: eventsCol.id, cascadeDelete: true },
        { name: "start", type: "date", required: true },
        { name: "end", type: "date", required: true },
      ],
    });
    console.log(`  Created time_slots (id: ${timeSlots.id})`);
  } else {
    console.log("'time_slots' collection already exists, skipping.");
  }

  // Get time_slots collection ID
  const timeSlotsCol = await pb.collections.getOne("time_slots");

  // Add resolved_slot relation to events now that time_slots exists
  const hasResolvedSlot = eventsCol.fields.some((f: { name: string }) => f.name === "resolved_slot");
  if (!hasResolvedSlot) {
    console.log("Adding resolved_slot relation to events...");
    const updatedFields = [
      ...eventsCol.fields,
      { name: "resolved_slot", type: "relation", maxSelect: 1, collectionId: timeSlotsCol.id, required: false },
    ];
    await pb.collections.update(eventsCol.id, { fields: updatedFields });
    console.log("  Added resolved_slot relation.");
  }

  // 3. Participants collection
  if (!existingNames.has("participants")) {
    console.log("Creating 'participants' collection...");
    const participants = await pb.collections.create({
      name: "participants",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: null,
      fields: [
        { name: "event_id", type: "relation", required: true, maxSelect: 1, collectionId: eventsCol.id, cascadeDelete: true },
        { name: "name", type: "text", required: true },
      ],
    });
    console.log(`  Created participants (id: ${participants.id})`);
  } else {
    console.log("'participants' collection already exists, skipping.");
  }

  // Get participants collection ID
  const participantsCol = await pb.collections.getOne("participants");

  // 4. Votes collection
  if (!existingNames.has("votes")) {
    console.log("Creating 'votes' collection...");
    const votes = await pb.collections.create({
      name: "votes",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: null,
      fields: [
        { name: "participant_id", type: "relation", required: true, maxSelect: 1, collectionId: participantsCol.id, cascadeDelete: true },
        { name: "slot_id", type: "relation", required: true, maxSelect: 1, collectionId: timeSlotsCol.id, cascadeDelete: true },
        { name: "available", type: "bool" },
      ],
    });
    console.log(`  Created votes (id: ${votes.id})`);
  } else {
    console.log("'votes' collection already exists, skipping.");
  }

  console.log("\nAll collections set up successfully!");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
