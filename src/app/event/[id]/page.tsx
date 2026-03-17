import { getPocketBaseAdmin } from "@/lib/pb-admin";
import type { Event, TimeSlot } from "@/types";
import { EventPageClient } from "./client";

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { id } = await params;
  const { created } = await searchParams;
  const pb = getPocketBaseAdmin();

  const event = await pb.collection("events").getOne<Event>(id);
  const slots = await pb.collection("time_slots").getFullList<TimeSlot>({
    filter: `event_id = '${id}'`,
  });

  return (
    <EventPageClient
      event={JSON.parse(JSON.stringify(event))}
      slots={JSON.parse(JSON.stringify(slots))}
      isCreator={created === "true"}
    />
  );
}
