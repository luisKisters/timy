"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResultsRefresher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => { router.refresh(); });
  }

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={refresh}
      disabled={isPending}
      className="shrink-0 text-muted-foreground"
    >
      <RefreshCwIcon className={`size-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
      Refresh
    </Button>
  );
}
