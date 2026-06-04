import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const PID_FILE = path.join(process.cwd(), ".pb-test", "e2e-pb.pid");

export default async function globalTeardown() {
  if (!existsSync(PID_FILE)) return;
  const pid = Number(readFileSync(PID_FILE, "utf8").trim());
  try {
    if (pid) process.kill(pid);
  } catch {
    // already gone
  }
  rmSync(PID_FILE, { force: true });
}
