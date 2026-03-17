const KEY = "timy_recent_events";
const MAX = 5;

export interface RecentEvent {
  id: string;
  title: string;
  visitedAt: number;
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
  const existing = getRecentEvents().filter((e) => e.id !== event.id);
  const next: RecentEvent[] = [{ ...event, visitedAt: Date.now() }, ...existing].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}
