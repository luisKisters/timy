const KEY = "timy_recent_events";
const MAX = 5;

export interface RecentEvent {
  id: string;
  title: string;
  visitedAt: number;
  /** Participant names/initials for the avatar stack (optional). */
  participants?: string[];
  /** Total participants (may exceed participants.length). */
  participantCount?: number;
  /** Lifecycle hint shown as the status line. */
  state?: "voting" | "confirmed";
}

export function getRecentEvents(): RecentEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRecentEvent(event: Omit<RecentEvent, "visitedAt">) {
  if (typeof window === "undefined") return;
  const existing = getRecentEvents();
  const prev = existing.find((e) => e.id === event.id);
  const rest = existing.filter((e) => e.id !== event.id);
  // Merge so re-visiting with partial data keeps previously captured fields.
  const next: RecentEvent[] = [
    { ...prev, ...event, visitedAt: Date.now() },
    ...rest,
  ].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}
