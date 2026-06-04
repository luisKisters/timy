"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCreateDraft } from "@/components/create/create-draft-context";
import { TimesScreen } from "@/components/create/times-screen";
import { saveRecentEvent } from "@/lib/recent-events";
import { saveCreator } from "@/lib/creator";
import {
  type CalendarConfig,
  decodeSlots,
  encodeConfig,
} from "@/lib/calendar-config";
import type { DraftSlot } from "@/lib/create-draft";
import type { ExpiryOption } from "@/lib/domain/expiry";

export interface TimesConnectedProps {
  createEvent: (input: {
    title: string;
    hostName: string;
    expiry: ExpiryOption;
    slots: DraftSlot[];
  }) => Promise<{ eventId: string }>;
  /** Called with the new event id once the poll is created (routes to Share). */
  onCreated: (eventId: string) => void;
  onBack: () => void;
}

export function TimesConnected({ createEvent, onCreated, onBack }: TimesConnectedProps) {
  const { draft, update, reset } = useCreateDraft();
  const params = useSearchParams();
  const gcalFree = params.get("gcal_free");
  const [confirming, setConfirming] = useState(false);

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

  const onConfirm = async () => {
    if (confirming || draft.slots.length === 0) return;
    setConfirming(true);
    try {
      const { eventId } = await createEvent({
        title: draft.title,
        hostName: draft.hostName,
        expiry: draft.expiry,
        slots: draft.slots,
      });
      saveRecentEvent({
        id: eventId,
        title: draft.title || "Untitled meeting",
        participants: draft.hostName ? [draft.hostName] : undefined,
        state: "voting",
      });
      saveCreator(eventId);
      reset();
      onCreated(eventId);
    } catch (err) {
      console.error("Failed to create event", err);
      setConfirming(false);
    }
  };

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
      onConfirm={onConfirm}
      confirming={confirming}
      onBack={onBack}
      requestCalendarSuggestions={requestCalendarSuggestions}
      initialSuggestions={initialSuggestions}
    />
  );
}
