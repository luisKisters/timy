"use client";

import { useState } from "react";
import { CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
}

interface SlotPickerProps {
  slots: TimeSlot[];
  onAddSlot: (slot: TimeSlot) => void;
  onRemove: (id: string) => void;
}

// Use local date parts to avoid UTC-shift bugs in non-UTC timezones
function dayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function SlotPicker({ slots, onAddSlot, onRemove }: SlotPickerProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");

  function handleSelectDates(dates: Date[] | undefined) {
    const next = dates ?? [];
    // Remove slots belonging to deselected days
    const nextKeys = new Set(next.map(dayKey));
    for (const slot of slots) {
      if (!nextKeys.has(dayKey(slot.date))) {
        onRemove(slot.id);
      }
    }
    setSelectedDates(next);
  }

  function openAdd(key: string, slotsForDay: TimeSlot[]) {
    // Default start = last slot's end, or 09:00
    const last = slotsForDay[slotsForDay.length - 1];
    setNewStart(last?.endTime ?? "09:00");
    setNewEnd(bumpHour(last?.endTime ?? "09:00"));
    setAddingFor(key);
  }

  function saveSlot(date: Date) {
    if (!newStart || !newEnd || newStart >= newEnd) return;
    const id = `${dayKey(date)}-${newStart}-${newEnd}-${Date.now()}`;
    onAddSlot({ id, date, startTime: newStart, endTime: newEnd });
    setAddingFor(null);
  }

  // Sort selected dates chronologically
  const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pick Time Slots</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="multiple"
          selected={selectedDates}
          onSelect={handleSelectDates}
          disabled={{ before: new Date() }}
          className="mx-auto"
        />

        {sortedDates.length > 0 && (
          <div className="space-y-3 pt-1">
            {sortedDates.map((date) => {
              const key = dayKey(date);
              const slotsForDay = slots.filter((s) => dayKey(s.date) === key);
              const isAdding = addingFor === key;

              return (
                <div key={key} className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">{formatDayLabel(date)}</p>

                  <div className="flex flex-wrap gap-2">
                    {slotsForDay.map((slot) => (
                      <span
                        key={slot.id}
                        className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-xs font-medium"
                      >
                        {slot.startTime}–{slot.endTime}
                        <button
                          onClick={() => onRemove(slot.id)}
                          className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    ))}

                    {isAdding ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Input
                          type="time"
                          value={newStart}
                          onChange={(e) => setNewStart(e.target.value)}
                          className="h-7 w-28 px-2 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">→</span>
                        <Input
                          type="time"
                          value={newEnd}
                          onChange={(e) => setNewEnd(e.target.value)}
                          className="h-7 w-28 px-2 text-xs"
                        />
                        <Button
                          size="icon-xs"
                          disabled={!newStart || !newEnd || newStart >= newEnd}
                          onClick={() => saveSlot(date)}
                        >
                          <CheckIcon />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => setAddingFor(null)}
                        >
                          <XIcon />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAdd(key, slotsForDay)}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
                      >
                        <PlusIcon className="size-3" />
                        Add time
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function bumpHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const next = Math.min(h + 1, 23);
  return `${String(next).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
