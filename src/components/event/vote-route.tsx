"use client";

import { useRouter } from "next/navigation";
import { VoteConnected } from "@/components/event/vote-connected";
import { submitVotes } from "@/app/event/[id]/vote-actions";
import type { VoteSlot } from "@/components/event/vote-screen";

export interface VoteRouteProps {
  eventId: string;
  title: string;
  hostName?: string;
  slots: VoteSlot[];
  participantNames: string[];
  autoTickedIds?: string[];
}

export function VoteRoute(props: VoteRouteProps) {
  const router = useRouter();
  return (
    <VoteConnected
      {...props}
      submitVotes={submitVotes}
      onSubmitted={(id) => router.push(`/event/${id}/results`)}
    />
  );
}
