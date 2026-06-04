"use client";

import { useState } from "react";
import { AppShell, Button, Stepper, Topbar } from "@/components/timy";

export interface ShareScreenProps {
  inviteUrl: string;
  title?: string;
  onFillOut: () => void;
  /** Defaults to the Web Share API. */
  onShare?: () => void | Promise<void>;
  /** Defaults to writing the invite link to the clipboard. */
  onCopy?: () => void | Promise<void>;
  onBack?: () => void;
}

export function ShareScreen({
  inviteUrl,
  title = "Timy poll",
  onFillOut,
  onShare,
  onCopy,
  onBack,
}: ShareScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (onCopy) await onCopy();
      else await navigator.clipboard?.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard denied — no-op */
    }
  };

  const handleShare = async () => {
    try {
      if (onShare) await onShare();
      else if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: `Join "${title}" — find a time`, url: inviteUrl });
      } else {
        await handleCopy();
      }
    } catch {
      /* share cancelled — no-op */
    }
  };

  return (
    <AppShell
      topbar={
        <Topbar onBack={onBack} trailing={<Stepper total={3} current={3} label="Done ✓" />} />
      }
      center
      dock={
        <>
          <Button variant="secondary" block onClick={onFillOut}>
            Fill out my availability
          </Button>
          <Button variant="primary" size="lg" block onClick={handleShare}>
            ⤴ Share
          </Button>
        </>
      }
    >
      <div className="center-col" style={{ gap: 10 }}>
        <div className="bigcheck" aria-hidden="true">
          ✓
        </div>
        <h2 className="h-lg" style={{ marginTop: 4 }}>
          Your poll is ready
        </h2>
        <p className="sub" style={{ margin: 0, textAlign: "center" }}>
          Share it so the others can vote.
        </p>
      </div>

      <div style={{ width: "100%", marginTop: 8 }}>
        <div
          className="lab"
          style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", margin: "0 2px 7px" }}
        >
          Invite link
        </div>
        <div className="linkfield">
          <span className="url">{inviteUrl}</span>
          <button
            type="button"
            aria-label="Copy invite link"
            onClick={handleCopy}
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--r-sm)",
              background: "var(--card)",
              border: "1px solid var(--border)",
              display: "grid",
              placeItems: "center",
              fontSize: 15,
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          >
            ⎘
          </button>
        </div>
        {copied && (
          <div
            role="status"
            className="muted"
            style={{ fontSize: 12, marginTop: 6, textAlign: "center", color: "var(--ok-strong)" }}
          >
            Copied!
          </div>
        )}
      </div>
    </AppShell>
  );
}
