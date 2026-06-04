"use client";

import { useRouter } from "next/navigation";
import { ReviewConnected } from "@/components/create/review-connected";
import { createEventFromDraft } from "@/app/create/actions";

export default function CreateReviewPage() {
  const router = useRouter();
  return (
    <ReviewConnected
      createEvent={createEventFromDraft}
      onNavigate={(id) => router.push(`/event/${id}/share`)}
      onBack={() => router.push("/create/times")}
    />
  );
}
