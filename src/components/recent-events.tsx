"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClockIcon } from "lucide-react";
import { getRecentEvents, type RecentEvent } from "@/lib/recent-events";

export function RecentEvents() {
  const [events, setEvents] = useState<RecentEvent[]>([]);

  useEffect(() => {
    setEvents(getRecentEvents());
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
        <ClockIcon className="size-3" /> Recent
      </p>
      <div className="space-y-1">
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/event/${e.id}`}
            className="block rounded-lg border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:border-border hover:text-foreground transition-colors"
          >
            {e.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
