"use client";

import { useState, useRef } from "react";
import { LoaderIcon, MicIcon, SendIcon, SquareIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { cn } from "@/lib/utils";

interface AIInputBarProps {
  onSend?: (message: string) => void;
  onAudio?: (blob: Blob, mimeType: string) => void;
  placeholder?: string;
  loading?: boolean;
  error?: string | null;
}

export function AIInputBar({
  onSend,
  onAudio,
  placeholder = "Ask AI to help with scheduling...",
  loading = false,
  error = null,
}: AIInputBarProps) {
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleSend() {
    if (!message.trim() || loading) return;
    onSend?.(message.trim());
    setMessage("");
  }

  async function handleMic() {
    if (recording) {
      // Stop recording
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
      // mic permission denied — ignore
    }
  }

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50 p-4"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
    >
      {error && (
        <div className="mx-auto mb-2 max-w-md rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className={cn(
        "mx-auto flex max-w-md items-center gap-2 rounded-xl border bg-card/90 p-2 shadow-lg backdrop-blur-lg transition-colors",
        recording && "border-red-500/40 bg-red-500/5"
      )}>
        <ApiKeyDialog />
        {recording ? (
          <div className="flex flex-1 items-center gap-2 px-2">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">
              {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground">Recording… tap ■ to send</span>
          </div>
        ) : (
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={placeholder}
            disabled={loading}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        )}
        <Button size="icon" variant={recording ? "destructive" : "ghost"} onClick={handleMic} disabled={loading}>
          {recording ? <SquareIcon className="size-4" /> : <MicIcon />}
        </Button>
        {!recording && (
          <Button size="icon" disabled={!message.trim() || loading} onClick={handleSend}>
            {loading ? <LoaderIcon className="animate-spin" /> : <SendIcon />}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
