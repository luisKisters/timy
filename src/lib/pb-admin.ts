import PocketBase from "pocketbase";

/**
 * Server-side PocketBase client authenticated with a superuser token.
 *
 * Env is read lazily (per call, not at module load) so tests can point this at
 * a throwaway instance and inject a token before the first repo call.
 */
export function getPocketBaseAdmin(): PocketBase {
  const url = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
  const token = process.env.POCKETBASE_AUTH_TOKEN || "";
  const pb = new PocketBase(url);
  if (token) pb.authStore.save(token);
  return pb;
}
