"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const EXPIRY_OPTIONS = [
  { label: "1 day", value: "1d" },
  { label: "3 days", value: "3d" },
  { label: "1 week", value: "1w" },
  { label: "After last slot + 1 week", value: "auto" },
  { label: "Never", value: "never" },
];

export function EventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiry, setExpiry] = useState("3d");

  function handleNext() {
    if (!title.trim()) return;
    router.push(`/create/slots?${new URLSearchParams({ title, description, expiry })}`);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="min-h-[100svh] flex flex-col p-4 sm:p-6">
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Event</h1>
            <p className="mt-1 text-sm text-muted-foreground">Name your event and set the poll expiry.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Event name</Label>
              <Input
                id="title"
                placeholder="e.g. Team lunch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground/50 font-normal text-xs">optional</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Any details for participants..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Poll closes</Label>
              <div className="flex gap-2 flex-wrap">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpiry(opt.value)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      expiry === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <Button className="w-full" size="lg" disabled={!title.trim()} onClick={handleNext}>
              Next
              <span className="ml-2 text-xs opacity-40">↵</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
