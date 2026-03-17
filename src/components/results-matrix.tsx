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
  const date = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const endTime = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return { date, time: `${startTime}-${endTime}` };
}

export function ResultsMatrix({
  slots,
  participants,
  votes,
  bestSlotIds,
  resolvedSlotId,
}: ResultsMatrixProps) {
  function isAvailable(participantId: string, slotId: string) {
    return votes.some(
      (v) => v.participant_id === participantId && v.slot_id === slotId && v.available
    );
  }

  function getAvailableCount(slotId: string) {
    return votes.filter((v) => v.slot_id === slotId && v.available).length;
  }

  if (participants.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No participants have voted yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-card p-2 text-left font-medium text-muted-foreground">
              Slot
            </th>
            {participants.map((p) => (
              <th key={p.id} className="p-2 text-center font-medium">
                {p.name}
              </th>
            ))}
            <th className="p-2 text-center font-medium text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const { date, time } = formatSlot(slot);
            const isBest = bestSlotIds.includes(slot.id);
            const isResolved = slot.id === resolvedSlotId;
            const count = getAvailableCount(slot.id);
            return (
              <tr
                key={slot.id}
                className={cn(
                  "border-t",
                  isResolved && "bg-primary/10",
                  isBest && !isResolved && "bg-primary/5"
                )}
              >
                <td className="sticky left-0 bg-card p-2">
                  <div className="flex items-center gap-1">
                    {isResolved && <CheckIcon className="size-3 text-primary" />}
                    <div>
                      <p className="font-medium">{date}</p>
                      <p className="text-xs text-muted-foreground">{time}</p>
                    </div>
                  </div>
                </td>
                {participants.map((p) => {
                  const available = isAvailable(p.id, slot.id);
                  return (
                    <td key={p.id} className="p-2 text-center">
                      {available ? (
                        <CheckIcon className="mx-auto size-4 text-green-500" />
                      ) : (
                        <XIcon className="mx-auto size-4 text-red-400/50" />
                      )}
                    </td>
                  );
                })}
                <td className="p-2 text-center font-medium">
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
