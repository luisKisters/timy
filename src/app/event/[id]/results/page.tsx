import Link from "next/link";
import { getPocketBaseAdmin } from "@/lib/pb-admin";
import { rankSlots } from "@/lib/resolve";
import { ResultsMatrix } from "@/components/results-matrix";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "./confirm-button";
import type { Event, TimeSlot, Participant, Vote } from "@/types";

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;
  const pb = getPocketBaseAdmin();

  const event = await pb.collection("events").getOne<Event>(id);
  const slots = await pb.collection("time_slots").getFullList<TimeSlot>({
    filter: `event_id = '${id}'`,
  });
  const participants = await pb.collection("participants").getFullList<Participant>({
    filter: `event_id = '${id}'`,
  });

  // Get all votes for these participants
  const participantIds = participants.map((p) => p.id);
  let votes: Vote[] = [];
  if (participantIds.length > 0) {
    const filter = participantIds.map((pid) => `participant_id = '${pid}'`).join(" || ");
    votes = await pb.collection("votes").getFullList<Vote>({ filter });
  }

  const ranked = rankSlots(slots, participants, votes);
  const bestScore = ranked[0]?.availableCount ?? 0;
  const bestSlotIds = ranked
    .filter((r) => r.availableCount === bestScore && bestScore > 0)
    .map((r) => r.slot.id);

  // Sort slots by rank for display
  const rankedSlots = ranked.map((r) => r.slot);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{event.title} &mdash; Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              {participants.length} participant{participants.length !== 1 ? "s" : ""} voted
            </p>
          </CardHeader>
          <CardContent>
            <ResultsMatrix
              slots={rankedSlots}
              participants={JSON.parse(JSON.stringify(participants))}
              votes={JSON.parse(JSON.stringify(votes))}
              bestSlotIds={bestSlotIds}
              resolvedSlotId={event.resolved_slot}
            />
          </CardContent>
        </Card>

        {!event.resolved_slot && bestSlotIds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Best Slot{bestSlotIds.length > 1 ? "s" : ""}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bestSlotIds.map((slotId) => {
                const slot = slots.find((s) => s.id === slotId);
                if (!slot) return null;
                const start = new Date(slot.start);
                const end = new Date(slot.end);
                return (
                  <div key={slotId} className="flex items-center justify-between rounded-lg border p-3">
                    <p className="text-sm font-medium">
                      {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                      {start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      &ndash;
                      {end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </p>
                    <ConfirmButton eventId={id} slotId={slotId} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {event.resolved_slot && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Confirmed Time</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const resolved = slots.find((s) => s.id === event.resolved_slot);
                if (!resolved) return <p>Slot not found</p>;
                const start = new Date(resolved.start);
                const end = new Date(resolved.end);
                return (
                  <p className="font-medium">
                    {start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}{" "}
                    {start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    &ndash;
                    {end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </p>
                );
              })()}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" render={<Link href={`/event/${id}`} />}>
            Back to Event
          </Button>
        </div>
      </div>
    </main>
  );
}
