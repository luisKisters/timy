"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { SlotPicker, type TimeSlot } from "@/components/slot-picker";
import { AIInputBar } from "@/components/ai-input-bar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="flex min-h-screen items-center justify-center p-4 pb-24">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add time slots for participants to vote on
            </p>
          </CardHeader>
        </Card>

        <SlotPicker slots={slots} onAddSlot={handleAddSlot} onRemove={handleRemove} />

        <Button
          className="w-full"
          size="lg"
          disabled={slots.length === 0 || isPending}
          onClick={handleCreate}
          data-loading={isPending || undefined}
        >
          {isPending ? "Creating..." : `Create Event · ${slots.length} slot${slots.length !== 1 ? "s" : ""}`}
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
