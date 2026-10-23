// Starts a fresh local Supabase for the browser tests and loads the app's database into it:
// schema.sql, the service catalog seed, then every migration in name order (so the tests also prove
// the migrations still apply cleanly). Writes the local URL and keys to e2e/.env.e2e for Playwright.
// Needs Docker. Run with: npm run e2e:db
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(e2eDir);
const cli = ["--yes", "supabase@2.121.0"];
const supabase = (args, options = {}) => execFileSync("npx", [...cli, ...args, "--workdir", e2eDir], options);

// A clean database every run, so leftovers from earlier runs never change the results.
spawnSync("npx", [...cli, "stop", "--no-backup", "--workdir", e2eDir], { stdio: "ignore" });

// The live project signs tokens with an ES256 key; the test stack does too, so getClaims() takes the same path.
const keysFile = path.join(e2eDir, "supabase", "signing_keys.json");
if (!fs.existsSync(keysFile)) {
  fs.writeFileSync(keysFile, "[]");
  supabase(["gen", "signing-key", "--algorithm", "ES256", "--append"], { stdio: "ignore" });
}

supabase(["start", "-x", "imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor"], {
  stdio: "inherit",
});
const status = JSON.parse(supabase(["status", "-o", "json"], { encoding: "utf8" }).match(/\{[\s\S]*\}/)[0]);

const sqlDir = path.join(root, "backend", "supabase");
const migrations = fs
  .readdirSync(path.join(sqlDir, "migrations"))
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => path.join("migrations", file));
for (const file of ["schema.sql", "seed-services-catalog.sql", ...migrations]) {
  process.stdout.write(`Loading ${file}… `);
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      // Warnings only: the re-runnable SQL files print an "already exists, skipping" notice per object.
      "-e",
      "PGOPTIONS=-c client_min_messages=warning",
      "supabase_db_techjest-e2e",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
    ],
    { input: fs.readFileSync(path.join(sqlDir, file)), stdio: ["pipe", "ignore", "inherit"] },
  );
  console.log("done");
}

fs.writeFileSync(
  path.join(e2eDir, ".env.e2e"),
  [
    `E2E_SUPABASE_URL=${status.API_URL}`,
    `E2E_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}`,
    `E2E_SUPABASE_SECRET_KEY=${status.SECRET_KEY}`,
    `E2E_MAILPIT_URL=${status.MAILPIT_URL ?? status.INBUCKET_URL}`,
    "",
  ].join("\n"),
);
console.log("Local Supabase is ready for npm run test:e2e.");
