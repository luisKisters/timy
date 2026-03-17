import PocketBase from "pocketbase";

const POCKETBASE_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const POCKETBASE_AUTH_TOKEN = process.env.POCKETBASE_AUTH_TOKEN || "";

export function getPocketBaseAdmin() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.authStore.save(POCKETBASE_AUTH_TOKEN);
  return pb;
}
