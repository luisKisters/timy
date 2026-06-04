import { getEventBundle } from "@/server/repo";
import { VoteRoute } from "@/components/event/vote-route";
import { pbToISO } from "@/lib/domain";

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gcal_available?: string }>;
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { id } = await params;
  const { gcal_available } = await searchParams;

  const bundle = await getEventBundle(id);
  const autoTickedIds = gcal_available
    ? gcal_available.split(",").filter(Boolean)
    : [];

  return (
    <VoteRoute
      eventId={id}
      title={bundle.event.title}
      hostName={bundle.event.creator_name || undefined}
      slots={bundle.slots.map((s) => ({
        id: s.id,
        start: pbToISO(s.start),
        end: pbToISO(s.end),
      }))}
      participantNames={bundle.participants.map((p) => p.name)}
      autoTickedIds={autoTickedIds}
    />
  );
}
