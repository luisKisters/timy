"use client";

import { useCreateDraft } from "@/components/create/create-draft-context";
import { SetupScreen } from "@/components/create/setup-screen";

export interface SetupConnectedProps {
  onContinue: () => void;
  onBack: () => void;
}

export function SetupConnected({ onContinue, onBack }: SetupConnectedProps) {
  const { draft, update } = useCreateDraft();
  return (
    <SetupScreen
      value={{
        title: draft.title,
        hostName: draft.hostName,
        expiry: draft.expiry,
        slotLengthMin: draft.slotLengthMin,
      }}
      onChange={update}
      onContinue={onContinue}
      onBack={onBack}
    />
  );
}
