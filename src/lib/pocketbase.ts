import PocketBase from "pocketbase";

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.POCKETBASE_URL || "http://127.0.0.1:8090";

let pb: PocketBase;

export function getPocketBase() {
  if (typeof window !== "undefined") {
    // Client-side: create singleton
    if (!pb) {
      pb = new PocketBase(POCKETBASE_URL);
    }
    return pb;
  }
  // Server-side: always create new instance
  return new PocketBase(POCKETBASE_URL);
}
