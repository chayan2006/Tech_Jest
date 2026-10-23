// Stops the browser tests' local Supabase and deletes its data. Run with: npm run e2e:db:stop
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
execFileSync("npx", ["--yes", "supabase@2.121.0", "stop", "--no-backup", "--workdir", e2eDir], { stdio: "inherit" });
