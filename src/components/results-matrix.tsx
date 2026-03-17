"use client";

import { cn } from "@/lib/utils";
import type { TimeSlot, Participant, Vote } from "@/types";
import { CheckIcon, XIcon } from "lucide-react";

interface ResultsMatrixProps {
  slots: TimeSlot[];
  participants: Participant[];
  votes: Vote[];
  bestSlotIds: string[];
  resolvedSlotId: string | null;
}

function formatSlot(slot: TimeSlot) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  return {
    date: start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: `${start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}–${end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ResultsMatrix({ slots, participants, votes, bestSlotIds, resolvedSlotId }: ResultsMatrixProps) {
  function isAvailable(participantId: string, slotId: string) {
    return votes.some((v) => v.participant_id === participantId && v.slot_id === slotId && v.available);
  }
  function getCount(slotId: string) {
    return votes.filter((v) => v.slot_id === slotId && v.available).length;
  }

  if (participants.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No participants have voted yet.</p>;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-background pb-3 pr-3 text-left font-medium text-muted-foreground min-w-[7rem]">
              Slot
            </th>
            {participants.map((p) => (
              <th key={p.id} className="pb-3 px-1 text-center font-medium min-w-[2.5rem]" title={p.name}>
                <div className="mx-auto flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {initials(p.name)}
                </div>
              </th>
            ))}
            <th className="pb-3 pl-3 text-center font-medium text-muted-foreground min-w-[3rem]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const { date, time } = formatSlot(slot);
            const isBest = bestSlotIds.includes(slot.id);
            const isResolved = slot.id === resolvedSlotId;
            const count = getCount(slot.id);
            return (
              <tr
                key={slot.id}
                className={cn(
                  "border-t transition-colors",
                  isResolved && "bg-primary/10",
                  isBest && !isResolved && "bg-primary/5"
                )}
              >
                <td className="sticky left-0 z-10 bg-inherit py-2.5 pr-3">
                  <div className="flex items-center gap-1.5">
                    {isResolved && <CheckIcon className="size-3 shrink-0 text-primary" />}
                    <div>
                      <p className="font-medium leading-tight">{date}</p>
                      <p className="text-xs text-muted-foreground">{time}</p>
                    </div>
                  </div>
                </td>
                {participants.map((p) => {
                  const available = isAvailable(p.id, slot.id);
                  return (
                    <td key={p.id} className="py-2.5 px-1 text-center">
                      {available
                        ? <CheckIcon className="mx-auto size-4 text-green-500" />
                        : <XIcon className="mx-auto size-4 text-red-400/40" />}
                    </td>
                  );
                })}
                <td className="py-2.5 pl-3 text-center font-semibold tabular-nums">
                  {count}/{participants.length}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
