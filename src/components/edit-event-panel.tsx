"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2Icon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateEvent } from "@/app/event/[id]/actions";

interface EditEventPanelProps {
  eventId: string;
  initialTitle: string;
  initialDescription: string;
}

export function EditEventPanel({ eventId, initialTitle, initialDescription }: EditEventPanelProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!title.trim()) return;
    startTransition(async () => {
      await updateEvent(eventId, { title: title.trim(), description });
      setExpanded(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-border/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Settings2Icon className="size-4 text-muted-foreground" />
          Edit event details
        </span>
        {expanded ? <ChevronUpIcon className="size-4 text-muted-foreground" /> : <ChevronDownIcon className="size-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="border-t border-border/60 p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">
              Description <span className="text-muted-foreground/50 font-normal text-xs">optional</span>
            </Label>
            <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!title.trim() || isPending} onClick={handleSave} data-loading={isPending || undefined} className="flex-1">
              {isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
