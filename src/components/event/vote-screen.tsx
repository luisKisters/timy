"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppShell,
  AvatarStack,
  BottomSheet,
  Button,
  Chip,
  DateStrip,
  SlotCard,
  Topbar,
} from "@/components/timy";
import { dayKey, dayNumber, formatTimeRange, weekdayShort } from "@/lib/domain";

const WEEKDAYS: { label: string; n: number }[] = [
  { label: "Mon", n: 1 },
  { label: "Tue", n: 2 },
  { label: "Wed", n: 3 },
  { label: "Thu", n: 4 },
  { label: "Fri", n: 5 },
  { label: "Sat", n: 6 },
  { label: "Sun", n: 0 },
];

export interface VoteSlot {
  id: string;
  start: string;
  end: string;
}

export interface ScanConfig {
  weekdays: number[];
  windowStart: string;
  windowEnd: string;
}

export interface VoteScreenProps {
  title: string;
  hostName?: string;
  tz: string;
  slots: VoteSlot[];
  participantNames: string[];
  name: string;
  onNameChange: (name: string) => void;
  selected: Set<string>;
  onToggle: (slotId: string) => void;
  /** Runs the calendar scan (real app redirects to OAuth; tests stub it). */
  onAutoCheck: (config: ScanConfig) => void | Promise<void>;
  /** Show the "ticked from your calendar" hint (after a scan returns). */
  autoFilled?: boolean;
  onSubmit: () => void;
  submitting?: boolean;
}

export function VoteScreen({
  title,
  hostName,
  tz,
  slots,
  participantNames,
  name,
  onNameChange,
  selected,
  onToggle,
  onAutoCheck,
  autoFilled,
  onSubmit,
  submitting,
}: VoteScreenProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("17:00");

  const days = useMemo(() => {
    const map = new Map<string, VoteSlot[]>();
    for (const s of slots) {
      const k = dayKey(s.start, tz);
      const arr = map.get(k) ?? [];
      arr.push(s);
      map.set(k, arr);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, daySlots]) => ({
        key,
        weekday: weekdayShort(daySlots[0].start, tz),
        day: dayNumber(daySlots[0].start, tz),
        count: daySlots.filter((s) => selected.has(s.id)).length,
        slots: daySlots.slice().sort((x, y) => x.start.localeCompare(y.start)),
      }));
  }, [slots, tz, selected]);

  const [selectedDay, setSelectedDay] = useState(days[0]?.key ?? "");
  useEffect(() => {
    if (days.length && !days.some((d) => d.key === selectedDay)) {
      setSelectedDay(days[0].key);
    }
  }, [days, selectedDay]);

  const current = days.find((d) => d.key === selectedDay);
  const toggleWeekday = (n: number) =>
    setWeekdays((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  return (
    <AppShell
      topbar={
        <Topbar
          title={title}
          meta={hostName ? `Hosted by ${hostName}` : undefined}
          trailing={
            participantNames.length ? (
              <AvatarStack people={participantNames.map((n) => ({ name: n }))} />
            ) : undefined
          }
        />
      }
      dock={
        <>
          <Button variant="secondary" block onClick={() => setConfigOpen(true)}>
            📅 Auto-check calendar
          </Button>
          <Button
            variant="primary"
            size="lg"
            block
            disabled={submitting || name.trim().length === 0}
            onClick={onSubmit}
          >
            {submitting ? "Submitting…" : "Submit availability"}
          </Button>
        </>
      }
    >
      <label className="field">
        <div className="lab">Your name</div>
        <input
          className="input"
          aria-label="Your name"
          placeholder="e.g. Ada"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </label>

      {days.length > 0 && (
        <DateStrip
          days={days.map((d) => ({ key: d.key, weekday: d.weekday, day: d.day, count: d.count }))}
          selected={selectedDay}
          onSelect={setSelectedDay}
        />
      )}

      <div>
        <div className="headrow">
          <h2>When are you free?</h2>
        </div>
        {(autoFilled || scanned) && (
          <div className="muted" style={{ fontSize: 12.5, margin: "3px 2px 0" }}>
            Ticked from your calendar — tap any to change
          </div>
        )}
      </div>

      {current ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {current.slots.map((s) => (
            <SlotCard
              key={s.id}
              label={formatTimeRange(s.start, s.end, tz)}
              selected={selected.has(s.id)}
              onToggle={() => onToggle(s.id)}
            />
          ))}
        </div>
      ) : (
        <p className="sub" style={{ marginTop: 8 }}>
          No times to vote on yet.
        </p>
      )}

      <BottomSheet
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="Check your calendar"
        subtitle="Pick the days and hours to scan — so it only ticks times that really work."
      >
        <div className="field" style={{ marginTop: 4 }}>
          <div className="lab">Which days</div>
          <div className="chips">
            {WEEKDAYS.map((d) => (
              <Chip key={d.n} selected={weekdays.includes(d.n)} onClick={() => toggleWeekday(d.n)}>
                {d.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <div className="lab" style={{ marginBottom: 7 }}>
            Working hours
          </div>
          <div className="timewindow">
            <input className="input" type="time" aria-label="Hours start" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span style={{ color: "var(--muted)" }}>–</span>
            <input className="input" type="time" aria-label="Hours end" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <Button
          variant="ok"
          size="lg"
          block
          style={{ marginTop: 14 }}
          disabled={weekdays.length === 0}
          onClick={async () => {
            await onAutoCheck({ weekdays, windowStart: from, windowEnd: to });
            setScanned(true);
            setConfigOpen(false);
          }}
        >
          Check calendar
        </Button>
      </BottomSheet>
    </AppShell>
  );
}
