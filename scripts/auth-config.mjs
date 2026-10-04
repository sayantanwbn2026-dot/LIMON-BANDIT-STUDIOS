/**
 * Read, and then set, this project's Supabase auth configuration.
 *
 * WHY THIS EXISTS. Every setting the user login depends on — the redirect
 * allow list, the magic-link template, the OTP lifetime, whether email is
 * auto-confirmed, leaked-password protection — lives in the Supabase
 * dashboard and nowhere in this repo. The MCP this project uses reaches the
 * database only, so none of it can be scripted through that. The Management
 * API can do all of it; this is that call, written down so the settings have
 * a source of truth and a second environment can be brought up the same way.
 *
 * READ FIRST, ALWAYS. `--apply` is opt-in: with no flag this prints the live
 * config and changes nothing. That is not politeness, it is how the script
 * avoids guessing — the PATCH below only sends keys that came back in the
 * GET, so a field name that Supabase has renamed is reported rather than
 * silently written into a key the API ignores.
 *
 * THE TOKEN. Supabase personal access tokens are account-wide and cannot be
 * scoped to one project, so the one this reads can touch every project on the
 * account. It is read from .env (gitignored) and never printed. Revoke it at
 * https://supabase.com/dashboard/account/tokens as soon as this has run.
 *
 *   node scripts/auth-config.mjs            # read, print, change nothing
 *   node scripts/auth-config.mjs --apply    # write, then read back to verify
 */

import { readFileSync } from "node:fs";

const PROJECT_REF = "vwuuwommxvqtgzlsndip";
const API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

