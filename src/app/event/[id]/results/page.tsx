import { getEventBundle } from "@/server/repo";
import { ResultsConnected } from "@/components/event/results-connected";
import { confirmSlot } from "@/app/event/[id]/results/actions";
import { pbToISO } from "@/lib/domain";

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;
  const bundle = await getEventBundle(id);

  return (
    <ResultsConnected
      eventId={id}
      title={bundle.event.title}
      slots={bundle.slots.map((s) => ({
        id: s.id,
        start: pbToISO(s.start),
        end: pbToISO(s.end),
      }))}
      participants={bundle.participants.map((p) => ({ id: p.id, name: p.name }))}
      votes={bundle.votes.map((v) => ({
        participantId: v.participant_id,
        slotId: v.slot_id,
        available: !!v.available,
      }))}
      initialResolvedSlotId={bundle.event.resolved_slot || null}
      confirmSlot={confirmSlot}
    />
  );
}
