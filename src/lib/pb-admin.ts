import PocketBase from "pocketbase";

/**
 * Server-side PocketBase client authenticated as a superuser.
 *
 * Auth resolution (lazy, per call, so tests can point this anywhere):
 *  1. POCKETBASE_AUTH_TOKEN — a pre-generated superuser token (prod default), or
 *  2. POCKETBASE_ADMIN_EMAIL + POCKETBASE_ADMIN_PASSWORD — authenticate on demand
 *     (the easy local/E2E path; no token to hand-generate).
 */
// Cache the credential-auth token per process so we don't re-authenticate on
// every call (avoids latency + auth rate limits).
const tokenCache = new Map<string, string>();

export async function getPocketBaseAdmin(): Promise<PocketBase> {
  const url = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
  const pb = new PocketBase(url);

  const token = process.env.POCKETBASE_AUTH_TOKEN;
  if (token) {
    pb.authStore.save(token);
    return pb;
  }

  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;
  if (email && password) {
    const key = `${url}|${email}`;
    const cached = tokenCache.get(key);
    if (cached) {
      pb.authStore.save(cached);
      return pb;
    }
    await pb.collection("_superusers").authWithPassword(email, password);
    tokenCache.set(key, pb.authStore.token);
    return pb;
  }

  return pb;
}
