"use client";

import { useEffect, useState, useTransition } from "react";
import { getIsCreator } from "@/lib/creator";
import { Button } from "@/components/ui/button";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import { AIResultsSuggestion } from "@/components/ai-results-suggestion";
import { confirmSlot, unconfirmSlot } from "./actions";
import type { SlotScore } from "@/lib/resolve";

interface TopSlot {
  slotId: string;
  start: string;
  end: string;
  availableCount: number;
  totalCount: number;
  percentage: number;
  isBest: boolean;
}

interface ResolvedSlotInfo {
  slotId: string;
  start: string;
  end: string;
  availableParticipants: string[];
}

interface ConfirmSectionProps {
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
  resolved: ResolvedSlotInfo | null;
  topSlots: TopSlot[];
  ranked: SlotScore[];
  participantNames: string[];
}

export function ConfirmSection({
  eventId,
  eventTitle,
  eventDescription,
  resolved,
  topSlots,
  ranked,
  participantNames,
}: ConfirmSectionProps) {
  const [isCreator, setIsCreator] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsCreator(getIsCreator(eventId));
  }, [eventId]);

  // ── Confirmed slot ──────────────────────────────────────────────────────────
  if (resolved) {
    const start = new Date(resolved.start);
    const end = new Date(resolved.end);

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wider text-primary/60">Confirmed</p>
              <p className="font-semibold text-lg leading-snug">
                {start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}{" "}
                {start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                &ndash;
                {end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </p>
            </div>
            {isCreator && (
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-muted-foreground text-xs"
                disabled={isPending}
                onClick={() => startTransition(async () => { await unconfirmSlot(eventId); })}
              >
                Unconfirm
              </Button>
            )}
          </div>

          {resolved.availableParticipants.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Available</p>
              <div className="flex flex-wrap gap-1.5">
                {resolved.availableParticipants.map((name) => (
                  <span key={name} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <AddToCalendarButton
          title={eventTitle}
          description={eventDescription}
          start={resolved.start}
          end={resolved.end}
        />
      </div>
    );
  }

  // ── Unconfirmed: show top slots + AI suggestion ─────────────────────────────
  if (topSlots.length === 0) return null;

  return (
    <div className="space-y-4">
      <AIResultsSuggestion
        ranked={ranked}
        eventTitle={eventTitle}
        participantNames={participantNames}
      />

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          {topSlots.length === 1 ? "Best slot" : "Top slots"}
          {isCreator ? " — tap to confirm" : ""}
        </p>
        <div className="space-y-2">
          {topSlots.map((r) => {
            const start = new Date(r.start);
            const end = new Date(r.end);
            return (
              <div
                key={r.slotId}
                className="flex items-center justify-between rounded-xl border p-4 gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.isBest && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">Best</span>
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
                {isCreator && (
                  <Button
                    size="sm"
                    className="shrink-0"
                    disabled={isPending}
                    onClick={() => startTransition(async () => { await confirmSlot(eventId, r.slotId); })}
                  >
                    Confirm
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
