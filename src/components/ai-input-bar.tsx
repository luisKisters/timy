"use client";

import { useState } from "react";
import { LoaderIcon, MicIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiKeyDialog } from "@/components/api-key-dialog";

interface AIInputBarProps {
  onSend?: (message: string) => void;
  onMicClick?: () => void;
  placeholder?: string;
  loading?: boolean;
  error?: string | null;
}

export function AIInputBar({
  onSend,
  onMicClick,
  placeholder = "Ask AI to help with scheduling...",
  loading = false,
  error = null,
}: AIInputBarProps) {
  const [message, setMessage] = useState("");

  function handleSend() {
    if (!message.trim() || loading) return;
    onSend?.(message.trim());
    setMessage("");
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      {error && (
        <div className="mx-auto mb-2 max-w-md rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className="mx-auto flex max-w-md items-center gap-2 rounded-xl border bg-card/90 p-2 shadow-lg backdrop-blur-lg">
        <ApiKeyDialog />
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          disabled={loading}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button size="icon" variant="ghost" onClick={onMicClick} disabled={loading}>
          <MicIcon />
        </Button>
        <Button size="icon" disabled={!message.trim() || loading} onClick={handleSend}>
          {loading ? <LoaderIcon className="animate-spin" /> : <SendIcon />}
        </Button>
      </div>
    </div>
  );
}
