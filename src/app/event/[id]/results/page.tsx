import React from "react";
import Link from "next/link";
import { getPocketBaseAdmin } from "@/lib/pb-admin";
import { rankSlots } from "@/lib/resolve";
import { ResultsMatrix } from "@/components/results-matrix";
import { Button } from "@/components/ui/button";
import { ConfirmSection } from "./confirm-section";
import { ResultsRefresher } from "./results-refresher";
import type { Event, TimeSlot, Participant, Vote } from "@/types";

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;
  const pb = getPocketBaseAdmin();

  const event = await pb.collection("events").getOne<Event>(id);
  const slots = await pb.collection("time_slots").getFullList<TimeSlot>({ filter: `event_id = '${id}'` });
  const participants = await pb.collection("participants").getFullList<Participant>({ filter: `event_id = '${id}'` });

  let votes: Vote[] = [];
  if (participants.length > 0) {
    const filter = participants.map((p) => `participant_id = '${p.id}'`).join(" || ");
    votes = await pb.collection("votes").getFullList<Vote>({ filter });
  }

  const ranked = rankSlots(slots, participants, votes);
  const bestScore = ranked[0]?.availableCount ?? 0;
  const bestSlotIds = ranked
    .filter((r) => r.availableCount === bestScore && bestScore > 0)
    .map((r) => r.slot.id);

  const topSlots = ranked.slice(0, 3).filter((r) => r.availableCount > 0).map((r, i) => ({
    slotId: r.slot.id,
    start: r.slot.start,
    end: r.slot.end,
    availableCount: r.availableCount,
    totalCount: r.totalCount,
    percentage: r.percentage,
    isBest: i === 0,
  }));

  const rankedSlots = ranked.map((r) => r.slot);

  // Resolved slot info with available participants
  let resolved = null;
  if (event.resolved_slot) {
    const resolvedSlot = slots.find((s) => s.id === event.resolved_slot);
    if (resolvedSlot) {
      const availableParticipants = votes
        .filter((v) => v.slot_id === event.resolved_slot && v.available)
        .map((v) => participants.find((p) => p.id === v.participant_id)?.name)
        .filter(Boolean) as string[];

      resolved = {
        slotId: resolvedSlot.id,
        start: resolvedSlot.start,
        end: resolvedSlot.end,
        availableParticipants,
      };
    }
  }

  return (
    <main className="flex flex-col overflow-hidden" style={{ height: "100dvh", touchAction: "none" } as React.CSSProperties}>
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{event.title} — Results</h1>
              <p className="text-sm text-muted-foreground">
                {participants.length} participant{participants.length !== 1 ? "s" : ""} voted
              </p>
            </div>
            {!event.resolved_slot && <ResultsRefresher />}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ touchAction: "pan-y" }}
        data-scrollable="true"
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-3 space-y-4 pb-6">
          <ResultsMatrix
            slots={rankedSlots}
            participants={JSON.parse(JSON.stringify(participants))}
            votes={JSON.parse(JSON.stringify(votes))}
            bestSlotIds={bestSlotIds}
            resolvedSlotId={event.resolved_slot}
          />

          <ConfirmSection
            eventId={id}
            eventTitle={event.title}
            eventDescription={event.description ?? undefined}
            resolved={resolved}
            topSlots={topSlots}
            ranked={ranked}
            participantNames={participants.map((p) => p.name)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 sm:px-6 pt-2 pb-6">
        <div className="mx-auto max-w-2xl">
          <Button variant="secondary" className="w-full" render={<Link href={`/event/${id}`} />}>
            ← Edit Availability
          </Button>
        </div>
      </div>
    </main>
  );
}
