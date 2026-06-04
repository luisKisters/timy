"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AppShell, Button, DateStrip, SlotCard, Stepper, Topbar } from "@/components/timy";
import { collapseOut } from "@/lib/motion";
import {
  dayKey,
  dayNumber,
  formatDayLong,
  formatTimeRange,
  weekdayShort,
} from "@/lib/domain";
import type { DraftSlot } from "@/lib/create-draft";

export interface ReviewScreenProps {
  title: string;
  tz: string;
  slots: DraftSlot[];
  onRemoveSlot: (start: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  confirming?: boolean;
}

export function ReviewScreen({
  title,
  tz,
  slots,
  onRemoveSlot,
  onBack,
  onConfirm,
  confirming,
}: ReviewScreenProps) {
  const reduced = useReducedMotion();

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

  const [selectedDay, setSelectedDay] = useState(days[0]?.key ?? "");
  useEffect(() => {
    if (days.length && !days.some((d) => d.key === selectedDay)) {
      setSelectedDay(days[0].key);
    }
  }, [days, selectedDay]);

  const current = days.find((d) => d.key === selectedDay);
  const meta = `${slots.length} ${slots.length === 1 ? "time" : "times"} · ${days.length} ${days.length === 1 ? "day" : "days"}`;

  return (
    <AppShell
      topbar={
        <Topbar
          onBack={onBack}
          title={title || "Review"}
          meta={meta}
          trailing={<Stepper total={3} current={3} />}
        />
      }
      dock={
        <>
          <Button variant="secondary" block onClick={onBack}>
            ← Back
          </Button>
          <Button
            variant="primary"
            size="lg"
            block
            disabled={slots.length === 0 || confirming}
            onClick={onConfirm}
          >
            {confirming ? "Confirming…" : "Confirm"}
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

      {current ? (
        <>
          <div className="dayhead" style={{ marginTop: 2 }}>
            <b>{formatDayLong(current.slots[0].start, tz)}</b>
            <span>
              {current.count} {current.count === 1 ? "time" : "times"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <AnimatePresence initial={false}>
              {current.slots.map((s) => {
                const label = formatTimeRange(s.start, s.end, tz);
                return (
                  <motion.div
                    key={s.start}
                    variants={collapseOut(reduced)}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    style={{ overflow: "hidden" }}
                  >
                    <SlotCard
                      label={label}
                      trailing={
                        <button
                          type="button"
                          className="trash"
                          aria-label={`Remove ${label}`}
                          onClick={() => onRemoveSlot(s.start)}
                        >
                          🗑
                        </button>
                      }
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <p className="sub" style={{ marginTop: 8 }}>
          No times left — go back and add some.
        </p>
      )}
    </AppShell>
  );
}
