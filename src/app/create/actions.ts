"use server";

import { redirect } from "next/navigation";
import { getPocketBaseAdmin } from "@/lib/pb-admin";
import type { CreateEventInput } from "@/types";

function computeExpiry(expiry: string): string | null {
  if (expiry === "never") return null;
  const now = new Date();
  switch (expiry) {
    case "1d":
      now.setDate(now.getDate() + 1);
      break;
    case "3d":
      now.setDate(now.getDate() + 3);
      break;
    case "1w":
      now.setDate(now.getDate() + 7);
      break;
    default:
      return null;
  }
  return now.toISOString();
}

export async function createEvent(input: CreateEventInput) {
  const pb = getPocketBaseAdmin();

  // Create the event
  const event = await pb.collection("events").create({
    title: input.title,
    description: input.description,
    expiry: computeExpiry(input.expiry),
  });

  // Create time slots
  for (const slot of input.slots) {
    const startDate = new Date(`${slot.date}T${slot.startTime}:00`);
    const endDate = new Date(`${slot.date}T${slot.endTime}:00`);

    await pb.collection("time_slots").create({
      event_id: event.id,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
  }

  redirect(`/event/${event.id}?created=true`);
}
