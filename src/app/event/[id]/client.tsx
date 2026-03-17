"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckIcon, CopyIcon, LinkIcon } from "lucide-react";
import { EventHeader } from "@/components/event-header";
import { AvailabilityGrid } from "@/components/availability-grid";
import { AIInputBar } from "@/components/ai-input-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Event, TimeSlot } from "@/types";
import { submitAvailability } from "./actions";

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
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const displaySlots = formatSlots(slots);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/event/${event.id}`
    : `/event/${event.id}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleToggle(slotId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      await submitAvailability(event.id, name, Array.from(selected));
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Thanks, {name}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Your availability has been recorded. The organizer will pick the
              best time.
            </p>
            <Button variant="secondary" render={<Link href={`/event/${event.id}/results`} />}>
              View Results
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 pb-24">
      <div className="w-full max-w-md space-y-4">
        <EventHeader
          title={event.title}
          description={event.description}
        />

        {isCreator && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="size-4" />
                Share This Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-sm"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleCopy}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
              <p className="text-xs text-muted-foreground">
                Share this link with participants so they can vote on time slots.
              </p>
              <Button variant="secondary" size="sm" render={<Link href={`/event/${event.id}/results`} />}>
                View Results
              </Button>
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="participant-name">Name</Label>
              <Input
                id="participant-name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Your Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityGrid
              slots={displaySlots}
              selected={selected}
              onToggle={handleToggle}
            />
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          disabled={!name.trim() || selected.size === 0 || isPending}
          onClick={handleSubmit}
          data-loading={isPending || undefined}
        >
          {isPending ? "Submitting..." : "Submit Availability"}
        </Button>
      </div>

      <AIInputBar placeholder="Tell AI your availability, e.g. 'I'm free Tuesday lunch'" />
    </main>
  );
}
