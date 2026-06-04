import type PocketBase from "pocketbase";
import { getPocketBaseAdmin } from "@/lib/pb-admin";
import type { Event, Participant, TimeSlot, Vote } from "@/types";

/**
 * Create many records in a single batch request (one round-trip — kills N+1),
 * falling back to parallel individual creates when the server has the batch API
 * disabled (403) or missing (404). Either way, no sequential waterfall.
 */
export async function createMany(
  pb: PocketBase,
  collection: string,
  records: Record<string, unknown>[],
): Promise<string[]> {
  if (records.length === 0) return [];
  try {
    const batch = pb.createBatch();
    for (const record of records) batch.collection(collection).create(record);
    const results = await batch.send();
    return results.map((r) => r.body.id as string);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 403 || status === 404) {
      const created = await Promise.all(
        records.map((record) => pb.collection(collection).create(record)),
      );
      return created.map((c) => c.id);
    }
    throw err;
  }
}

export interface NewSlot {
  start: string;
  end: string;
}

export interface CreateEventWithSlotsInput {
  title: string;
  description?: string;
  creatorName?: string;
  /** ISO instant or null ("Never"). */
  expiry: string | null;
  slots: NewSlot[];
}

/**
 * Create an event and all of its time slots. Slots are written in a single
 * batch request (one round-trip) instead of an N+1 loop.
 */
export async function createEventWithSlots(
  input: CreateEventWithSlotsInput,
): Promise<{ eventId: string; slotIds: string[] }> {
  const pb = await getPocketBaseAdmin();

  const event = await pb.collection("events").create({
    title: input.title,
    description: input.description ?? "",
    creator_name: input.creatorName ?? "",
    expiry: input.expiry,
  });

  const slotIds = await createMany(
    pb,
    "time_slots",
    input.slots.map((slot) => ({
      event_id: event.id,
      start: slot.start,
      end: slot.end,
    })),
  );

  return { eventId: event.id, slotIds };
}

export interface EventBundle {
  event: Event;
  slots: TimeSlot[];
  participants: Participant[];
  votes: Vote[];
}

/** Fetch everything needed to render an event (4 parallel queries, no N+1). */
export async function getEventBundle(eventId: string): Promise<EventBundle> {
  const pb = await getPocketBaseAdmin();
  const [event, slots, participants, votes] = await Promise.all([
    pb.collection("events").getOne<Event>(eventId),
    pb.collection("time_slots").getFullList<TimeSlot>({
      filter: pb.filter("event_id = {:id}", { id: eventId }),
      sort: "start",
    }),
    pb.collection("participants").getFullList<Participant>({
      filter: pb.filter("event_id = {:id}", { id: eventId }),
      sort: "created",
    }),
    pb.collection("votes").getFullList<Vote>({
      // indirect relation filter: votes → participant → event
      filter: pb.filter("participant_id.event_id = {:id}", { id: eventId }),
    }),
  ]);
  return { event, slots, participants, votes };
}

export interface CreateParticipantWithVotesInput {
  eventId: string;
  name: string;
  /** Slot ids the participant marked available. */
  availableSlotIds: string[];
  /** All slot ids to record an explicit vote for (defaults to availableSlotIds). */
  allSlotIds?: string[];
}

/** Create a participant and their votes (votes written in one batch). */
export async function createParticipantWithVotes(
  input: CreateParticipantWithVotesInput,
): Promise<{ participantId: string; voteIds: string[] }> {
  const pb = await getPocketBaseAdmin();

  const participant = await pb
    .collection("participants")
    .create({ event_id: input.eventId, name: input.name });

  const available = new Set(input.availableSlotIds);
  const slotIds = input.allSlotIds ?? input.availableSlotIds;

  const voteIds = await createMany(
    pb,
    "votes",
    slotIds.map((slotId) => ({
      participant_id: participant.id,
      slot_id: slotId,
      available: available.has(slotId),
    })),
  );

  return { participantId: participant.id, voteIds };
}

/** Set (or clear) the confirmed slot on an event. */
export async function setResolvedSlot(
  eventId: string,
  slotId: string | null,
): Promise<Event> {
  const pb = await getPocketBaseAdmin();
  return pb.collection("events").update<Event>(eventId, {
    resolved_slot: slotId,
  });
}
