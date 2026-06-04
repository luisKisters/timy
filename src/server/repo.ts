import { getPocketBaseAdmin } from "@/lib/pb-admin";
import type { Event, Participant, TimeSlot, Vote } from "@/types";

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
  const pb = getPocketBaseAdmin();

  const event = await pb.collection("events").create({
    title: input.title,
    description: input.description ?? "",
    creator_name: input.creatorName ?? "",
    expiry: input.expiry,
  });

  const slotIds: string[] = [];
  if (input.slots.length > 0) {
    const batch = pb.createBatch();
    for (const slot of input.slots) {
      batch
        .collection("time_slots")
        .create({ event_id: event.id, start: slot.start, end: slot.end });
    }
    const results = await batch.send();
    for (const r of results) slotIds.push(r.body.id as string);
  }

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
  const pb = getPocketBaseAdmin();
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
  const pb = getPocketBaseAdmin();

  const participant = await pb
    .collection("participants")
    .create({ event_id: input.eventId, name: input.name });

  const available = new Set(input.availableSlotIds);
  const slotIds = input.allSlotIds ?? input.availableSlotIds;

  const voteIds: string[] = [];
  if (slotIds.length > 0) {
    const batch = pb.createBatch();
    for (const slotId of slotIds) {
      batch.collection("votes").create({
        participant_id: participant.id,
        slot_id: slotId,
        available: available.has(slotId),
      });
    }
    const results = await batch.send();
    for (const r of results) voteIds.push(r.body.id as string);
  }

  return { participantId: participant.id, voteIds };
}

/** Set (or clear) the confirmed slot on an event. */
export async function setResolvedSlot(
  eventId: string,
  slotId: string | null,
): Promise<Event> {
  const pb = getPocketBaseAdmin();
  return pb.collection("events").update<Event>(eventId, {
    resolved_slot: slotId,
  });
}
