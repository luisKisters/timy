"use client";

import { useState } from "react";
import { LoaderIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { suggestBestSlot, type SlotScore } from "@/lib/ai-client";
import { getOrMigrateAIConfig } from "@/lib/ai-config";

interface AIResultsSuggestionProps {
  ranked: SlotScore[];
  eventTitle: string;
  participantNames: string[];
}

export function AIResultsSuggestion({ ranked, eventTitle, participantNames }: AIResultsSuggestionProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    if (!getOrMigrateAIConfig()) {
      setError("Set your AI API key first (🔑 button)");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const text = await suggestBestSlot(ranked, eventTitle, participantNames);
      setSuggestion(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }

  if (suggestion) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-primary/60">AI Suggestion</p>
        <p className="text-sm">{suggestion}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button variant="outline" size="sm" onClick={handleSuggest} disabled={loading} className="w-full">
        {loading ? <LoaderIcon className="size-3.5 mr-1.5 animate-spin" /> : <SparklesIcon className="size-3.5 mr-1.5" />}
        {loading ? "Asking AI…" : "Ask AI which slot is best"}
      </Button>
    </div>
  );
}
