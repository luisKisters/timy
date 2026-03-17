"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { SlotPicker, type TimeSlot } from "@/components/slot-picker";
import { AIInputBar } from "@/components/ai-input-bar";
import { Button } from "@/components/ui/button";
import { createEvent } from "@/app/create/actions";
import { suggestSlots, transcribeAndSuggestSlots } from "@/lib/ai-client";
import { getOrMigrateAIConfig } from "@/lib/ai-config";

function localDateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
}

function SlotsContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Untitled Event";
  const description = searchParams.get("description") || "";
  const expiry = searchParams.get("expiry") || "3d";
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isPending, startTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  function handleAddSlot(slot: TimeSlot) {
    setSlots((prev) => prev.some((s) => s.id === slot.id) ? prev : [...prev, slot]);
  }

  function handleRemove(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function handleCreate() {
    startTransition(async () => {
      await createEvent({
        title, description, expiry,
        slots: slots.map((s) => ({
          date: localDateKey(s.date),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    });
  }

  async function addSuggestedSlots(suggested: { date: string; startTime: string; endTime: string }[]) {
    for (const s of suggested) {
      const date = new Date(`${s.date}T00:00:00`);
      const id = `${s.date}-${s.startTime}-${s.endTime}-${Date.now()}-${Math.random()}`;
      handleAddSlot({ id, date, startTime: s.startTime, endTime: s.endTime });
    }
  }

  async function handleAISend(message: string) {
    if (!getOrMigrateAIConfig()) {
      setAiError("Set your AI API key first (🔑 button)");
      setTimeout(() => setAiError(null), 4000);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const suggested = await suggestSlots(message);
      await addSuggestedSlots(suggested);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI request failed");
      setTimeout(() => setAiError(null), 5000);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAIAudio(blob: Blob) {
    if (!getOrMigrateAIConfig()) {
      setAiError("Set your AI API key first (🔑 button)");
      setTimeout(() => setAiError(null), 4000);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const suggested = await transcribeAndSuggestSlots(blob);
      await addSuggestedSlots(suggested);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI request failed");
      setTimeout(() => setAiError(null), 5000);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <main className="min-h-[100svh] p-6 pb-24">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">Add time slots for participants to vote on</p>
        </div>

        <div className="rounded-xl border p-4">
          <SlotPicker slots={slots} onAddSlot={handleAddSlot} onRemove={handleRemove} />
        </div>

        {aiError && (
          <p className="text-sm text-destructive">{aiError}</p>
        )}

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

      <AIInputBar
        placeholder="e.g. 'Wednesday and Thursday lunches next week'"
        onSend={handleAISend}
        onAudio={handleAIAudio}
        loading={aiLoading}
      />
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
