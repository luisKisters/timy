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

function formatDayHeading(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function AvailabilityGrid({ slots, selected, onToggle }: AvailabilityGridProps) {
  // Group by date
  const groups = new Map<string, SlotDisplay[]>();
  for (const slot of slots) {
    if (!groups.has(slot.date)) groups.set(slot.date, []);
    groups.get(slot.date)!.push(slot);
  }
  const sortedDates = [...groups.keys()].sort();

  if (sortedDates.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">No time slots yet.</p>;
  }

  return (
    <div className="space-y-5">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{formatDayHeading(date)}</p>
          <div className="flex flex-wrap gap-2">
            {groups.get(date)!.map((slot) => {
              const isSelected = selected.has(slot.id);
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onToggle(slot.id)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {slot.startTime}–{slot.endTime}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
