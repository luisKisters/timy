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
import { getOrMigrateAIConfig, setAIConfig, removeAIConfig, type AIProvider } from "@/lib/ai-config";

interface ApiKeyDialogProps {
  eventId?: string;
  hasSharedKey?: boolean;
}

const PROVIDERS: { id: AIProvider; label: string; placeholder: string; description: string; url: string }[] = [
  {
    id: "google",
    label: "Google",
    placeholder: "AIza...",
    description: "Get your key at aistudio.google.com/app/apikey",
    url: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    label: "OpenAI",
    placeholder: "sk-...",
    description: "Get your key at platform.openai.com/api-keys",
    url: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    placeholder: "sk-ant-...",
    description: "Get your key at console.anthropic.com/settings/keys",
    url: "https://console.anthropic.com/settings/keys",
  },
];

export function ApiKeyDialog({ eventId, hasSharedKey }: ApiKeyDialogProps) {
  const [provider, setProvider] = useState<AIProvider>("google");
  const [key, setKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [open, setOpen] = useState(false);
  const [shareWithParticipants, setShareWithParticipants] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const config = getOrMigrateAIConfig();
    if (config) {
      setProvider(config.provider);
      setKey(config.apiKey);
      setHasKey(true);
    }
  }, []);

  const currentProvider = PROVIDERS.find((p) => p.id === provider)!;

  async function handleSave() {
    if (!key.trim()) return;
    setSaving(true);
    try {
      const config = { provider, apiKey: key.trim() };
      setAIConfig(config);
      setHasKey(true);

      if (eventId && shareWithParticipants) {
        const { saveSharedAIKey } = await import("@/app/event/[id]/actions");
        await saveSharedAIKey(eventId, provider, key.trim());
      }

      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    removeAIConfig();
    setKey("");
    setHasKey(false);

    if (eventId && hasSharedKey) {
      const { clearSharedAIKey } = await import("@/app/event/[id]/actions");
      await clearSharedAIKey(eventId);
    }
  }

  const isActive = hasKey || (hasSharedKey ?? false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="icon-sm" variant={isActive ? "secondary" : "outline"} />
        }
      >
        <KeyIcon />
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>AI Provider</DialogTitle>
          <DialogDescription>
            Choose your AI provider and enter your API key. Used for slot suggestions and availability parsing.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-4 space-y-4">
          {/* Provider tabs */}
          <div className="flex gap-1 rounded-lg border p-1">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setProvider(p.id); setKey(""); }}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  provider === p.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* API key input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder={currentProvider.placeholder}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <p className="text-xs text-muted-foreground">
              {currentProvider.description}
            </p>
          </div>

          {/* Shared key indicator */}
          {hasSharedKey && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✓ A shared key is active for this event (visible to all participants).
            </p>
          )}

          {/* Share toggle (only on event pages) */}
          {eventId && (
            <div className="flex items-center gap-3">
              <input
                id="share-toggle"
                type="checkbox"
                checked={shareWithParticipants}
                onChange={(e) => setShareWithParticipants(e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              <Label htmlFor="share-toggle" className="text-sm font-normal cursor-pointer">
                Share with participants (saves key to this event)
              </Label>
            </div>
          )}
        </div>
        <DialogFooter variant="bare">
          {hasKey && (
            <Button variant="destructive" onClick={handleRemove}>
              Remove Key
            </Button>
          )}
          <Button onClick={handleSave} disabled={!key.trim() || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
