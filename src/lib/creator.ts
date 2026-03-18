export function saveCreator(eventId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`timy-creator-${eventId}`, "1");
}

export function getIsCreator(eventId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`timy-creator-${eventId}`) === "1";
}
