"use client";

import { useRouter } from "next/navigation";
import { SetupConnected } from "@/components/create/setup-connected";

export default function CreateSetupPage() {
  const router = useRouter();
  return (
    <SetupConnected
      onBack={() => router.push("/")}
      onContinue={() => router.push("/create/times")}
    />
  );
}
