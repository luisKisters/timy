import PocketBase from "pocketbase";
import { ensureCollections, ensureBatchEnabled } from "../src/server/pb-schema";

const POCKETBASE_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const POCKETBASE_AUTH_TOKEN = process.env.POCKETBASE_AUTH_TOKEN || "";

async function main() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.authStore.save(POCKETBASE_AUTH_TOKEN);

  console.log(`Connected to PocketBase at ${POCKETBASE_URL}`);
  await ensureCollections(pb);
  await ensureBatchEnabled(pb);
  console.log("All collections set up and batch API enabled.");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
