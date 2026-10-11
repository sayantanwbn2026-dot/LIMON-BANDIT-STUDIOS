# LIMON BANDIT — PASS 7

## What is left to make the house fully operational

Written 2026-10-11 against commit `d02a326`, the live Vercel deployment, and
the Supabase project as last read. Grouped by what it costs to leave undone,
not by how hard it is.

**Who does what** is marked on every item: **[you]** needs an account, a
credential, a card or a decision only the owner can make; **[me]** is code or
config I can do once the thing it depends on exists; **[both]** is a handover.

---

## 0. Where this actually stands

Working and verified: the whole public site at phone, tablet and desktop; the
CMS with 43 collections and section ordering; sign-in by email link, including
on production; the account dashboard; the admin inbox for orders, enquiries
and subscribers; first-party analytics; the shop end to end **up to the point
of payment**.

Health at this commit: 37 tests pass, 0 type errors, 0 lint errors (17
long-standing warnings), build clean. The entry chunk is **175 KB gzipped
against a 180 KB budget** — the overrun recorded in HANDOFF.md was fixed by
making `supabase-js` a dynamic import and is no longer outstanding.

The short version of what follows: **the shop can take an order but cannot
take money, cannot email a receipt, and cannot tell anyone an order arrived.**
Everything else is content and polish.

---

## A. The shop cannot complete a real sale

This is the group that matters. Each one is independently enough to stop a
real customer.

### A1 — There is no payment gateway **[you → me]**

Orders are cash-on-delivery only. Nothing charges a card. `payment_method`,
`payment_status` and `payment_ref` columns exist and `submitOrder` has the
seam documented for it, but no gateway is wired.

For India this is Razorpay or Cashfree. You open the account and complete KYC
— that part is yours and takes a few days with a bank account and GST details.
Then I slot it in between the order insert and the notification, so the
sequence is charge → mark `paid` → notify. Logistics must never receive an
unpaid order.

Until then the shop is honest but limited: it takes COD orders and says so.

### A2 — Buyers get no confirmation email **[you → me]**

`sendEmail` exists, is wired into the order path, and returns
`{ ok: false, configured: false }` every time because `RESEND_API_KEY` is
unset. Somebody places an order and receives **nothing** — no reference, no
summary, no record. That is the single worst gap in the funnel: it reads as a
failed purchase.

Needs `RESEND_API_KEY` and `ORDER_FROM_EMAIL` on Vercel. Same Resend account
as D1 below, so do it once.

### A3 — Nobody is told an order arrived **[you → me]**

`SHEETS_WEBHOOK_URL` is absent locally **and on Vercel**. Orders land in
Postgres and stop there. The house finds out by opening the admin.

A Slack or Discord incoming webhook is two minutes and needs no Apps Script;
`scripts/SHEET-SETUP.md` has all three options. The admin now says which of
the three failure states it is in, so you will see it corrected.

Note `SUPABASE_SERVICE_ROLE_KEY` **is** already set on Vercel, so the
sync-result stamping will work the moment a webhook exists. It is only the
local `.env` that lacks it.

### A4 — Stock can be manipulated by any signed-in user **[me]**

`reserve_stock` and `release_stock` are `SECURITY DEFINER`, granted to
`authenticated`, and validate nothing about the caller. A signed-in shopper
can call them directly over REST and inflate or drain stock on any product.
Flagged by Supabase's own advisor since the first audit.

The grant is load-bearing — checkout and the admin's cancellation both call
them as the signed-in user — so it cannot simply be revoked. The fix is to
move stock mutation behind the service role, or better, into one atomic
`place_order` function so reserving and ordering cannot drift apart.

I did not attempt it because it is the money path and it wants a staging
branch plus a test account to verify against. Worth doing **before** A1: once
real money is involved, a stock bug becomes a refund.

---

## B. Trust and legal

### B1 — The legal pages are drafts I wrote **[you]**

`/legal/terms`, `/legal/privacy`, `/legal/shipping-returns` are working drafts
generated from the code, marked `REPLACE / REVIEW` in `src/data/legal.ts`. The
returns window, delivery times and grievance contact are guesses.

India requires a named grievance officer with contact details on a commercial
site. Have someone who knows Indian e-commerce rules read these before you
sell anything.

### B2 — Contact details are placeholders **[you]**

The phone number is `+91 98300 00000`. The site's own `url` is
`https://limonbandit.com`, which is not registered — the live site is on
`limon-bandit-studios.vercel.app`. Both are editable in the CMS under
**Global → Brand & contact**; nothing in code needs changing.

