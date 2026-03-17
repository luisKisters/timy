"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
}

interface SlotPickerProps {
  slots: TimeSlot[];
  onAddSlot: (slot: TimeSlot) => void;
}

export function SlotPicker({ slots, onAddSlot }: SlotPickerProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  function handleAddSlots() {
    for (const date of selectedDates) {
      const slot: TimeSlot = {
        id: `${date.toISOString()}-${startTime}-${endTime}`,
        date,
        startTime,
        endTime,
      };
      onAddSlot(slot);
    }
    setSelectedDates([]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pick Time Slots</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => setSelectedDates(dates || [])}
          disabled={{ before: new Date() }}
          className="mx-auto"
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="start-time">Start</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end-time">End</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <Button
          className="w-full"
          variant="secondary"
          disabled={selectedDates.length === 0}
          onClick={handleAddSlots}
        >
          Add {selectedDates.length > 0 ? selectedDates.length : ""} Slot
          {selectedDates.length !== 1 ? "s" : ""}
        </Button>
      </CardContent>
    </Card>
  );
}
