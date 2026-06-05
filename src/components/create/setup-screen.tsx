"use client";

import { AppShell, Button, Chip, Stepper, Topbar } from "@/components/timy";
import { EXPIRY_OPTIONS, type ExpiryOption } from "@/lib/domain/expiry";

const SLOT_LENGTHS = [15, 30, 45, 60] as const;

export interface SetupValue {
  title: string;
  hostName: string;
  expiry: ExpiryOption;
  slotLengthMin: number;
}

export interface SetupScreenProps {
  value: SetupValue;
  onChange: (patch: Partial<SetupValue>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function SetupScreen({ value, onChange, onContinue, onBack }: SetupScreenProps) {
  const canContinue = value.title.trim().length > 0;

  return (
    <AppShell
      topbar={
        <Topbar onBack={onBack} trailing={<Stepper total={2} current={1} label="1/2" />} />
      }
      dock={
        <Button
          variant="primary"
          size="lg"
          block
          disabled={!canContinue}
          onClick={onContinue}
        >
          Continue →
        </Button>
      }
    >
      <div>
        <div className="eyebrow">New meeting</div>
        <h2 className="h-hero" style={{ marginTop: 6 }}>
          What are you planning?
        </h2>
      </div>

      <input
        className="input big"
        placeholder="e.g. Team Standup"
        aria-label="Meeting name"
        value={value.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />

      <label className="field">
        <div className="lab">Your name</div>
        <input
          className="input"
          placeholder="e.g. Luis"
          aria-label="Your name"
          value={value.hostName}
          onChange={(e) => onChange({ hostName: e.target.value })}
        />
      </label>

      <div className="field">
        <div className="lab">Poll closes</div>
        <div className="chips">
          {EXPIRY_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              selected={value.expiry === opt}
              onClick={() => onChange({ expiry: opt })}
            >
              {opt}
            </Chip>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="lab">Each time slot is</div>
        <div className="chips">
          {SLOT_LENGTHS.map((n) => (
            <Chip
              key={n}
              selected={value.slotLengthMin === n}
              onClick={() => onChange({ slotLengthMin: n })}
            >
              {n} min
            </Chip>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
