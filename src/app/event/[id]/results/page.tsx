import Link from "next/link";
import { getPocketBaseAdmin } from "@/lib/pb-admin";
import { rankSlots } from "@/lib/resolve";
import { ResultsMatrix } from "@/components/results-matrix";
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

  // Top 3 slots to show in the suggestion section
  const topSlots = ranked.slice(0, 3).filter((r) => r.availableCount > 0);

  const rankedSlots = ranked.map((r) => r.slot);

  return (
    <main className="min-h-[100svh] p-6 pb-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{event.title} — Results</h1>
          <p className="text-sm text-muted-foreground">
            {participants.length} participant{participants.length !== 1 ? "s" : ""} voted
          </p>
        </div>

        {/* Matrix */}
        <ResultsMatrix
          slots={rankedSlots}
          participants={JSON.parse(JSON.stringify(participants))}
          votes={JSON.parse(JSON.stringify(votes))}
          bestSlotIds={bestSlotIds}
          resolvedSlotId={event.resolved_slot}
        />

        {/* Confirmed time */}
        {event.resolved_slot && (() => {
          const resolved = slots.find((s) => s.id === event.resolved_slot);
          if (!resolved) return null;
          const start = new Date(resolved.start);
          const end = new Date(resolved.end);
          return (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-primary/60 mb-1">Confirmed</p>
              <p className="font-semibold text-lg">
                {start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}{" "}
                {start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                &ndash;
                {end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </p>
            </div>
          );
        })()}

        {/* Top slots to confirm */}
        {!event.resolved_slot && topSlots.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {topSlots.length === 1 ? "Best slot" : "Top slots"} — tap to confirm
            </p>
            <div className="space-y-2">
              {topSlots.map((r, i) => {
                const start = new Date(r.slot.start);
                const end = new Date(r.slot.end);
                const isBest = i === 0;
                return (
                  <div
                    key={r.slot.id}
                    className="flex items-center justify-between rounded-xl border p-4 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {isBest && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Best</span>
                        )}
                        <p className="font-medium">
                          {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                          {start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                          –{end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {r.availableCount}/{r.totalCount} available ({r.percentage}%)
                      </p>
                    </div>
                    <ConfirmButton eventId={id} slotId={r.slot.id} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button variant="secondary" className="w-full" render={<Link href={`/event/${id}`} />}>
          ← Back to Event
          <span className="ml-2 text-xs opacity-40">⎋</span>
        </Button>
      </div>
    </main>
  );
}
