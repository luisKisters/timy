"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppShell,
  BottomSheet,
  Button,
  Chip,
  DateStrip,
  SlotCard,
  Stepper,
  Topbar,
  TrashIcon,
} from "@/components/timy";
import type { DraftSlot } from "@/lib/create-draft";
import type { CalendarConfig } from "@/lib/calendar-config";
import {
  dayKey,
  dayNumber,
  formatDayLong,
  formatTimeRange,
  generateSlots,
  slotAt,
  weekdayShort,
} from "@/lib/domain";

// Mon-first weekday chips mapped to JS weekday numbers (0 = Sun).
const WEEKDAYS: { label: string; n: number }[] = [
  { label: "Mon", n: 1 },
  { label: "Tue", n: 2 },
  { label: "Wed", n: 3 },
  { label: "Thu", n: 4 },
  { label: "Fri", n: 5 },
  { label: "Sat", n: 6 },
  { label: "Sun", n: 0 },
];

type Sheet = "menu" | "single" | "range" | "calendar" | null;

export interface TimesScreenProps {
  slots: DraftSlot[];
  tz: string;
  slotLengthMin: number;
  onAddSlots: (slots: DraftSlot[]) => void;
  onRemoveSlot: (start: string) => void;
  /** Creates the poll and routes to Share (replaces the old Review step). */
  onConfirm: () => void;
  confirming?: boolean;
  onBack: () => void;
  /** Real app redirects to OAuth (never resolves); tests resolve with slots. */
  requestCalendarSuggestions: (config: CalendarConfig) => Promise<DraftSlot[]>;
  /** Free slots returned from the OAuth round-trip (?gcal_free). */
  initialSuggestions?: DraftSlot[];
  /** Anchor for range/calendar generation (injected for deterministic tests). */
  now?: Date;
}

function todayKey(tz: string, now: Date): string {
  return dayKey(now.toISOString(), tz);
}

export function TimesScreen({
  slots,
  tz,
  slotLengthMin,
  onAddSlots,
  onRemoveSlot,
  onConfirm,
  confirming,
  onBack,
  requestCalendarSuggestions,
  initialSuggestions,
  now = new Date(),
}: TimesScreenProps) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [suggestions, setSuggestions] = useState<DraftSlot[] | null>(
    initialSuggestions && initialSuggestions.length ? initialSuggestions : null,
  );

  // Days present in the draft, grouped by tz calendar date.
  const days = useMemo(() => {
    const map = new Map<string, DraftSlot[]>();
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
        count: daySlots.length,
        slots: daySlots.slice().sort((x, y) => x.start.localeCompare(y.start)),
      }));
  }, [slots, tz]);

  const [selectedDay, setSelectedDay] = useState<string>(days[0]?.key ?? "");
  useEffect(() => {
    if (days.length && !days.some((d) => d.key === selectedDay)) {
      setSelectedDay(days[days.length - 1].key);
    }
  }, [days, selectedDay]);

  const current = days.find((d) => d.key === selectedDay);

  // ---- calendar suggestions mode ----
  if (suggestions) {
    return (
      <AppShell
        topbar={<Topbar onBack={onBack} trailing={<Stepper total={2} current={2} label="2/2" />} />}
        dock={
          <>
            <Button variant="secondary" block onClick={() => setSuggestions(null)}>
              Cancel
            </Button>
            <Button
              variant="ok"
              size="lg"
              block
              onClick={() => {
                onAddSlots(suggestions);
                setSuggestions(null);
              }}
            >
              Add {suggestions.length} {suggestions.length === 1 ? "entry" : "entries"}
            </Button>
          </>
        }
      >
        <div className="headrow">
          <h2 style={{ color: "var(--ok-strong)" }}>From your calendar</h2>
        </div>
        <div className="muted" style={{ fontSize: 12.5, margin: "3px 2px 0" }}>
          Free times — tap any to drop it
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {suggestions.map((s) => (
            <SlotCard
              key={s.start}
              label={`${weekdayShort(s.start, tz)} ${dayNumber(s.start, tz)} · ${formatTimeRange(s.start, s.end, tz)}`}
              selected
              green
              onToggle={() =>
                setSuggestions((prev) => prev!.filter((x) => x.start !== s.start))
              }
            />
          ))}
        </div>
      </AppShell>
    );
  }

  // ---- normal picking mode ----
  return (
    <AppShell
      topbar={<Topbar onBack={onBack} trailing={<Stepper total={2} current={2} label="2/2" />} />}
      dock={
        <>
          <Button
            variant="secondary"
            block
            onClick={onConfirm}
            disabled={slots.length === 0 || confirming}
          >
            {confirming ? "Confirming…" : "Confirm"}
          </Button>
          <Button variant="primary" size="lg" block onClick={() => setSheet("menu")}>
            + Add times
          </Button>
        </>
      }
    >
      {days.length > 0 && (
        <DateStrip
          days={days.map((d) => ({ key: d.key, weekday: d.weekday, day: d.day, count: d.count }))}
          selected={selectedDay}
          onSelect={setSelectedDay}
        />
      )}

      <div className="headrow">
        <h2>Select times</h2>
        {current && (
          <span className="muted" style={{ fontSize: 12.5 }}>
            {current.count} picked
          </span>
        )}
      </div>

      {current ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {current.slots.map((s) => {
            const label = formatTimeRange(s.start, s.end, tz);
            return (
              <SlotCard
                key={s.start}
                label={label}
                trailing={
                  <button
                    type="button"
                    className="trash"
                    aria-label={`Remove ${label}`}
                    onClick={() => onRemoveSlot(s.start)}
                  >
                    <TrashIcon />
                  </button>
                }
              />
            );
          })}
        </div>
      ) : (
        <p className="sub" style={{ marginTop: 8 }}>
          No times yet — add some with <b>+ Add times</b>.
        </p>
      )}

      <AddSheets
        open={sheet}
        onClose={() => setSheet(null)}
        setSheet={setSheet}
        tz={tz}
        slotLengthMin={slotLengthMin}
        now={now}
        selectedDay={selectedDay || todayKey(tz, now)}
        onAddSlots={(s) => {
          onAddSlots(s);
          setSheet(null);
        }}
        onRequestCalendar={async (config) => {
          const result = await requestCalendarSuggestions(config);
          setSheet(null);
          if (result && result.length) setSuggestions(result);
        }}
      />
    </AppShell>
  );
}

