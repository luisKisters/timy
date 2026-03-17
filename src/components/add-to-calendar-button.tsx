"use client";

import { CalendarPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateICS, downloadICS } from "@/lib/ics";

interface AddToCalendarButtonProps {
  title: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
}

export function AddToCalendarButton({ title, description, start, end }: AddToCalendarButtonProps) {
  function handleClick() {
    const ics = generateICS({
      title,
      description,
      start: new Date(start),
      end: new Date(end),
    });
    downloadICS(ics, `${title.replace(/\s+/g, "-").toLowerCase()}.ics`);
  }

  return (
    <Button variant="outline" onClick={handleClick} className="w-full">
      <CalendarPlusIcon className="size-4 mr-2" />
      Add to Calendar
    </Button>
  );
}
