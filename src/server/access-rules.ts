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
 * (see applyAccessRules in pb-schema.ts) as a pre-release gate. It lives here so
 * the intended end-state is documented and the gate is testable.
 */
export const RULES_TIGHTENED = true;

/**
 * Target rules. `null` = superuser-only (the admin client still works because it
 * bypasses rules; the browser never talks to PocketBase directly). list/create/
 * update/delete are all locked; `view` stays open so a single record resolves by
 * id if a future client read is ever added.
 */
const RESTRICTED = {
  listRule: null,
  viewRule: "",
  createRule: null,
  updateRule: null,
  deleteRule: null,
} as const;

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
  events: { ...RESTRICTED },
  time_slots: { ...RESTRICTED },
  participants: { ...RESTRICTED },
  votes: { ...RESTRICTED },
};
