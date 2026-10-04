/**
 * WHAT THE SIGN-IN EMAIL ACTUALLY CONTAINS.
 *
 * `signInWithOtp` always mints both a six-digit token and a magic link. Which
 * of them reaches the visitor is decided entirely by the Magic Link email
 * template, and a template that prints only `{{ .ConfirmationURL }}` — which
 * is Supabase's stock one — sends a link and no code at all.
 *
 * That matters because the screen has to ask for the thing the email holds.
 * Asking for six digits when the email contains a button is not a cosmetic
 * mismatch: it is a dead end, a box the visitor cannot fill from anything
 * they were sent.
 *
 * This project is on the free tier, where Supabase refuses a custom template
 * while the project uses the built-in mail provider — "Email template
 * modification is not available for free tier projects using the default
 * email provider", verbatim from the API. So the honest default is `link`:
 * match the email that actually goes out, not the one we would prefer.
 *
 * TO SWITCH TO CODES, both halves move together:
 *   1. configure custom SMTP (Resend) and set the Magic Link template to one
 *      containing `{{ .Token }}` — `node scripts/auth-config.mjs --apply`
 *      does the template once SMTP is in place;
 *   2. set `VITE_AUTH_EMAIL_MODE=code` and rebuild.
 *
 * Moving one without the other breaks sign-in in one of two ways: a code
 * template with this left on `link` hides a code the visitor was sent, and a
 * link template with this set to `code` is the dead end above. The full
 * sequence is in supabase/AUTH-SETUP.md.
 *
 * Its own module, not a constant in auth.tsx, because that file may only
 * export components — the same reason `buttonClass` lives in lib/button.ts.
 */
export const EMAIL_DELIVERS: "link" | "code" =
  import.meta.env.VITE_AUTH_EMAIL_MODE === "code" ? "code" : "link";
