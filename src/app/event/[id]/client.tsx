"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckIcon, CopyIcon } from "lucide-react";
import { AvailabilityGrid } from "@/components/availability-grid";
import { AIInputBar } from "@/components/ai-input-bar";
import { ManageSlotsPanel } from "@/components/manage-slots-panel";
import { EditEventPanel } from "@/components/edit-event-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import type { Event, TimeSlot } from "@/types";
import { submitAvailability, updateAvailability } from "./actions";
import { getIdentity, saveIdentity } from "@/lib/identity";
import { saveCreator, getIsCreator } from "@/lib/creator";
import { parseAvailability, transcribeAndParseAvailability } from "@/lib/ai-client";
import { getOrMigrateAIConfig } from "@/lib/ai-config";
import { saveRecentEvent } from "@/lib/recent-events";
import { ShareButton } from "@/components/share-button";

interface EventPageClientProps {
  event: Event;
  slots: TimeSlot[];
  isCreator: boolean;
  hasSharedKey?: boolean;
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

export function EventPageClient({ event, slots, isCreator: isCreatorProp, hasSharedKey }: EventPageClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [existingParticipantId, setExistingParticipantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreator, setIsCreator] = useState(isCreatorProp);
  const displaySlots = formatSlots(slots);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/event/${event.id}`
    : `/event/${event.id}`;

  useEffect(() => {
    saveRecentEvent({ id: event.id, title: event.title });
    if (isCreatorProp) saveCreator(event.id);
    else setIsCreator(getIsCreator(event.id));

    const identity = getIdentity(event.id);
    if (identity) {
      setName(identity.name);
      setSelected(new Set(identity.selectedSlotIds));
      setExistingParticipantId(identity.id);
    }
  }, [event.id, isCreatorProp]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(new Set());
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        if (name.trim() && selected.size > 0 && !isPending) handleSubmit();
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

  async function handleAISend(message: string) {
    if (!getOrMigrateAIConfig() && !hasSharedKey) {
      setAiError("Set your AI API key first (🔑 button)");
      setTimeout(() => setAiError(null), 4000);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const ids = await parseAvailability(message, displaySlots);
      setSelected(new Set(ids));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI request failed");
      setTimeout(() => setAiError(null), 5000);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAIAudio(blob: Blob) {
    if (!getOrMigrateAIConfig() && !hasSharedKey) {
      setAiError("Set your AI API key first (🔑 button)");
      setTimeout(() => setAiError(null), 4000);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const ids = await transcribeAndParseAvailability(blob, displaySlots);
      setSelected(new Set(ids));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI request failed");
      setTimeout(() => setAiError(null), 5000);
    } finally {
      setAiLoading(false);
    }
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
      let participantId = existingParticipantId;
      if (existingParticipantId) {
        await updateAvailability(existingParticipantId, name, Array.from(selected), event.id);
      } else {
        const result = await submitAvailability(event.id, name, Array.from(selected));
        participantId = result.participantId;
      }
      saveIdentity(event.id, { id: participantId!, name, selectedSlotIds: Array.from(selected) });
      setExistingParticipantId(participantId);
      router.push(`/event/${event.id}/results`);
    });
  }

  const canSubmit = name.trim() && selected.size > 0 && !isPending;

  return (
    <motion.main
      className="flex flex-col overflow-hidden"
      style={{ height: "100dvh", touchAction: "none" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <div className="mx-auto max-w-2xl flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{event.title}</h1>
            {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
          </div>
          <ApiKeyDialog eventId={event.id} hasSharedKey={hasSharedKey} />
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ touchAction: "pan-y" }}
        data-scrollable="true"
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-3 space-y-4">
          {/* Creator: share */}
          {isCreator && (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <p className="text-sm font-medium">Share this event</p>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="text-sm flex-1 min-w-0" />
                <Button size="icon" variant="secondary" onClick={handleCopy} title={copied ? "Copied!" : "Copy link"}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Button>
                <ShareButton url={shareUrl} title={event.title} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Share with participants.</p>
                <Button variant="ghost" size="sm" render={<Link href={`/event/${event.id}/results`} />}>
                  Results →
                </Button>
              </div>
            </div>
          )}

          {isCreator && <EditEventPanel eventId={event.id} initialTitle={event.title} initialDescription={event.description ?? ""} />}
          {isCreator && <ManageSlotsPanel eventId={event.id} slots={slots} />}

          {/* Name */}
          <div className="rounded-xl border bg-card p-4">
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
          </div>

          {/* Availability */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Your availability</Label>
              <span className="text-xs text-muted-foreground/50">
                {selected.size > 0 ? `${selected.size} selected` : "tap to select"}
                {" · "}⎋ to clear
              </span>
            </div>
            <AvailabilityGrid slots={displaySlots} selected={selected} onToggle={handleToggle} />
          </div>
        </div>
      </div>

      {/* Footer: AI bar on top, submit button below */}
      <div className="shrink-0 px-4 sm:px-6 pt-2 pb-4 space-y-2">
        <div className="mx-auto max-w-2xl space-y-2">
          <AIInputBar
            placeholder="Tell AI your availability, e.g. 'I'm free Tuesday lunch'"
            onSend={handleAISend}
            onAudio={handleAIAudio}
            loading={aiLoading}
            error={aiError}
            eventId={event.id}
            hasSharedKey={hasSharedKey}
          />
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
        </div>
      </div>
    </motion.main>
  );
}