function AddSheets({
  open,
  onClose,
  setSheet,
  tz,
  slotLengthMin,
  now,
  selectedDay,
  onAddSlots,
  onRequestCalendar,
}: {
  open: Sheet;
  onClose: () => void;
  setSheet: (s: Sheet) => void;
  tz: string;
  slotLengthMin: number;
  now: Date;
  selectedDay: string;
  onAddSlots: (slots: DraftSlot[]) => void;
  onRequestCalendar: (config: CalendarConfig) => void;
}) {
  return (
    <>
      <BottomSheet open={open === "menu"} onClose={onClose} title="Add times" subtitle="How do you want to add slots?">
        <button type="button" className="sheet-opt" onClick={() => setSheet("calendar")}>
          <span className="ico">📅</span>
          <span className="txt">
            <b>Check my calendar</b>
            <span>Suggest the times you&apos;re free</span>
          </span>
          <span className="chev">›</span>
        </button>
        <button type="button" className="sheet-opt" onClick={() => setSheet("single")}>
          <span className="ico">➕</span>
          <span className="txt">
            <b>Add a single time</b>
            <span>Pick one slot</span>
          </span>
          <span className="chev">›</span>
        </button>
        <button type="button" className="sheet-opt" onClick={() => setSheet("range")}>
          <span className="ico">🗂</span>
          <span className="txt">
            <b>Add multiple times</b>
            <span>A range across the days you pick</span>
          </span>
          <span className="chev">›</span>
        </button>
        <div className="sheet-opt is-disabled" aria-disabled="true">
          <span className="ico">✨</span>
          <span className="txt">
            <b>Ask AI</b>
            <span>Describe it in words</span>
          </span>
          <span className="soon">Soon</span>
        </div>
      </BottomSheet>

      <SingleSheet
        open={open === "single"}
        onClose={onClose}
        tz={tz}
        slotLengthMin={slotLengthMin}
        selectedDay={selectedDay}
        onAdd={onAddSlots}
      />
      <RangeSheet
        open={open === "range"}
        onClose={onClose}
        tz={tz}
        now={now}
        onAdd={onAddSlots}
      />
      <CalendarSheet
        open={open === "calendar"}
        onClose={onClose}
        tz={tz}
        slotLengthMin={slotLengthMin}
        now={now}
        onFind={onRequestCalendar}
      />
    </>
  );
}

