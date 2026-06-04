"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "@/components/home/home-screen";
import { getRecentEvents, type RecentEvent } from "@/lib/recent-events";
import { beginNewDraft } from "@/lib/create-draft";

export default function HomePage() {
  const router = useRouter();
  const [recents, setRecents] = useState<RecentEvent[]>([]);

  useEffect(() => {
    setRecents(getRecentEvents());
  }, []);

  return (
    <HomeScreen
      recents={recents}
      onCreate={() => {
        try {
          if (typeof window !== "undefined") {
            beginNewDraft(window.sessionStorage, Date.now());
          }
        } catch {
          // sessionStorage unavailable — the create flow will start a draft itself
        }
        router.push("/create");
      }}
      onOpenRecent={(id) => router.push(`/event/${id}`)}
    />
  );
}
