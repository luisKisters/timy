/**
 * PocketBase access-rule gate.
 *
 * Today all four collections ship with OPEN rules (see src/server/pb-schema.ts)
 * because every read happens in a server component and every write goes through
 * a server action using the superuser admin client (src/lib/pb-admin.ts) — the
 * browser never talks to PocketBase directly. The open rules are therefore not
 * a functional dependency, just an un-tightened default.
 *
 * Phase 11 flips RULES_TIGHTENED → true and applies the restricted rules below
 * as a pre-release gate (at minimum: lock down list + delete). It lives here so
 * the intended end-state is documented and the gate is testable now.
 */
export const RULES_TIGHTENED = false;

/**
 * Target rules for Phase 11. `null` = superuser-only (admin client still works
 * because it bypasses rules). Records are fetched by id from the server, so
 * public `list` is not required; `view` stays open so invite links resolve.
 */
export const TARGET_RULES: Record<
  "events" | "time_slots" | "participants" | "votes",
  {
    listRule: string | null;
    viewRule: string | null;
    createRule: string | null;
    updateRule: string | null;
    deleteRule: string | null;
  }
> = {
  events: { listRule: null, viewRule: "", createRule: null, updateRule: null, deleteRule: null },
  time_slots: { listRule: "", viewRule: "", createRule: null, updateRule: null, deleteRule: null },
  participants: { listRule: "", viewRule: "", createRule: null, updateRule: null, deleteRule: null },
  votes: { listRule: "", viewRule: "", createRule: null, updateRule: null, deleteRule: null },
};
