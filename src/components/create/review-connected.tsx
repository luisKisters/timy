"use client";

import { useState } from "react";
import { useCreateDraft } from "@/components/create/create-draft-context";
import { ReviewScreen } from "@/components/create/review-screen";
import { saveRecentEvent } from "@/lib/recent-events";
import { saveCreator } from "@/lib/creator";
import type { DraftSlot } from "@/lib/create-draft";
import type { ExpiryOption } from "@/lib/domain/expiry";

export interface ReviewConnectedProps {
  createEvent: (input: {
    title: string;
    hostName: string;
    expiry: ExpiryOption;
    slots: DraftSlot[];
  }) => Promise<{ eventId: string }>;
  onNavigate: (eventId: string) => void;
  onBack: () => void;
}

export function ReviewConnected({ createEvent, onNavigate, onBack }: ReviewConnectedProps) {
  const { draft, update, reset } = useCreateDraft();
  const [confirming, setConfirming] = useState(false);

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
      onNavigate(eventId);
    } catch (err) {
      console.error("Failed to create event", err);
      setConfirming(false);
    }
  };

  return (
    <ReviewScreen
      title={draft.title}
      tz={draft.tz}
      slots={draft.slots}
      onRemoveSlot={removeSlot}
      onBack={onBack}
      onConfirm={onConfirm}
      confirming={confirming}
    />
  );
}