function SingleSheet({
  open,
  onClose,
  tz,
  slotLengthMin,
  selectedDay,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  tz: string;
  slotLengthMin: number;
  selectedDay: string;
  onAdd: (slots: DraftSlot[]) => void;
}) {
  const [date, setDate] = useState(selectedDay);
  const [time, setTime] = useState("09:00");
  useEffect(() => {
    if (open) setDate(selectedDay);
  }, [open, selectedDay]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Add a single time">
      <label className="field" style={{ marginTop: 4 }}>
        <div className="lab">Day</div>
        <input
          className="input"
          type="date"
          aria-label="Day"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label className="field" style={{ marginTop: 12 }}>
        <div className="lab">Start time</div>
        <input
          className="input"
          type="time"
          aria-label="Start time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>
      <Button
        variant="ok"
        size="lg"
        block
        style={{ marginTop: 14 }}
        disabled={!date || !time}
        onClick={() => onAdd([slotAt(date, time, slotLengthMin, tz)])}
      >
        Add time
      </Button>
    </BottomSheet>
  );
}

function RangeSheet({
  open,
  onClose,
  tz,
  now,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  tz: string;
  now: Date;
  onAdd: (slots: DraftSlot[]) => void;
}) {
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [from, setFrom] = useState("14:00");
  const [to, setTo] = useState("16:00");
  const [interval, setInterval] = useState(30);

  const generated = useMemo(
    () =>
      generateSlots({
        weekdays,
        windowStart: from,
        windowEnd: to,
        intervalMin: interval,
        tz,
        from: now,
        horizonDays: 14,
      }),
    [weekdays, from, to, interval, tz, now],
  );

  const toggle = (n: number) =>
    setWeekdays((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  return (
    <BottomSheet open={open} onClose={onClose} title="Add multiple times" subtitle="Create a run of slots across the days you choose.">
      <div className="field" style={{ marginTop: 4 }}>
        <div className="lab">On which days</div>
        <div className="chips">
          {WEEKDAYS.map((d) => (
            <Chip key={d.n} selected={weekdays.includes(d.n)} onClick={() => toggle(d.n)}>
              {d.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <div className="lab" style={{ marginBottom: 7 }}>Time window</div>
        <div className="timewindow">
          <input className="input" type="time" aria-label="Window start" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span style={{ color: "var(--muted)" }}>–</span>
          <input className="input" type="time" aria-label="Window end" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <div className="lab" style={{ marginBottom: 7 }}>Every</div>
        <div className="chips">
          {[15, 30, 45, 60].map((n) => (
            <Chip key={n} selected={interval === n} onClick={() => setInterval(n)}>
              {n} min
            </Chip>
          ))}
        </div>
      </div>
      <div className="panel-soft" style={{ marginTop: 13, textAlign: "center", fontSize: 13 }}>
        <b>
          Adds {generated.length} {generated.length === 1 ? "slot" : "slots"}
        </b>
      </div>
      <Button variant="ok" size="lg" block style={{ marginTop: 12 }} disabled={generated.length === 0} onClick={() => onAdd(generated)}>
        Add {generated.length} {generated.length === 1 ? "slot" : "slots"}
      </Button>
    </BottomSheet>
  );
}

function CalendarSheet({
  open,
  onClose,
  tz,
  slotLengthMin,
  now,
  onFind,
}: {
  open: boolean;
  onClose: () => void;
  tz: string;
  slotLengthMin: number;
  now: Date;
  onFind: (config: CalendarConfig) => void;
}) {
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("17:00");

  const toggle = (n: number) =>
    setWeekdays((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  return (
    <BottomSheet open={open} onClose={onClose} title="Check your calendar" subtitle="We'll only suggest free times inside this range.">
      <div className="field" style={{ marginTop: 4 }}>
        <div className="lab">Which days</div>
        <div className="chips">
          {WEEKDAYS.map((d) => (
            <Chip key={d.n} selected={weekdays.includes(d.n)} onClick={() => toggle(d.n)}>
              {d.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <div className="lab" style={{ marginBottom: 7 }}>Working hours</div>
        <div className="timewindow">
          <input className="input" type="time" aria-label="Hours start" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span style={{ color: "var(--muted)" }}>–</span>
          <input className="input" type="time" aria-label="Hours end" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 10 }}>
        Looking at the next 2 weeks
      </div>
      <Button
        variant="ok"
        size="lg"
        block
        style={{ marginTop: 12 }}
        disabled={weekdays.length === 0}
        onClick={() =>
          onFind({
            weekdays,
            windowStart: from,
            windowEnd: to,
            intervalMin: slotLengthMin,
            tz,
            fromISO: now.toISOString(),
            horizonDays: 14,
          })
        }
      >
        Find free times
      </Button>
    </BottomSheet>
  );
}
