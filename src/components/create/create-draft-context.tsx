"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  beginNewDraft,
  clearDraft,
  type CreateDraft,
  emptyDraft,
  generateDraftId,
  resumeOrStartDraft,
  saveDraft,
} from "@/lib/create-draft";

interface CreateDraftContextValue {
  draft: CreateDraft;
  /** True once sessionStorage has been read on the client. */
  ready: boolean;
  update: (patch: Partial<CreateDraft>) => void;
  /** Clear the current draft and start a fresh one (e.g. after submit). */
  reset: () => void;
}

const CreateDraftContext = createContext<CreateDraftContextValue | null>(null);

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function CreateDraftProvider({ children }: { children: React.ReactNode }) {
  // Stable default for SSR / first paint; replaced on client hydration.
  const [draft, setDraft] = useState<CreateDraft>(() => emptyDraft("pending", 0));
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const storage = getStorage();
    if (storage) setDraft(resumeOrStartDraft(storage, Date.now()));
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<CreateDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      const storage = getStorage();
      if (storage && hydrated.current) saveDraft(storage, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setDraft((prev) => {
      const storage = getStorage();
      if (storage) {
        clearDraft(storage, prev.id);
        return beginNewDraft(storage, Date.now());
      }
      return emptyDraft(generateDraftId(), Date.now());
    });
  }, []);

  return (
    <CreateDraftContext.Provider value={{ draft, ready, update, reset }}>
      {children}
    </CreateDraftContext.Provider>
  );
}

export function useCreateDraft(): CreateDraftContextValue {
  const ctx = useContext(CreateDraftContext);
  if (!ctx) {
    throw new Error("useCreateDraft must be used within <CreateDraftProvider>");
  }
  return ctx;
}
