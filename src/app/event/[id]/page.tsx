"use client";

import { useState } from "react";
import { EventHeader } from "@/components/event-header";
import { AvailabilityGrid } from "@/components/availability-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIInputBar } from "@/components/ai-input-bar";
import { mockEvent } from "@/lib/mock-data";

export default function EventPage() {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  return (
    <main className="flex min-h-screen items-center justify-center p-4 pb-24">
      <div className="w-full max-w-md space-y-4">
        <EventHeader
          title={mockEvent.title}
          description={mockEvent.description}
        />

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
              slots={mockEvent.slots}
              selected={selected}
              onToggle={handleToggle}
            />
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          disabled={!name.trim() || selected.size === 0}
          onClick={() => {
            // Will wire to server action in Phase 3
            console.log("Submit:", { name, selected: Array.from(selected) });
          }}
        >
          Submit Availability
        </Button>
      </div>

      <AIInputBar placeholder="Tell AI your availability, e.g. 'I'm free Tuesday lunch'" />
    </main>
  );
}