### B3 — Leaked-password protection is off **[you]**

Supabase refuses it on the free tier (`402`, Pro and up). It checks new
passwords against HaveIBeenPwned. Only the password path is affected — which
still exists for older accounts and for the admin.

---

## C. Content that is still scaffolding

The site is fully built around content that was written to prove the layout.
It will not embarrass you, but it is not true.

### C1 — The music is synthesised **[you]**

`public/audio/park-circus.wav`, `rusted-gold.wav` and `terminus.wav` are
**byte-for-byte identical** — 192,044 bytes each, generated by
`scripts/audio.mjs`. The player, the waveform and the spectrum all work; they
are visualising a tone.

Drop real masters in at the same filenames and delete `scripts/audio.mjs`.

### C2 — Eight data files are marked REPLACE **[you, in the CMS]**

`crew`, `faq`, `metrics`, `process`, `rates`, `releases`, `services` and
`legal` all carry a `REPLACE` banner at the top. These are the seeds — the
floor the site falls back to. Everything in them is editable in the admin
without touching code, and editing there is the right move: a CMS edit
survives a deploy, a seed edit needs one.

The rates in particular are invented, and they are on the page a customer uses
to decide whether to call you.

### C3 — Product photography **[you]**

The catalogue renders whatever is in the CMS. Real shots of real stock, at
4:5, will change how the shop reads more than any code I can write.

---

## D. Finish the sign-in

### D1 — Resend unlocks the code-based flow **[you → me]**

Sign-in works today by emailed **link**. The six-digit code screen is built
and tested but switched off, because Supabase refuses a custom email template
on the free tier while the project uses the built-in mail provider.

This is also why A2 is blocked, and why sign-in emails are rate-limited to a
handful per hour across the whole project — which will bite the first time two
people sign in at once.

Three steps, in order: you set up Resend SMTP in Supabase; I run
`node scripts/auth-config.mjs --apply` to install the `{{ .Token }}` template;
I set `VITE_AUTH_EMAIL_MODE=code`. Both halves of the last two must move
together — `src/lib/auth-mode.ts` explains why at the point of change.

### D2 — Google sign-in is optional and absent **[you → me]**

The button is hidden until the provider is enabled, so nothing is broken. It
needs an OAuth client in Google Cloud. One tap beats any email flow, so it is
worth doing eventually.

---

## E. Operational

### E1 — Register the real domain **[you → me]**

`limonbandit.com` is referenced throughout the CMS and is not registered. Once
it is live and pointed at Vercel, I add it to the Supabase redirect allow list
— one entry, seconds — and update the CMS. Until then everything runs on the
Vercel hostname, which works but is not a brand.

### E2 — Two commits are unpushed **[me, on your word]**

`bdb866e` and `d02a326`. Everything up to `0232d28` is deployed.

### E3 — The Supabase MCP has lost authorisation **[you]**

It returned `You do not have permission to perform this action` for every call
this session, so the live-data figures above are from the last successful read
rather than from today. Reconnecting it restores my ability to check the
database and advisors directly.

---

## F. Worth doing, nothing is broken without them

- **Order status emails.** The admin can move an order to packed or shipped
  and the buyer is never told. Same Resend dependency as A2. **[me, after A2]**
- **A staging Supabase branch.** Every schema change so far has been applied
  to production because there is nowhere else. A4 in particular wants one.
- **`/rooms` is 13.8 screens on a phone** — the longest page left. It would
  take the same section-level treatment the home page got.
- **`/crew` and `/shop` are both ~12 screens** and have not had that pass
  either.
- **Real booking calendar.** The estimator quotes a price; booking is still a
  contact form. A room with availability is a different product.
- **17 lint warnings**, all `react-refresh/only-export-components` or
  exhaustive-deps, all long-standing and deliberate. Not errors, but they are
  the noise a real one would hide in.

---

## Suggested order

1. **A4** — fix the stock RPC while there is no money on the line.
2. **Resend (D1 + A2)** — one account unblocks receipts, the code flow, and
   the email rate limit together. Highest value per hour of your time.
3. **A3** — a Slack webhook, two minutes, so you know when something sells.
4. **B1 + B2** — legal review and real contact details before you advertise.
5. **A1** — payment gateway; the slowest because of KYC, so start the
   application early even though it lands last.
6. **C1–C3** — real content, continuously, from the CMS.
