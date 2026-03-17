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

function formatSlotHeader(slot: TimeSlot) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const date = start.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
  const time = `${start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}–${end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  return { date, time };
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
    <div className="-mx-4 px-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-background pb-3 pr-3 text-left font-medium text-muted-foreground min-w-[8rem]">
              Name
            </th>
            {slots.map((slot) => {
              const { date, time } = formatSlotHeader(slot);
              const isBest = bestSlotIds.includes(slot.id);
              const isResolved = slot.id === resolvedSlotId;
              return (
                <th
                  key={slot.id}
                  className={cn(
                    "pb-3 px-2 text-center font-medium min-w-[6rem]",
                    isResolved && "bg-primary/10",
                    isBest && !isResolved && "bg-primary/5"
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    {isResolved && <CheckIcon className="size-3 text-primary" />}
                    <span className="text-xs font-semibold">{date}</span>
                    <span className="text-xs text-muted-foreground font-normal">{time}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="sticky left-0 z-10 bg-background py-2.5 pr-3">
                <span className="max-w-[8rem] truncate block font-medium">{p.name}</span>
              </td>
              {slots.map((slot) => {
                const available = isAvailable(p.id, slot.id);
                const isResolved = slot.id === resolvedSlotId;
                const isBest = bestSlotIds.includes(slot.id);
                return (
                  <td
                    key={slot.id}
                    className={cn(
                      "py-2.5 px-2 text-center",
                      isResolved && "bg-primary/10",
                      isBest && !isResolved && "bg-primary/5"
                    )}
                  >
                    {available
                      ? <CheckIcon className="mx-auto size-4 text-green-500" />
                      : <XIcon className="mx-auto size-4 text-red-400/40" />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t">
            <td className="sticky left-0 z-10 bg-background py-2.5 pr-3 font-semibold text-muted-foreground">
              Total
            </td>
            {slots.map((slot) => {
              const count = getCount(slot.id);
              const isResolved = slot.id === resolvedSlotId;
              const isBest = bestSlotIds.includes(slot.id);
              return (
                <td
                  key={slot.id}
                  className={cn(
                    "py-2.5 px-2 text-center font-semibold tabular-nums",
                    isResolved && "bg-primary/10",
                    isBest && !isResolved && "bg-primary/5"
                  )}
                >
                  {count}/{participants.length}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
