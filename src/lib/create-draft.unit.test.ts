import { describe, expect, test } from "vitest";
import {
  DRAFT_TTL_MS,
  beginNewDraft,
  emptyDraft,
  getActiveDraftId,
  isStale,
  loadDraft,
  resumeOrStartDraft,
  saveDraft,
  setActiveDraftId,
} from "@/lib/create-draft";

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  key(i: number) {
    return Array.from(this.m.keys())[i] ?? null;
  }
}

describe("create-draft store", () => {
  test("save/load round-trips a draft", () => {
    const s = new MemStorage();
    saveDraft(s, { ...emptyDraft("a", 1000), title: "Standup" });
    expect(loadDraft(s, "a")?.title).toBe("Standup");
  });

  test("namespaced ids do not stomp each other (concurrent drafts)", () => {
    const s = new MemStorage();
    saveDraft(s, { ...emptyDraft("a", 1000), title: "A" });
    saveDraft(s, { ...emptyDraft("b", 1000), title: "B" });
    expect(loadDraft(s, "a")?.title).toBe("A");
    expect(loadDraft(s, "b")?.title).toBe("B");
  });

  test("resumeOrStartDraft resumes a fresh active draft (survives refresh)", () => {
    const s = new MemStorage();
    const now = 10_000;
    saveDraft(s, { ...emptyDraft("a", now), title: "Resume me" });
    setActiveDraftId(s, "a");
    const resumed = resumeOrStartDraft(s, now + 1000);
    expect(resumed.id).toBe("a");
    expect(resumed.title).toBe("Resume me");
  });

  test("abandoned (stale) draft → fresh start", () => {
    const s = new MemStorage();
    saveDraft(s, { ...emptyDraft("old", 0), title: "Stale" });
    setActiveDraftId(s, "old");
    const fresh = resumeOrStartDraft(s, DRAFT_TTL_MS + 5000);
    expect(fresh.id).not.toBe("old");
    expect(fresh.title).toBe("");
    expect(loadDraft(s, "old")).toBeNull();
    expect(getActiveDraftId(s)).toBe(fresh.id);
  });

  test("beginNewDraft discards the active draft and starts fresh", () => {
    const s = new MemStorage();
    saveDraft(s, { ...emptyDraft("a", 1000), title: "Old" });
    setActiveDraftId(s, "a");
    const fresh = beginNewDraft(s, 2000);
    expect(fresh.id).not.toBe("a");
    expect(fresh.title).toBe("");
    expect(loadDraft(s, "a")).toBeNull();
    expect(getActiveDraftId(s)).toBe(fresh.id);
  });

  test("no active draft → creates and persists a fresh one", () => {
    const s = new MemStorage();
    const fresh = resumeOrStartDraft(s, 5000);
    expect(fresh.title).toBe("");
    expect(getActiveDraftId(s)).toBe(fresh.id);
    expect(loadDraft(s, fresh.id)).not.toBeNull();
  });

  test("isStale honours the TTL", () => {
    expect(isStale(emptyDraft("a", 0), DRAFT_TTL_MS - 1)).toBe(false);
    expect(isStale(emptyDraft("a", 0), DRAFT_TTL_MS + 1)).toBe(true);
  });
});
