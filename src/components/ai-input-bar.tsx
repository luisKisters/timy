"use client";

import { useState, useRef } from "react";
import { LoaderIcon, MicIcon, SendIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { cn } from "@/lib/utils";

interface AIInputBarProps {
  onSend?: (message: string) => void;
  onAudio?: (blob: Blob, mimeType: string) => void;
  placeholder?: string;
  loading?: boolean;
  error?: string | null;
  eventId?: string;
  hasSharedKey?: boolean;
}

export function AIInputBar({
  onSend,
  onAudio,
  placeholder = "Ask AI to help with scheduling...",
  loading = false,
  error = null,
  eventId,
  hasSharedKey,
}: AIInputBarProps) {
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function adjustHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleSend() {
    if (!message.trim() || loading) return;
    onSend?.(message.trim());
    setMessage("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  async function handleMic() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current!);
        setRecording(false);
        setRecordingSeconds(0);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onAudio?.(blob, mimeType);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      // mic permission denied
    }
  }

  return (
    <div className="space-y-1.5">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className={cn(
        "flex items-end gap-2 rounded-xl border bg-card/90 p-2 shadow-md backdrop-blur-sm transition-colors",
        recording && "border-red-500/40 bg-red-500/5"
      )}>
        <ApiKeyDialog eventId={eventId} hasSharedKey={hasSharedKey} />
        {recording ? (
          <div className="flex flex-1 items-center gap-2 px-2 py-1.5">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">
              {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground">Tap ■ to send</span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => { setMessage(e.target.value); adjustHeight(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={placeholder}
            disabled={loading}
            rows={1}
            className="flex-1 resize-none overflow-hidden bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            style={{ height: "auto", minHeight: "2rem", maxHeight: "7.5rem" }}
          />
        )}
        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon" variant={recording ? "destructive" : "ghost"} onClick={handleMic} disabled={loading} className="size-8">
            {recording ? <SquareIcon className="size-3.5" /> : <MicIcon className="size-3.5" />}
          </Button>
          {!recording && (
            <Button size="icon" disabled={!message.trim() || loading} onClick={handleSend} className="size-8">
              {loading ? <LoaderIcon className="size-3.5 animate-spin" /> : <SendIcon className="size-3.5" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
