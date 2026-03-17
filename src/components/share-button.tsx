"use client";

import { useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  url: string;
  title: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button size="icon" variant="secondary" onClick={handleShare} title={copied ? "Copied!" : "Share"}>
      {copied ? <CheckIcon /> : <Share2Icon />}
    </Button>
  );
}
