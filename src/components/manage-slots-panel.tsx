"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlotPicker, type TimeSlot } from "@/components/slot-picker";
import { addSlotsToEvent, removeSlot } from "@/app/event/[id]/actions";
import type { TimeSlot as DBTimeSlot } from "@/types";

interface ManageSlotsPanelProps {
  eventId: string;
  slots: DBTimeSlot[];
}

function formatSlot(slot: DBTimeSlot) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const date = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const startTime = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const endTime = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${startTime}–${endTime}`;
}

export function ManageSlotsPanel({ eventId, slots }: ManageSlotsPanelProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newSlots, setNewSlots] = useState<TimeSlot[]>([]);
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleAddSlot(slot: TimeSlot) {
    setNewSlots((prev) => prev.some((s) => s.id === slot.id) ? prev : [...prev, slot]);
  }

  function handleRemoveNew(id: string) {
    setNewSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSaveNew() {
    if (newSlots.length === 0) return;
    startTransition(async () => {
      await addSlotsToEvent(
        eventId,
        newSlots.map((s) => ({
          date: [s.date.getFullYear(), String(s.date.getMonth()+1).padStart(2,"0"), String(s.date.getDate()).padStart(2,"0")].join("-"),
          startTime: s.startTime,
          endTime: s.endTime,
        }))
      );
      setNewSlots([]);
      setAdding(false);
      router.refresh();
    });
  }

  function handleRemove(slotId: string) {
    setRemovingId(slotId);
    startTransition(async () => {
      await removeSlot(slotId, eventId);
      setRemovingId(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-border/60 overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
      >
        <span className="text-sm font-medium">
          Manage slots
          <span className="ml-2 text-xs text-muted-foreground">{slots.length} total</span>
        </span>
        {expanded ? <ChevronUpIcon className="size-4 text-muted-foreground" /> : <ChevronDownIcon className="size-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border/60 p-4 space-y-4">
          {/* Existing slots */}
          <div className="space-y-1.5">
            {slots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{formatSlot(slot)}</span>
                <button
                  onClick={() => handleRemove(slot.id)}
                  disabled={isPending && removingId === slot.id}
                  title="Remove slot"
                  className="ml-3 rounded p-1 text-muted-foreground/50 hover:text-destructive transition-colors disabled:opacity-40"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new slots */}
          {adding ? (
            <div className="space-y-3">
              <SlotPicker slots={newSlots} onAddSlot={handleAddSlot} onRemove={handleRemoveNew} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={newSlots.length === 0 || isPending}
                  onClick={handleSaveNew}
                  data-loading={isPending || undefined}
                  className="flex-1"
                >
                  {isPending ? "Saving..." : `Save ${newSlots.length > 0 ? newSlots.length : ""} new slot${newSlots.length !== 1 ? "s" : ""}`}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewSlots([]); }}>
                  Cancel
                  <span className="ml-1.5 text-xs opacity-40">⎋</span>
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setAdding(true)} className="w-full">
              <PlusIcon className="size-3.5 mr-1.5" />
              Add more slots
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
