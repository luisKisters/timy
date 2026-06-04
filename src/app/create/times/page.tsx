"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { TimesConnected } from "@/components/create/times-connected";

export default function CreateTimesPage() {
  const router = useRouter();
  return (
    <Suspense>
      <TimesConnected
        onBack={() => router.push("/create")}
        onDone={() => router.push("/create/review")}
      />
    </Suspense>
  );
}
