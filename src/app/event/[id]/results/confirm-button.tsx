"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmSlot } from "./actions";

interface ConfirmButtonProps {
  eventId: string;
  slotId: string;
}

export function ConfirmButton({ eventId, slotId }: ConfirmButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      data-loading={isPending || undefined}
      onClick={() => {
        startTransition(async () => {
          await confirmSlot(eventId, slotId);
        });
      }}
    >
      {isPending ? "Confirming..." : "Confirm This Time"}
    </Button>
  );
}
