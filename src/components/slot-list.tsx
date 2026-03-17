"use client";

import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TimeSlot } from "@/components/slot-picker";

interface SlotListProps {
  slots: TimeSlot[];
  onRemove: (id: string) => void;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function SlotList({ slots, onRemove }: SlotListProps) {
  if (slots.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No slots added yet. Pick dates and times above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="flex items-center justify-between rounded-lg border bg-card p-3"
        >
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{formatDate(slot.date)}</Badge>
            <span className="text-sm">
              {slot.startTime} &ndash; {slot.endTime}
            </span>
          </div>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => onRemove(slot.id)}
          >
            <XIcon />
          </Button>
        </div>
      ))}
    </div>
  );
}
