/**
 * Push the committed site content into the CMS, and make the first admin.
 *
 *   bun run cms:seed                      seed content only
 *   bun run cms:seed you@example.com      seed content and make that an owner
 *
 * Uses the service role key, because seeding writes to `cms_documents` and
 * `admins`, and both are closed to everyone but an existing admin — which,
 * the first time this runs, is nobody. That chicken-and-egg is exactly what a
 * service key is for, and it is why this is a script you run from a terminal
 * rather than a button in a UI that does not exist yet.
 *
 * Safe to run more than once. Content rows are upserted, so re-running
 * restores anything an editor has broken back to what the repository says.
 * The admin row is left alone if it already exists — re-seeding must not
 * silently demote an owner to an editor.
 *
 * Reads the seed values by asking Vite to build `src/cms/seeds.ts`, so there
 * is exactly one definition of the site's content and this script cannot
 * drift from what the app renders.
 */
import { createClient } from "@supabase/supabase-js";
import { build } from "vite";
import { readFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

function env(name) {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  if (!line) return "";
  return line
    .slice(name.length + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const url = process.env.VITE_SUPABASE_URL || env("VITE_SUPABASE_URL");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env("SUPABASE_SERVICE_ROLE_KEY");

if (!url) {
  console.error("VITE_SUPABASE_URL is not set in .env");
  process.exit(1);
}
if (!serviceKey) {
  console.error(
    [
      "SUPABASE_SERVICE_ROLE_KEY is not set in .env.",
      "",
      "Seeding writes to tables that only an admin may write to, and on a fresh",
      "database there is no admin yet — so this needs the service key once.",
      "",
      "  Supabase dashboard → Project Settings → API keys → service_role",
      "",
      "Paste it into .env as SUPABASE_SERVICE_ROLE_KEY and run this again.",
      "Never give it a VITE_ prefix: that would ship it to the browser.",
    ].join("\n"),
  );
  process.exit(1);
}

/* Bundle seeds.ts to plain JS so this script and the app cannot disagree
 * about what the site's content is. */
const outDir = resolve(process.cwd(), ".cms-seed-build");
mkdirSync(outDir, { recursive: true });

console.log("Building seed data from src/cms/seeds.ts…");
await build({
  logLevel: "error",
  configFile: false,
  resolve: { alias: { "@": resolve(process.cwd(), "src") } },
  build: {
    outDir,
    emptyOutDir: true,
    ssr: true,
    lib: { entry: resolve(process.cwd(), "src/cms/seeds.ts"), formats: ["es"], fileName: "seeds" },
    rollupOptions: { external: [] },
  },
});

const { seeds } = await import(`file://${resolve(outDir, "seeds.js")}`);
const keys = Object.keys(seeds);
console.log(`Found ${keys.length} documents.\n`);

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let ok = 0;
for (const key of keys) {
  const { error } = await supabase
    .from("cms_documents")
    .upsert({ key, data: seeds[key], updated_by: "seed" }, { onConflict: "key" });
  if (error) {
    console.error(`  ✗ ${key}: ${error.message}`);
  } else {
    const value = seeds[key];
    const size = Array.isArray(value)
      ? `${value.length} rows`
      : `${Object.keys(value).length} fields`;
    console.log(`  ✓ ${key.padEnd(28)} ${size}`);
    ok += 1;
  }
}

console.log(`\n${ok}/${keys.length} documents seeded.`);

const ownerEmail = process.argv[2];
if (ownerEmail) {
  const email = ownerEmail.trim().toLowerCase();
  const { data: existing } = await supabase
    .from("admins")
    .select("email, role")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    console.log(`\n${email} is already an admin (${existing.role}). Left as is.`);
  } else {
    const { error } = await supabase
      .from("admins")
      .insert({ email, role: "owner", label: "First owner" });
    if (error) console.error(`\nCould not add ${email}: ${error.message}`);
    else {
      console.log(`\n${email} is now an owner.`);
      console.log("Register that address on the site, then sign in at /admin/login.");
    }
  }
} else {
  console.log("\nNo admin email given. To make one:");
  console.log("  bun run cms:seed you@example.com");
}

rmSync(outDir, { recursive: true, force: true });
