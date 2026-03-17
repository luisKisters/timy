const KEY = "timy-identity";

export interface ParticipantRecord {
  id: string;
  name: string;
  selectedSlotIds: string[];
}

function load(): Record<string, ParticipantRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(data: Record<string, ParticipantRecord>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getIdentity(eventId: string): ParticipantRecord | null {
  return load()[eventId] ?? null;
}

export function saveIdentity(eventId: string, record: ParticipantRecord) {
  const data = load();
  data[eventId] = record;
  save(data);
}

export function clearIdentity(eventId: string) {
  const data = load();
  delete data[eventId];
  save(data);
}
