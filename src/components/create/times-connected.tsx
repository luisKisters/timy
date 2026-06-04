"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCreateDraft } from "@/components/create/create-draft-context";
import { TimesScreen } from "@/components/create/times-screen";
import {
  type CalendarConfig,
  decodeSlots,
  encodeConfig,
} from "@/lib/calendar-config";
import type { DraftSlot } from "@/lib/create-draft";

export interface TimesConnectedProps {
  onDone: () => void;
  onBack: () => void;
}

export function TimesConnected({ onDone, onBack }: TimesConnectedProps) {
  const { draft, update } = useCreateDraft();
  const params = useSearchParams();
  const gcalFree = params.get("gcal_free");

  const initialSuggestions = useMemo(
    () => (gcalFree ? decodeSlots(gcalFree) : undefined),
    [gcalFree],
  );

  const addSlots = (incoming: DraftSlot[]) => {
    const seen = new Set(draft.slots.map((s) => s.start));
    const merged = [...draft.slots];
    for (const s of incoming) {
      if (!seen.has(s.start)) {
        merged.push(s);
        seen.add(s.start);
      }
    }
    merged.sort((a, b) => a.start.localeCompare(b.start));
    update({ slots: merged });
  };

  const removeSlot = (start: string) =>
    update({ slots: draft.slots.filter((s) => s.start !== start) });

  // Real app: redirect into the OAuth flow; results return via ?gcal_free.
  const requestCalendarSuggestions = (config: CalendarConfig): Promise<DraftSlot[]> => {
    if (typeof window !== "undefined") {
      window.location.href = `/api/gcal/create?config=${encodeConfig(config)}`;
    }
    return new Promise<DraftSlot[]>(() => {});
  };

  return (
    <TimesScreen
      slots={draft.slots}
      tz={draft.tz}
      slotLengthMin={draft.slotLengthMin}
      onAddSlots={addSlots}
      onRemoveSlot={removeSlot}
      onDone={onDone}
      onBack={onBack}
      requestCalendarSuggestions={requestCalendarSuggestions}
      initialSuggestions={initialSuggestions}
    />
  );
}
