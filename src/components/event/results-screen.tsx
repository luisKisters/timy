"use client";

import { useState } from "react";
import {
  AppShell,
  AvatarStack,
  BottomSheet,
  Button,
  SlotCard,
  Topbar,
} from "@/components/timy";
import { formatDayLong, formatTimeRange, shareMessage } from "@/lib/domain";

export interface ScoredSlot {
  slotId: string;
  start: string;
  end: string;
  available: number;
  total: number;
  percentage: number;
}

export interface ResultsScreenProps {
  title: string;
  tz: string;
  /** Ranked slots, best first. */
  scores: ScoredSlot[];
  participants: { id: string; name: string }[];
  isAvailable: (participantId: string, slotId: string) => boolean;
  resolvedSlotId: string | null;
  confirming?: boolean;
  onConfirm: (slotId: string) => void;
  onChangeTime: () => void;
  onAddToCalendar: (slotId: string) => void;
  onShare?: (message: string) => void | Promise<void>;
  onCopy?: (message: string) => void | Promise<void>;
}

function slotLabel(s: ScoredSlot, tz: string): string {
  return `${formatDayLong(s.start, tz)} · ${formatTimeRange(s.start, s.end, tz)}`;
}

export function ResultsScreen(props: ResultsScreenProps) {
  const { title, tz, scores, participants, isAvailable, resolvedSlotId } = props;
  const [showMatrix, setShowMatrix] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const best = scores[0];
  const resolved = scores.find((s) => s.slotId === resolvedSlotId) ?? null;
  const changed = !!(resolved && best && resolved.slotId !== best.slotId);
  const peopleVoted = participants.length;

  const topbar = (
    <Topbar
      title={title}
      meta={`${peopleVoted} ${peopleVoted === 1 ? "person" : "people"} voted`}
      trailing={
        peopleVoted ? <AvatarStack people={participants.map((p) => ({ name: p.name }))} /> : undefined
      }
    />
  );

  // ---------- Confirmed ----------
  if (resolved) {
    const message = shareMessage({ title, startISO: resolved.start, tz, changed });
    const attendees = participants.filter((p) => isAvailable(p.id, resolved.slotId));
    return (
      <AppShell
        topbar={topbar}
        dock={
          <>
            <Button variant="secondary" block onClick={props.onChangeTime}>
              Change time
            </Button>
            {changed ? (
              <Button variant="primary" size="lg" block onClick={() => setShareOpen(true)}>
                📤 Share update
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                block
                onClick={() => props.onAddToCalendar(resolved.slotId)}
              >
                Add to calendar
              </Button>
            )}
          </>
        }
      >
        <div
          className="card"
          style={{
            background: "var(--ok-soft)",
            borderColor: "var(--ok-strong)",
            borderWidth: 2,
            padding: "20px 16px",
            textAlign: "center",
          }}
        >
          <div className="bigcheck" style={{ marginBottom: 12 }} aria-hidden="true">
            ✓
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span className="badge ok">Confirmed</span>
            {changed && <span className="badge warn">Time changed</span>}
          </div>
          <div className="h-lg" style={{ color: "var(--ok-strong)", marginBottom: 4 }}>
            {slotLabel(resolved, tz)}
          </div>
          <div style={{ fontSize: 13, color: "var(--ok-strong)", opacity: 0.8, marginBottom: 14 }}>
            {title}
          </div>
          {attendees.length > 0 && (
            <div className="avstack" style={{ justifyContent: "center" }}>
              {attendees.slice(0, 5).map((p, i) => (
                <div key={p.id} className={`av lg a${(i % 6) + 1}`} aria-hidden="true">
                  {(p.name.trim()[0] ?? "?").toUpperCase()}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--ok-strong)", opacity: 0.75, marginTop: 10 }}>
            {resolved.available === resolved.total && resolved.total > 0
              ? "Everyone is available"
              : `${resolved.available} of ${resolved.total} available`}
          </div>
          <button type="button" className="textlink" style={{ marginTop: 8 }} onClick={() => setShareOpen(true)}>
            📤 Share the time
          </button>
        </div>

        <div className="dayhead">
          <b style={{ color: "var(--muted)" }}>Other options</b>
          <span>not chosen</span>
        </div>
        {scores
          .filter((s) => s.slotId !== resolved.slotId)
          .map((s) => (
            <div key={s.slotId} style={{ opacity: 0.4, pointerEvents: "none" }}>
              <SlotCard
                label={slotLabel(s, tz)}
                meta={`${s.available} of ${s.total} available`}
              />
            </div>
          ))}

        <BottomSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title="Share the time"
          subtitle="Let everyone know it's locked in."
        >
          <div className="panel-soft" style={{ marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--fg-soft)" }}>
              {message}
            </p>
          </div>
          <Button
            variant="primary"
            block
            style={{ marginBottom: 9 }}
            onClick={async () => {
              if (props.onShare) await props.onShare(message);
              else if (typeof navigator !== "undefined" && navigator.share)
                await navigator.share({ title, text: message });
            }}
          >
            Share
          </Button>
          <Button
            variant="secondary"
            block
            onClick={async () => {
              if (props.onCopy) await props.onCopy(message);
              else await navigator.clipboard?.writeText(message);
            }}
          >
            Copy message
          </Button>
        </BottomSheet>
      </AppShell>
    );
  }

  // ---------- Matrix ----------
  if (showMatrix) {
    const cols = scores;
    return (
      <AppShell
        topbar={topbar}
        dock={
          <>
            <Button variant="secondary" block onClick={() => setShowMatrix(false)}>
              ← Back to best slot
            </Button>
            {best && (
              <Button
                variant="ok"
                size="lg"
                block
                disabled={props.confirming}
                onClick={() => props.onConfirm(best.slotId)}
              >
                Confirm {formatTimeRange(best.start, best.end, tz)}
              </Button>
            )}
          </>
        }
      >
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Emerald = available · best column highlighted
        </div>
        <div className="card" style={{ padding: 14, overflowX: "auto" }}>
          <table role="grid" style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
            <thead>
              <tr>
                <th />
                {cols.map((c, i) => (
                  <th
                    key={c.slotId}
                    style={{
                      padding: 5,
                      borderRadius: "var(--r-sm)",
                      background: i === 0 ? "var(--ok-soft)" : "var(--card-2)",
                      color: i === 0 ? "var(--ok-strong)" : "var(--fg-soft)",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {formatTimeRange(c.start, c.end, tz)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map((p, ri) => (
                <tr key={p.id}>
                  <td>
                    <div className={`av a${(ri % 6) + 1}`} style={{ width: 26, height: 26, fontSize: 11 }}>
                      {(p.name.trim()[0] ?? "?").toUpperCase()}
                    </div>
                  </td>
                  {cols.map((c) => (
                    <td key={c.slotId} style={{ padding: 2 }}>
                      <div
                        data-available={isAvailable(p.id, c.slotId) ? "1" : "0"}
                        style={{
                          height: 28,
                          borderRadius: "var(--r-sm)",
                          background: isAvailable(p.id, c.slotId) ? "var(--ok)" : "var(--bg)",
                          border: isAvailable(p.id, c.slotId)
                            ? "1.5px solid var(--ok-strong)"
                            : "1px solid var(--border)",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)" }}>Total</td>
                {cols.map((c) => (
                  <td key={c.slotId} style={{ textAlign: "center" }}>
                    <span className={`badge ${c.available === c.total && c.total > 0 ? "ok" : "gray"}`}>
                      {c.available}/{c.total}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </AppShell>
    );
  }

  // ---------- Best-slot hero (pre-confirm) ----------
  return (
    <AppShell
      topbar={topbar}
      dock={
        <>
          <Button variant="secondary" block onClick={() => setShowMatrix(true)}>
            See options matrix
          </Button>
          {best && (
            <Button
              variant="ok"
              size="lg"
              block
              disabled={props.confirming}
              onClick={() => props.onConfirm(best.slotId)}
            >
              Confirm {formatTimeRange(best.start, best.end, tz)}
            </Button>
          )}
        </>
      }
    >
      {best ? (
        <>
          <div className="slot is-best" style={{ flexDirection: "column", alignItems: "stretch", gap: 10, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div className="when" style={{ flex: 1 }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>
                  Best time
                </div>
                <b style={{ fontSize: 17, letterSpacing: "-0.02em" }}>{slotLabel(best, tz)}</b>
              </div>
              <div className="count">
                <b style={{ fontSize: 18, color: "var(--ok-strong)" }}>
                  {best.available}/{best.total}
                </b>
                <span>available</span>
              </div>
            </div>
            <div className="meter strong">
              <i style={{ width: `${best.percentage}%` }} />
            </div>
            <span className="badge ok">
              {best.available === best.total && best.total > 0
                ? `Everyone is available! · ${best.available}/${best.total}`
                : `${best.available} of ${best.total} available`}
            </span>
          </div>

          {scores.length > 1 && (
            <div className="dayhead" style={{ marginTop: 2 }}>
              <b>Other options</b>
              <span>ranked by availability</span>
            </div>
          )}
          {scores.slice(1).map((s) => (
            <SlotCard
              key={s.slotId}
              label={slotLabel(s, tz)}
              meta={`${s.available} of ${s.total} available`}
            />
          ))}
        </>
      ) : (
        <p className="sub" style={{ marginTop: 8 }}>
          No votes yet — share the poll so people can fill in their availability.
        </p>
      )}
    </AppShell>
  );
}
