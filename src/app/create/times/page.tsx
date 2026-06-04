"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { TimesConnected } from "@/components/create/times-connected";
import { createEventFromDraft } from "@/app/create/actions";

export default function CreateTimesPage() {
  const router = useRouter();
  return (
    <Suspense>
      <TimesConnected
        createEvent={createEventFromDraft}
        onCreated={(id) => router.push(`/event/${id}/share`)}
        onBack={() => router.push("/create")}
      />
    </Suspense>
  );
}
