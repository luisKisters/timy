"use client";

import { useState } from "react";
import { MicIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AIInputBarProps {
  onSend?: (message: string) => void;
  onMicClick?: () => void;
  placeholder?: string;
}

export function AIInputBar({
  onSend,
  onMicClick,
  placeholder = "Ask AI to help with scheduling...",
}: AIInputBarProps) {
  const [message, setMessage] = useState("");

  function handleSend() {
    if (!message.trim()) return;
    onSend?.(message.trim());
    setMessage("");
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-md items-center gap-2 rounded-xl border bg-card/80 p-2 shadow-lg backdrop-blur-lg">
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
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={onMicClick}
        >
          <MicIcon />
        </Button>
        <Button
          size="icon"
          disabled={!message.trim()}
          onClick={handleSend}
        >
          <SendIcon />
        </Button>
      </div>
    </div>
  );
}
