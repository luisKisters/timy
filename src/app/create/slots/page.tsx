"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { SlotPicker, type TimeSlot } from "@/components/slot-picker";
import { AIInputBar } from "@/components/ai-input-bar";
import { Button } from "@/components/ui/button";
import { createEvent } from "@/app/create/actions";

function SlotsContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Untitled Event";
  const description = searchParams.get("description") || "";
  const expiry = searchParams.get("expiry") || "3d";
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleAddSlot(slot: TimeSlot) {
    setSlots((prev) => {
      if (prev.some((s) => s.id === slot.id)) return prev;
      return [...prev, slot];
    });
  }

  function handleRemove(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function handleCreate() {
    startTransition(async () => {
      await createEvent({
        title,
        description,
        expiry,
        slots: slots.map((s) => ({
          date: s.date.toISOString().split("T")[0],
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    });
  }

  return (
    <main className="min-h-[100svh] p-6 pb-24">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">Add time slots for participants to vote on</p>
        </div>

        <SlotPicker slots={slots} onAddSlot={handleAddSlot} onRemove={handleRemove} />

        <Button
          className="w-full"
          size="lg"
          disabled={slots.length === 0 || isPending}
          onClick={handleCreate}
          data-loading={isPending || undefined}
        >
          {isPending ? "Creating..." : `Create Event · ${slots.length} slot${slots.length !== 1 ? "s" : ""}`}
          {!isPending && slots.length > 0 && <span className="ml-2 text-xs opacity-40">⌘↵</span>}
        </Button>
      </div>

      <AIInputBar placeholder="Describe times, e.g. 'weekday lunches next week'" />
    </main>
  );
}

export default function SlotsPage() {
  return (
    <Suspense>
      <SlotsContent />
    </Suspense>
  );
}
