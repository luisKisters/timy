"use client";

import { AppShell, AvatarStack, Button } from "@/components/timy";
import type { RecentEvent } from "@/lib/recent-events";

function statusLabel(r: RecentEvent): string {
  if (r.state === "confirmed") return "Confirmed";
  if (typeof r.participantCount === "number") {
    return r.participantCount === 1 ? "1 voted" : `${r.participantCount} voted`;
  }
  return "In progress";
}

export interface HomeScreenProps {
  recents: RecentEvent[];
  onCreate: () => void;
  onOpenRecent: (id: string) => void;
}

export function HomeScreen({ recents, onCreate, onOpenRecent }: HomeScreenProps) {
  const hasRecents = recents.length > 0;

  return (
    <AppShell
      center={!hasRecents}
      dock={
        <Button variant="primary" size="lg" block onClick={onCreate}>
          Create meeting
        </Button>
      }
    >
      <div
        className="center-col"
        style={{ paddingTop: hasRecents ? 28 : 0, paddingBottom: 8 }}
      >
        <div className="brandmark" style={{ fontSize: 24, gap: 10 }}>
          <span
            className="glyph"
            style={{ width: 34, height: 34, fontSize: 19, borderRadius: 12 }}
            aria-hidden="true"
          >
            ◷
          </span>
          <span>Timy</span>
        </div>
        <p className="sub" style={{ textAlign: "center", marginTop: 10, maxWidth: "22ch" }}>
          Find the perfect time to meet
        </p>
      </div>

      {hasRecents && (
        <section aria-label="Recent meetings">
          <div className="eyebrow" style={{ margin: "0 2px 10px" }}>
            Recent
          </div>
          <div className="card flush">
            <div className="rows">
              {recents.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="row"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                  }}
                  onClick={() => onOpenRecent(r.id)}
                >
                  <AvatarStack
                    people={(r.participants ?? [r.title]).map((name) => ({ name }))}
                    max={4}
                  />
                  <span style={{ flex: 1, minWidth: 0, marginLeft: 4 }}>
                    <span
                      className="h-md"
                      style={{
                        fontSize: 14,
                        display: "block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.title}
                    </span>
                    <span
                      className="muted"
                      style={{ fontSize: 12, marginTop: 2, display: "block" }}
                    >
                      {statusLabel(r)}
                    </span>
                  </span>
                  <span aria-hidden="true" style={{ fontSize: 15, color: "var(--muted-2)" }}>
                    ›
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
