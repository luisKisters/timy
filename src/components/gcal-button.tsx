"use client";

import { Button } from "@/components/ui/button";
import type { TimeSlot } from "@/types";

interface GcalButtonProps {
  eventId: string;
  slots: TimeSlot[];
}

export function GcalButton({ eventId, slots }: GcalButtonProps) {
  function handleClick() {
    const slotRefs = slots.map((s) => ({ id: s.id, start: s.start, end: s.end }));
    const params = new URLSearchParams({
      eventId,
      slots: JSON.stringify(slotRefs),
    });
    window.location.href = `/api/gcal?${params}`;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      title="Check Google Calendar availability"
      className="gap-1.5 text-xs"
    >
      <GoogleCalendarIcon />
      Check Calendar
    </Button>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7" y="13" width="4" height="4" rx="0.5" fill="currentColor" />
    </svg>
  );
}