/* --- the token, from .env, never logged --- */
function token() {
  let env = "";
  try {
    env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  } catch {
    fail("No .env file. Add SUPABASE_ACCESS_TOKEN=sbp_... to it.");
  }
  const line = env.split(/\r?\n/).find((l) => l.startsWith("SUPABASE_ACCESS_TOKEN="));
  const value = line
    ?.slice("SUPABASE_ACCESS_TOKEN=".length)
    .trim()
    .replace(/^["']|["']$/g, "");
  if (!value) {
    fail(
      "SUPABASE_ACCESS_TOKEN is not set in .env.\n" +
        "Create one at https://supabase.com/dashboard/account/tokens and add:\n" +
        "  SUPABASE_ACCESS_TOKEN=sbp_...",
    );
  }
  return value;
}

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * What we intend the settings to be.
 *
 * `uri_allow_list` needs the `/**` wildcards, not exact URLs: the site
 * returns people to /?confirmed=1 after a magic link, /?recover=1 after a
 * reset, and after Google back to WHATEVER page they started on — which is
 * any path on the site. Exact URLs cannot express that.
 *
 * `site_url` is where Supabase sends anyone whose redirect it cannot honour,
 * so it has to be production: a visitor on the live site who follows a link
 * Supabase rejects should land on the live site, not on a localhost address
 * that means nothing on their phone.
 *
 * THE PREVIEW WILDCARD IS NOT OPTIONAL. Vercel gives every deployment its own
 * hostname — limon-bandit-studios-2nyjgscuo-xexe1.vercel.app was the one live
 * when this was written — so signing in from a preview build redirects to a
 * host that will never be in a list of exact URLs. Without the pattern every
 * preview silently falls back to production, which looks like the link
 * "not working" on the branch you are actually testing.
 * ------------------------------------------------------------------ */
const SITE_URL = "https://limon-bandit-studios.vercel.app";
const REDIRECTS = [
  "https://limon-bandit-studios.vercel.app/**",
  "https://limon-bandit-studios-*-xexe1.vercel.app/**",
  "http://localhost:5181/**",
  "http://localhost:3000/**",
];

/* The magic-link email. `{{ .Token }}` IS the six-digit code — the whole
 * reason this script exists is that Supabase's stock template sends only a
 * link, while the site asks for a code, so the code box has nothing to
 * receive. The link stays beside it because the popup's own copy offers it
 * as the faster alternative.
 *
 * The 10px letter-spacing is not decoration: it is what stops 11 reading as
 * ll and 0 as O when somebody copies the code across by eye. */
const MAGIC_LINK_HTML = `<div style="background:#050505;color:#f2f2f0;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;padding:40px 24px">
  <div style="max-width:440px;margin:0 auto">
    <p style="margin:0 0 28px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8a8a85">Limon Bandit</p>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#f2f2f0">Your sign-in code</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.5;color:#8a8a85">Type this into the box on the site.</p>
    <p style="margin:0 0 28px;padding:20px 24px;background:#101010;border:1px solid #2e2e2e;border-radius:12px;font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;color:#e9ff00">{{ .Token }}</p>
    <p style="margin:0 0 28px;font-size:14px;line-height:1.5;color:#8a8a85">Or <a href="{{ .ConfirmationURL }}" style="color:#e9ff00;font-weight:600">press here to sign in</a> without typing it.</p>
    <p style="margin:0;padding-top:24px;border-top:1px solid #2e2e2e;font-size:13px;line-height:1.5;color:#8a8a85">If you did not ask to sign in, ignore this email &mdash; nobody can use the code without it, and it expires by itself.</p>
  </div>
</div>`;

/** Each entry: the setting we want, and why, keyed by the API's own field. */
const INTENT = {
  site_url: { value: SITE_URL, why: "where Supabase sends people by default" },
  uri_allow_list: {
    value: REDIRECTS.join(","),
    why: "every redirect the site asks for must be on this list or it bounces",
  },
  mailer_templates_magic_link_content: {
    value: MAGIC_LINK_HTML,
    why: "the stock template sends a link; the site asks for a code",
  },
  mailer_autoconfirm: {
    value: true,
    why: "arriving with a code emailed to the address already proves the address",
  },
  mailer_otp_exp: { value: 600, why: "an hour is an hour a screenshotted code still works" },
  password_hibp_enabled: { value: true, why: "refuse passwords already in a breach dump" },
};

async function call(method, body) {
  const res = await fetch(API, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    fail(`${method} ${res.status} ${res.statusText}\n  ${text.slice(0, 400)}`);
  }
  return JSON.parse(text);
}

/** Never print a template body or anything secret-shaped — just its shape. */
function show(key, value) {
  if (value === null || value === undefined) return "(unset)";
  /* Booleans and numbers are never secrets, and masking them defeats the
   * verification this script exists for: `password_hibp_enabled` matched the
   * secret pattern on the word "password" and printed "(set)" for both true
   * and false, so the one line meant to prove the setting had flipped could
   * not tell the two apart. Only strings can be secret-shaped. */
  if (typeof value !== "string") return String(value);
  const s = value;
  if (/pass|secret|key|token/i.test(key)) return s ? "(set)" : "(unset)";
  if (s.length > 72) return `${s.length} chars, starts "${s.slice(0, 44).replace(/\s+/g, " ")}…"`;
  return s;
}

const apply = process.argv.includes("--apply");

const before = await call("GET");

console.log(`\n  Supabase auth config — ${PROJECT_REF}\n`);
const missing = [];
for (const [key, { value, why }] of Object.entries(INTENT)) {
  const has = key in before;
  if (!has) missing.push(key);
  const now = show(key, before[key]);
  const want = show(key, value);
  const same = String(before[key]) === String(value);
  const mark = !has ? "?" : same ? "ok" : "->";
  console.log(`  ${mark.padEnd(3)} ${key}`);
  console.log(`      now:  ${now}`);
  if (!same) console.log(`      want: ${want}`);
  console.log(`      why:  ${why}\n`);
}

if (missing.length) {
  fail(
    `The API did not return these fields, so this script will not write them:\n` +
      missing.map((m) => `    ${m}`).join("\n") +
      `\n  Supabase has probably renamed them. Check the field names against the\n` +
      `  GET response before applying, rather than writing keys the API ignores.`,
  );
}

if (!apply) {
  console.log("  Read-only. Nothing changed. Re-run with --apply to write.\n");
  process.exit(0);
}

/* ONE PATCH PER SETTING.
 *
 * A PATCH is all-or-nothing, and this project's plan refuses two of these
 * outright — the free tier will not accept a custom email template while the
 * project is still on the built-in mail provider, and leaked-password
 * protection is Pro and up. Sent as one body, either refusal took all six
 * settings down with it: a 400, then a 402, and nothing applied either time.
 *
 * So each field goes in its own call and stands or falls alone. Four land,
 * two are reported with the plan's own words, and nothing is lost to a
 * neighbour's rejection. It costs five extra round trips at human speed,
 * which is nothing against silently believing a setting was applied.
 */
const refused = [];
for (const [key, { value }] of Object.entries(INTENT)) {
  const res = await fetch(API, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ [key]: value }),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      msg = JSON.parse(text).message ?? text;
    } catch {
      /* keep the raw body */
    }
    refused.push({ key, status: res.status, msg });
  }
}

/* Read back rather than trusting the PATCH's own response: the point of
 * verifying is to see what the server kept, not what we sent it. */
const after = await call("GET");
let bad = 0;
console.log("  After:\n");
for (const [key, { value }] of Object.entries(INTENT)) {
  const wasRefused = refused.some((r) => r.key === key);
  const ok = String(after[key]) === String(value);
  /* A field the plan refused is not a failure of this script, and counting
   * it as one would make a correct run exit non-zero for ever. */
  if (!ok && !wasRefused) bad++;
  console.log(`  ${wasRefused ? "-- " : ok ? "ok " : "NO "} ${key}  ${show(key, after[key])}`);
}
console.log(
  bad === 0
    ? "\n  All set. Revoke the token now: https://supabase.com/dashboard/account/tokens\n"
    : `\n  ${bad} setting(s) did not stick — read the output above.\n`,
);
process.exit(bad === 0 ? 0 : 1);
