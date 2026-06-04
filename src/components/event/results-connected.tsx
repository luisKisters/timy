"use client";

import { useEffect, useMemo, useState } from "react";
import { ResultsScreen, type ScoredSlot } from "@/components/event/results-screen";
import { rankSlots } from "@/lib/domain";
import { downloadICS, generateICS } from "@/lib/ics";
import type { Participant, TimeSlot, Vote } from "@/types";

export interface ResultsConnectedProps {
  eventId: string;
  title: string;
  tz?: string;
  slots: { id: string; start: string; end: string }[];
  participants: { id: string; name: string }[];
  votes: { participantId: string; slotId: string; available: boolean }[];
  initialResolvedSlotId: string | null;
  confirmSlot: (eventId: string, slotId: string | null) => Promise<void>;
}

function localTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function ResultsConnected({
  eventId,
  title,
  tz: tzProp,
  slots,
  participants,
  votes,
  initialResolvedSlotId,
  confirmSlot,
}: ResultsConnectedProps) {
  const tz = useMemo(() => tzProp ?? localTz(), [tzProp]);
  const [resolvedSlotId, setResolvedSlotId] = useState<string | null>(initialResolvedSlotId);
  const [confirming, setConfirming] = useState(false);
  const [inviteUrl, setInviteUrl] = useState(`/event/${eventId}`);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteUrl(`${window.location.origin}/event/${eventId}`);
    }
  }, [eventId]);

  // Share the invite so more people vote (Web Share API → clipboard fallback).
  const onShareInvite = async () => {
    const text = `Join "${title}" — find a time`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: inviteUrl });
      } else {
        await navigator.clipboard?.writeText(inviteUrl);
      }
    } catch {
      /* share cancelled — no-op */
    }
  };

  const scores = useMemo<ScoredSlot[]>(() => {
    const tsSlots: TimeSlot[] = slots.map((s) => ({
      id: s.id,
      event_id: eventId,
      start: s.start,
      end: s.end,
      created: "",
      updated: "",
    }));
    const tsParts: Participant[] = participants.map((p) => ({
      id: p.id,
      event_id: eventId,
      name: p.name,
      created: "",
      updated: "",
    }));
    const tsVotes: Vote[] = votes.map((v, i) => ({
      id: String(i),
      participant_id: v.participantId,
      slot_id: v.slotId,
      available: v.available,
      created: "",
      updated: "",
    }));
    const ranked = rankSlots(tsSlots, tsParts, tsVotes);
    return ranked.map((r) => {
      const s = slots.find((x) => x.id === r.slot.id)!;
      return {
        slotId: r.slot.id,
        start: s.start,
        end: s.end,
        available: r.availableCount,
        total: r.totalCount,
        percentage: r.percentage,
      };
    });
  }, [slots, participants, votes, eventId]);

  const isAvailable = (participantId: string, slotId: string) =>
    votes.some((v) => v.participantId === participantId && v.slotId === slotId && v.available);

  const onConfirm = async (slotId: string) => {
    if (confirming) return;
    setConfirming(true);
    try {
      await confirmSlot(eventId, slotId);
      setResolvedSlotId(slotId);
    } catch (err) {
      console.error("Failed to confirm slot", err);
    } finally {
      setConfirming(false);
    }
  };

  const onChangeTime = async () => {
    setResolvedSlotId(null);
    try {
      await confirmSlot(eventId, null);
    } catch (err) {
      console.error("Failed to clear confirmed slot", err);
    }
  };

  const onAddToCalendar = (slotId: string) => {
    const s = slots.find((x) => x.id === slotId);
    if (!s) return;
    const ics = generateICS({
      title,
      start: new Date(s.start),
      end: new Date(s.end),
    });
    downloadICS(ics, `${title || "timy"}.ics`);
  };

  return (
    <ResultsScreen
      title={title}
      tz={tz}
      scores={scores}
      participants={participants}
      isAvailable={isAvailable}
      resolvedSlotId={resolvedSlotId}
      confirming={confirming}
      onConfirm={onConfirm}
      onChangeTime={onChangeTime}
      onAddToCalendar={onAddToCalendar}
      inviteUrl={inviteUrl}
      onShareInvite={onShareInvite}
    />
  );
}
