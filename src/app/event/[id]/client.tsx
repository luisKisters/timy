"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { CheckIcon, CopyIcon, LinkIcon, PencilIcon } from "lucide-react";
import { AvailabilityGrid } from "@/components/availability-grid";
import { AIInputBar } from "@/components/ai-input-bar";
import { ManageSlotsPanel } from "@/components/manage-slots-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Event, TimeSlot } from "@/types";
import { submitAvailability, updateAvailability } from "./actions";
import { getIdentity, saveIdentity } from "@/lib/identity";

interface EventPageClientProps {
  event: Event;
  slots: TimeSlot[];
  isCreator: boolean;
}

interface SlotDisplay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

function formatSlots(slots: TimeSlot[]): SlotDisplay[] {
  return slots.map((s) => {
    const start = new Date(s.start);
    const end = new Date(s.end);
    return {
      id: s.id,
      date: start.toISOString().split("T")[0],
      startTime: start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      endTime: end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
  });
}

export function EventPageClient({ event, slots, isCreator }: EventPageClientProps) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [existingParticipantId, setExistingParticipantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const displaySlots = formatSlots(slots);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/event/${event.id}`
    : `/event/${event.id}`;

  // Load identity from localStorage on mount
  useEffect(() => {
    const identity = getIdentity(event.id);
    if (identity) {
      setName(identity.name);
      setSelected(new Set(identity.selectedSlotIds));
      setExistingParticipantId(identity.id);
      setSubmitted(true);
    }
  }, [event.id]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelected(new Set());
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        if (!submitted && name.trim() && selected.size > 0 && !isPending) {
          handleSubmit();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleToggle(slotId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      if (existingParticipantId && !editMode) return;
      let participantId = existingParticipantId;
      if (existingParticipantId) {
        await updateAvailability(existingParticipantId, name, Array.from(selected), event.id);
      } else {
        const result = await submitAvailability(event.id, name, Array.from(selected));
        participantId = result.participantId;
      }
      saveIdentity(event.id, { id: participantId!, name, selectedSlotIds: Array.from(selected) });
      setExistingParticipantId(participantId);
      setSubmitted(true);
      setEditMode(false);
    });
  }

  const isEditing = editMode || (!submitted && !existingParticipantId);
  const canSubmit = name.trim() && selected.size > 0 && !isPending;

  if (submitted && !editMode) {
    return (
      <main className="flex min-h-[100svh] flex-col p-6 pb-24">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            {event.description && <p className="text-muted-foreground">{event.description}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Thanks, {name}!</p>
                <p className="text-sm text-muted-foreground">Your availability has been recorded.</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditMode(true); setSubmitted(false); }}
              >
                <PencilIcon className="size-3.5 mr-1.5" />
                Edit
                <span className="ml-1.5 text-xs opacity-40">e</span>
              </Button>
            </div>

            <div className="opacity-60 pointer-events-none">
              <AvailabilityGrid slots={displaySlots} selected={selected} onToggle={() => {}} />
            </div>
          </div>

          {isCreator && <ManageSlotsPanel eventId={event.id} slots={slots} />}

          <div className="flex gap-3">
            <Button className="flex-1" render={<Link href={`/event/${event.id}/results`} />}>
              View Results
              <span className="ml-2 text-xs opacity-40">↵</span>
            </Button>
          </div>
        </div>

        <AIInputBar placeholder="Tell AI your availability, e.g. 'I'm free Tuesday lunch'" />
      </main>
    );
  }

  return (
    <main className="flex min-h-[100svh] flex-col p-6 pb-24">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          {event.description && <p className="text-muted-foreground">{event.description}</p>}
        </div>

        {/* Share section (creator only) */}
        {isCreator && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LinkIcon className="size-4" />
              Share this event
            </div>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="text-sm" />
              <Button size="icon" variant="secondary" onClick={handleCopy} title={copied ? "Copied!" : "Copy link"}>
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Share with participants to collect votes.</p>
              <Button variant="ghost" size="sm" render={<Link href={`/event/${event.id}/results`} />}>
                Results →
              </Button>
            </div>
          </div>
        )}

        {isCreator && (
          <ManageSlotsPanel eventId={event.id} slots={slots} />
        )}

        {/* Name input */}
        <div className="space-y-1.5">
          <Label htmlFor="participant-name">Your name</Label>
          <Input
            id="participant-name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={!existingParticipantId}
          />
        </div>

        {/* Availability */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Your availability</Label>
            <span className="text-xs text-muted-foreground/50">
              {selected.size > 0 ? `${selected.size} selected` : "tap to select"}
              {" · "}⎋ to clear
            </span>
          </div>
          <AvailabilityGrid slots={displaySlots} selected={selected} onToggle={handleToggle} />
        </div>

        {/* Submit */}
        <div className="space-y-2">
          <Button
            className="w-full"
            size="lg"
            disabled={!canSubmit}
            onClick={handleSubmit}
            data-loading={isPending || undefined}
          >
            {isPending ? "Submitting..." : existingParticipantId ? "Update Availability" : "Submit Availability"}
            {!isPending && <span className="ml-2 text-xs opacity-40">⌘↵</span>}
          </Button>
          {existingParticipantId && (
            <Button variant="ghost" className="w-full" size="sm" onClick={() => { setEditMode(false); setSubmitted(true); }}>
              Cancel
              <span className="ml-1.5 text-xs opacity-40">⎋</span>
            </Button>
          )}
        </div>
      </div>

      <AIInputBar placeholder="Tell AI your availability, e.g. 'I'm free Tuesday lunch'" />
    </main>
  );
}
