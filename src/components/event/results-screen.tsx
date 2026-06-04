"use client";

import { useState } from "react";
import {
  AppShell,
  AvatarStack,
  BottomSheet,
  Button,
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
  /** Invite link surfaced when there's no favorite yet. */
  inviteUrl?: string;
  /** Share the invite to bring more voters (Web Share API → clipboard fallback). */
  onShareInvite?: () => void | Promise<void>;
}

function slotLabel(s: ScoredSlot, tz: string): string {
  return `${formatDayLong(s.start, tz)} · ${formatTimeRange(s.start, s.end, tz)}`;
}

/** "Everyone is available" only makes sense with 2+ voters; else show the count. */
function availLine(s: ScoredSlot): string {
  if (s.total >= 2 && s.available === s.total) return "Everyone is available";
  return `${s.available} of ${s.total} available`;
}

/** A tappable option card — tap anywhere on it to pick that slot as the time. */
function OptionCard({
  s,
  tz,
  onPick,
  best,
}: {
  s: ScoredSlot;
  tz: string;
  onPick: (slotId: string) => void;
  best?: boolean;
}) {
  return (
    <button type="button" className="slot" onClick={() => onPick(s.slotId)}>
      <span className="when">
        <b>{slotLabel(s, tz)}</b>
        <span>{availLine(s)}</span>
      </span>
      {best ? (
        <span className="badge ok">Best time</span>
      ) : (
        <span className="count">
          <b style={{ color: "var(--ok-strong)" }}>
            {s.available}/{s.total}
          </b>
          <span>free</span>
        </span>
      )}
    </button>
  );
}

export function ResultsScreen(props: ResultsScreenProps) {
  const { title, tz, scores, participants, isAvailable, resolvedSlotId } = props;
  const [showMatrix, setShowMatrix] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const best = scores[0];
  const resolved = scores.find((s) => s.slotId === resolvedSlotId) ?? null;
  const changed = !!(resolved && best && resolved.slotId !== best.slotId);
  const peopleVoted = participants.length;
  // A "favorite" only means something once more than one person has weighed in.
  const hasFavorite = peopleVoted >= 2 && !!best;

  const topbar = (
    <Topbar
      title={title}
      meta={`${peopleVoted} ${peopleVoted === 1 ? "person" : "people"} voted`}
      trailing={
        peopleVoted ? <AvatarStack people={participants.map((p) => ({ name: p.name }))} /> : undefined
      }
    />
  );

  const handleShareInvite = async () => {
    if (props.onShareInvite) {
      await props.onShareInvite();
      return;
    }
    const text = `Join "${title}" — find a time`;
    try {
      if (typeof navigator !== "undefined" && navigator.share && props.inviteUrl) {
        await navigator.share({ title, text, url: props.inviteUrl });
      } else if (props.inviteUrl) {
        await navigator.clipboard?.writeText(props.inviteUrl);
      }
    } catch {
      /* share cancelled — no-op */
    }
  };

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
            {availLine(resolved)}
          </div>
          <button type="button" className="textlink" style={{ marginTop: 8 }} onClick={() => setShareOpen(true)}>
            📤 Share the time
          </button>
        </div>

        <div className="dayhead">
          <b style={{ color: "var(--muted)" }}>Other options</b>
          <span>tap to switch</span>
        </div>
        {scores
          .filter((s) => s.slotId !== resolved.slotId)
          .map((s) => (
            <OptionCard
              key={s.slotId}
              s={s}
              tz={tz}
              onPick={props.onConfirm}
              best={!!best && s.slotId === best.slotId}
            />
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
              ← Back to overview
            </Button>
            {hasFavorite && best ? (
              <Button
                variant="ok"
                size="lg"
                block
                disabled={props.confirming}
                onClick={() => props.onConfirm(best.slotId)}
              >
                Confirm {formatTimeRange(best.start, best.end, tz)}
              </Button>
            ) : (
              <Button variant="primary" size="lg" block onClick={handleShareInvite}>
                ⤴ Share
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

  // ---------- Overview (pre-confirm) ----------
  return (
    <AppShell
      topbar={topbar}
      dock={
        <>
          <Button variant="secondary" block onClick={() => setShowMatrix(true)}>
            See options matrix
          </Button>
          {hasFavorite && best ? (
            <Button
              variant="ok"
              size="lg"
              block
              disabled={props.confirming}
              onClick={() => props.onConfirm(best.slotId)}
            >
              Confirm {formatTimeRange(best.start, best.end, tz)}
            </Button>
          ) : (
            <Button variant="primary" size="lg" block onClick={handleShareInvite}>
              ⤴ Share
            </Button>
          )}
        </>
      }
    >
      {hasFavorite && best ? (
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
              {best.total >= 2 && best.available === best.total
                ? `Everyone is available! · ${best.available}/${best.total}`
                : `${best.available} of ${best.total} available`}
            </span>
          </div>

          {scores.length > 1 && (
            <div className="dayhead" style={{ marginTop: 2 }}>
              <b>Other options</b>
              <span>tap to pick · ranked by availability</span>
            </div>
          )}
          {scores.slice(1).map((s) => (
            <OptionCard key={s.slotId} s={s} tz={tz} onPick={props.onConfirm} />
          ))}
        </>
      ) : (
        <>
          <div className="empty-hero">
            <b>No favorite yet</b>
            <span>Invite more people so a best time can emerge.</span>
          </div>
          {scores.length > 0 && (
            <div className="dayhead" style={{ marginTop: 2 }}>
              <b>Pick a time</b>
              <span>or wait for more votes</span>
            </div>
          )}
          {scores.map((s) => (
            <OptionCard key={s.slotId} s={s} tz={tz} onPick={props.onConfirm} />
          ))}
        </>
      )}
    </AppShell>
  );
}
