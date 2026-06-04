"use client";

import { useEffect, useMemo, useState } from "react";
import { VoteScreen, type ScanConfig, type VoteSlot } from "@/components/event/vote-screen";
import { getIdentity, saveIdentity } from "@/lib/identity";
import { slotWithinConfig } from "@/lib/domain";

export interface VoteConnectedProps {
  eventId: string;
  title: string;
  hostName?: string;
  slots: VoteSlot[];
  participantNames: string[];
  autoTickedIds?: string[];
  /** Display timezone — defaults to the viewer's local zone. */
  tz?: string;
  submitVotes: (input: {
    eventId: string;
    name: string;
    availableSlotIds: string[];
    allSlotIds: string[];
  }) => Promise<{ participantId: string }>;
  /** Called after a successful submit (the page routes to results). */
  onSubmitted: (eventId: string) => void;
}

function localTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function VoteConnected({
  eventId,
  title,
  hostName,
  slots,
  participantNames,
  autoTickedIds,
  tz: tzProp,
  submitVotes,
  onSubmitted,
}: VoteConnectedProps) {
  const tz = useMemo(() => tzProp ?? localTz(), [tzProp]);

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Hydrate any prior identity + calendar-auto-ticked ids once on mount.
  useEffect(() => {
    const id = getIdentity(eventId);
    const init = new Set<string>(id?.selectedSlotIds ?? []);
    for (const i of autoTickedIds ?? []) init.add(i);
    setSelected(init);
    if (id?.name) setName(id.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const toggle = (slotId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });

  // Real app: redirect to the vote-flow gcal endpoint with the config-filtered
  // slots; it returns ?gcal_available=ids which the server page feeds back in.
  const onAutoCheck = async (config: ScanConfig) => {
    if (typeof window === "undefined") return;
    const scan = slots
      .filter((s) => slotWithinConfig(s.start, { ...config, tz }))
      .map((s) => ({ id: s.id, start: s.start, end: s.end }));
    const slotsParam = encodeURIComponent(JSON.stringify(scan));
    window.location.href = `/api/gcal?eventId=${encodeURIComponent(eventId)}&slots=${slotsParam}`;
  };

  const onSubmit = async () => {
    if (submitting || name.trim().length === 0) return;
    setSubmitting(true);
    try {
      const availableSlotIds = [...selected];
      const allSlotIds = slots.map((s) => s.id);
      const { participantId } = await submitVotes({
        eventId,
        name,
        availableSlotIds,
        allSlotIds,
      });
      saveIdentity(eventId, { id: participantId, name: name.trim(), selectedSlotIds: availableSlotIds });
      onSubmitted(eventId);
    } catch (err) {
      console.error("Failed to submit votes", err);
      setSubmitting(false);
    }
  };

  return (
    <VoteScreen
      title={title}
      hostName={hostName}
      tz={tz}
      slots={slots}
      participantNames={participantNames}
      name={name}
      onNameChange={setName}
      selected={selected}
      onToggle={toggle}
      onAutoCheck={onAutoCheck}
      autoFilled={(autoTickedIds?.length ?? 0) > 0}
      onSubmit={onSubmit}
      submitting={submitting}
    />
  );
}
