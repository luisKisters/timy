"use client";

import { useState, useEffect } from "react";
import { KeyIcon } from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGeminiApiKey, setGeminiApiKey, removeGeminiApiKey } from "@/lib/gemini";

export function ApiKeyDialog() {
  const [key, setKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = getGeminiApiKey();
    if (stored) {
      setKey(stored);
      setHasKey(true);
    }
  }, []);

  function handleSave() {
    if (key.trim()) {
      setGeminiApiKey(key.trim());
      setHasKey(true);
      setOpen(false);
    }
  }

  function handleRemove() {
    removeGeminiApiKey();
    setKey("");
    setHasKey(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="icon-sm" variant={hasKey ? "secondary" : "outline"} />
        }
      >
        <KeyIcon />
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Gemini API Key</DialogTitle>
          <DialogDescription>
            Enter your Google Gemini API key to enable AI features. Your key is
            stored locally and sent directly to Google.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="AIza..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
        </div>
        <DialogFooter variant="bare">
          {hasKey && (
            <Button variant="destructive" onClick={handleRemove}>
              Remove Key
            </Button>
          )}
          <Button onClick={handleSave} disabled={!key.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
