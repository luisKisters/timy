"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShareScreen } from "@/components/event/share-screen";

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [inviteUrl, setInviteUrl] = useState(`/event/${id}`);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteUrl(`${window.location.origin}/event/${id}`);
    }
  }, [id]);

  return (
    <ShareScreen
      inviteUrl={inviteUrl}
      onFillOut={() => router.push(`/event/${id}`)}
      onBack={() => router.push("/")}
    />
  );
}
