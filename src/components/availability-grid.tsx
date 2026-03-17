"use client";

import { cn } from "@/lib/utils";

export interface SlotDisplay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface AvailabilityGridProps {
  slots: SlotDisplay[];
  selected: Set<string>;
  onToggle: (slotId: string) => void;
}

function formatSlotDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function AvailabilityGrid({ slots, selected, onToggle }: AvailabilityGridProps) {
  return (
    <div className="grid gap-2">
      {slots.map((slot) => {
        const isSelected = selected.has(slot.id);
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onToggle(slot.id)}
            className={cn(
              "flex items-center justify-between rounded-lg border p-3 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-accent"
            )}
          >
            <div>
              <p className="text-sm font-medium">{formatSlotDate(slot.date)}</p>
              <p className="text-xs text-muted-foreground">
                {slot.startTime} &ndash; {slot.endTime}
              </p>
            </div>
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
