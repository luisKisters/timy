import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import PocketBase from "pocketbase";
import {
  applyAccessRules,
  ensureBatchEnabled,
  ensureCollections,
} from "../../src/server/pb-schema";

export const E2E_PB = {
  port: 8099,
  url: "http://127.0.0.1:8099",
  email: "e2e@timy.local",
  password: "password1234",
};

const ROOT = process.cwd();
const PB_DIR = path.join(ROOT, ".pb-test");
const PB_BIN = path.join(PB_DIR, "pocketbase");
const DATA = path.join(PB_DIR, "e2e_data");
const PID_FILE = path.join(PB_DIR, "e2e-pb.pid");
const PB_VERSION = "0.39.1";

async function reachable(): Promise<boolean> {
  try {
    const res = await fetch(`${E2E_PB.url}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

function downloadPocketBase() {
  const platform = process.platform === "darwin" ? "darwin" : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "amd64";
  const zip = path.join(PB_DIR, "pb.zip");
  mkdirSync(PB_DIR, { recursive: true });
  const url = `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${platform}_${arch}.zip`;
  execFileSync("curl", ["-sL", "-o", zip, url]);
  execFileSync("unzip", ["-o", "-q", zip, "-d", PB_DIR]);
  execFileSync("chmod", ["+x", PB_BIN]);
}

export default async function globalSetup() {
  if (!(await reachable())) {
    if (!existsSync(PB_BIN)) downloadPocketBase();
    execFileSync(PB_BIN, ["superuser", "upsert", E2E_PB.email, E2E_PB.password, "--dir", DATA]);
    const child = spawn(PB_BIN, ["serve", `--http=127.0.0.1:${E2E_PB.port}`, "--dir", DATA], {
      stdio: "ignore",
      detached: true,
    });
    child.unref();
    if (child.pid) writeFileSync(PID_FILE, String(child.pid));
    for (let i = 0; i < 60; i++) {
      if (await reachable()) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  const pb = new PocketBase(E2E_PB.url);
  await pb.collection("_superusers").authWithPassword(E2E_PB.email, E2E_PB.password);
  await ensureCollections(pb);
  await ensureBatchEnabled(pb);
  await applyAccessRules(pb);
}
