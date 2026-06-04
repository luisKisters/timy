import type { ExpiryOption } from "@/lib/domain/expiry";

/**
 * Create-wizard draft state, persisted to a `Storage` (sessionStorage in the
 * app). Storage is injected so the store is unit-testable in node.
 *
 * Keys are namespaced by a generated draft id (`timy:create-draft:<id>`) with a
 * pointer at `timy:create-draft:active`. sessionStorage is already per-tab, and
 * the id namespacing means concurrent drafts never stomp each other.
 */

export interface DraftSlot {
  start: string;
  end: string;
}

export interface CreateDraft {
  id: string;
  title: string;
  hostName: string;
  expiry: ExpiryOption;
  slotLengthMin: number;
  /** Event timezone (defaults to the host's). */
  tz: string;
  slots: DraftSlot[];
  createdAt: number;
}

const NS = "timy:create-draft";
const ACTIVE_KEY = `${NS}:active`;
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function draftKey(id: string): string {
  return `${NS}:${id}`;
}

export function defaultTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function generateDraftId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `d-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function emptyDraft(id: string, now: number, tz: string = defaultTz()): CreateDraft {
  return {
    id,
    title: "",
    hostName: "",
    expiry: "3 days",
    slotLengthMin: 30,
    tz,
    slots: [],
    createdAt: now,
  };
}

export function loadDraft(storage: Storage, id: string): CreateDraft | null {
  const raw = storage.getItem(draftKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CreateDraft;
  } catch {
    return null;
  }
}

export function saveDraft(storage: Storage, draft: CreateDraft): void {
  storage.setItem(draftKey(draft.id), JSON.stringify(draft));
}

export function getActiveDraftId(storage: Storage): string | null {
  return storage.getItem(ACTIVE_KEY);
}

export function setActiveDraftId(storage: Storage, id: string): void {
  storage.setItem(ACTIVE_KEY, id);
}

export function clearDraft(storage: Storage, id: string): void {
  storage.removeItem(draftKey(id));
  if (getActiveDraftId(storage) === id) storage.removeItem(ACTIVE_KEY);
}

export function isStale(draft: CreateDraft, now: number, ttl: number = DRAFT_TTL_MS): boolean {
  return now - draft.createdAt > ttl;
}

/** Resume the active draft if fresh, else discard it and start a new one. */
export function resumeOrStartDraft(storage: Storage, now: number): CreateDraft {
  const activeId = getActiveDraftId(storage);
  if (activeId) {
    const existing = loadDraft(storage, activeId);
    if (existing && !isStale(existing, now)) return existing;
    if (existing) clearDraft(storage, activeId);
  }
  const fresh = emptyDraft(generateDraftId(), now);
  saveDraft(storage, fresh);
  setActiveDraftId(storage, fresh.id);
  return fresh;
}

/** Begin a brand-new draft (Home → Create), discarding any active one. */
export function beginNewDraft(storage: Storage, now: number): CreateDraft {
  const activeId = getActiveDraftId(storage);
  if (activeId) clearDraft(storage, activeId);
  const fresh = emptyDraft(generateDraftId(), now);
  saveDraft(storage, fresh);
  setActiveDraftId(storage, fresh.id);
  return fresh;
}
