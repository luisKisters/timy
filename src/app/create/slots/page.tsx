"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlotPicker, type TimeSlot } from "@/components/slot-picker";
import { SlotList } from "@/components/slot-list";
import { AIInputBar } from "@/components/ai-input-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SlotsContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Untitled Event";
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  function handleAddSlot(slot: TimeSlot) {
    setSlots((prev) => {
      if (prev.some((s) => s.id === slot.id)) return prev;
      return [...prev, slot];
    });
  }

  function handleRemove(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
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

        <SlotPicker slots={slots} onAddSlot={handleAddSlot} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Slots ({slots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SlotList slots={slots} onRemove={handleRemove} />
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          disabled={slots.length === 0}
          onClick={() => {
            // Will wire to server action in Phase 3
            console.log("Create event with slots:", slots);
          }}
        >
          Create Event
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
