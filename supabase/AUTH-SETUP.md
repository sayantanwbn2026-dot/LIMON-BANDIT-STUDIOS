# User login — what to do, in order

Everything here is a **Supabase dashboard** setting. None of it lives in the
repo, so a restored project, a second environment or a new account loses all of
it silently: the site keeps building and sign-in simply stops working.

**How the login works**, so the steps below make sense. Someone types their
email, the site asks Supabase for a six-digit code (`signInWithOtp`), they type
the code back (`verifyOtp`), and they are in. First visit or tenth, same form —
arriving with a code emailed to the address _is_ the proof the address is real,
so there is no separate confirmation step. Google sits above it when enabled.
A password is kept behind a link for accounts made before codes existed.

Verified against the live project on **2026-10-04**: 7 accounts, all confirmed,
all signed in within 30 days.

## Status — applied 2026-10-04

**Sign-in works.** Confirmed by the account holder following a real link from
a real email, after the fix in `src/lib/auth-capture.ts`. What the site sends
today is a sign-in _link_, not a code, and the screen asks for a link to match
— see `src/lib/auth-mode.ts` for how to switch that round once step 5 is done.

Steps 1, 3 and 4 are **done**, set through the Management API by
`scripts/auth-config.mjs` and verified by reading the config back:

| Setting              | Was                     | Now                                                 |
| -------------------- | ----------------------- | --------------------------------------------------- |
| `site_url`           | `http://localhost:3000` | `http://localhost:5181`                             |
| `uri_allow_list`     | **empty**               | `http://localhost:5181/**,http://localhost:3000/**` |
| `mailer_autoconfirm` | `false`                 | `true` (confirm-email off)                          |
| `mailer_otp_exp`     | `3600`                  | `600`                                               |

The allow list being _empty_ is worth noting: until this ran, Supabase had no
permitted redirect at all, so every magic link and every Google return would
have bounced regardless of anything else being right.

**Two are blocked by the plan, not by configuration**, and the API says so in
its own words:

- **The magic-link template (step 2)** — `400`: _"Email template modification
  is not available for free tier projects using the default email provider.
  Please upgrade your plan or configure a custom SMTP provider."_

  **This reorders the work.** Resend is not an optimisation to get to later;
  it is the prerequisite for the one change that unblocks the code box. Do
  step 5, then re-run `node scripts/auth-config.mjs --apply` and the template
  will go in.

- **Leaked-password protection (step 6)** — `402`: _"Configuring leaked
  password protection via HaveIBeenPwned.org is available on Pro Plans and
  up."_ Not available on the free tier at any price short of upgrading.

Re-running the script is safe at any time: with no flag it only reads, and
`--apply` patches each field separately so a refusal costs nothing but itself.

---

## Step 1 — URL configuration

**Authentication → URL Configuration**

Do this one first. Supabase refuses to send anyone to a URL that is not on this
list, so until it is right, every email link and every Google return bounces —
and it fails the same way whether the rest of the setup is perfect or not.

- **Site URL**: the real domain, e.g. `https://limonbandit.com`
- **Redirect URLs**: add each of these, one per line

  ```
  http://localhost:5181/**
  https://limonbandit.com/**
  ```

  Replace the domain with the real one, and add the Lovable preview domain too
  if you use it.

The `/**` wildcard is needed, not optional. The site sends people back to
`/?confirmed=1` after a magic link, `/?recover=1` after a password reset, and
**back to whatever page they were on** after Google — that last one is any path
on the site, so an exact-URL list cannot cover it.

**How to check:** click a sign-in link in an email and land back on the site
signed in, rather than on a Supabase error page saying the redirect is not
allowed.

---

## Step 2 — the Magic Link template

**Authentication → Emails → Magic Link**

This is the one thing that is actually wrong today. Supabase's default template
emails a **link**. The site asks for a **code**. So right now someone gets an
email with a button and stares at six empty boxes with nothing to type into
them.

`{{ .Token }}` is the fix — that variable _is_ the six-digit code. Paste this
as the template body:

```html
<div
  style="background:#050505;color:#f2f2f0;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;padding:40px 24px"
>
  <div style="max-width:440px;margin:0 auto">
    <p
      style="margin:0 0 28px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8a8a85"
    >
      Limon Bandit
    </p>

    <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#f2f2f0">Your sign-in code</h1>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.5;color:#8a8a85">
      Type this into the box on the site.
    </p>

    <p
      style="margin:0 0 28px;padding:20px 24px;background:#101010;border:1px solid #2e2e2e;border-radius:12px;font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;color:#e9ff00"
    >
      {{ .Token }}
    </p>

    <p style="margin:0 0 28px;font-size:14px;line-height:1.5;color:#8a8a85">
      Or
      <a href="{{ .ConfirmationURL }}" style="color:#e9ff00;font-weight:600"
        >press here to sign in</a
      >
      without typing it.
    </p>

    <p
      style="margin:0;padding-top:24px;border-top:1px solid #2e2e2e;font-size:13px;line-height:1.5;color:#8a8a85"
    >
      If you did not ask to sign in, ignore this email — nobody can use the code without it, and it
      expires by itself.
    </p>
  </div>
</div>
```

Both the code and the link are deliberate. The code is what the screen asks
for; the link is what the screen's own copy promises as the faster alternative
("or press the link in the same email"), and it is the quicker path for anyone
reading mail on the same phone. Drop the link paragraph and that copy becomes a
lie.

The 10px letter-spacing on the code is not decoration — it is what stops `11`
reading as `ll` and `0` as `O` when somebody copies it across by eye.

**How to check:** request a code on the site; the email should show six large
spaced digits, and typing them should sign you straight in without pressing a
button (the field submits itself on the sixth digit).

---

## Step 3 — turn "Confirm email" off

**Authentication → Providers → Email → Confirm email** → **off**

This is not a shortcut. Arriving with a code that was emailed to the address
already proves the address is real — that is the entire mechanism. Leaving
confirmation on adds a second email, a second trip and a second way to get
stuck, to prove a thing already proven.

It still matters for the password path, where the sign-in popup offers to
resend the confirmation when a sign-in fails for that specific reason.

**How to check:** sign in with an email that has never been used before. You
should land signed in from the code alone, with no "confirm your email" step.

---

## Step 4 — shorten the code's life

**Authentication → Providers → Email → Email OTP Expiration** → **600**

The default is 3600 seconds. For a sign-in code that is a full hour in which a
forwarded or screenshotted email still works. Ten minutes is long enough for a
slow inbox and short enough that a stale email in somebody's history is worth
nothing.

Supabase's own linter flags anything over an hour. Nothing in the site depends
on the longer window, and the popup deliberately quotes no duration, so this
can change without making the copy wrong.

---

## Step 5 — send through a real mail service

**Authentication → SMTP Settings**

Supabase's built-in sender is capped at **a handful of messages per hour for
the entire project**, and it sends from a shared domain that spam filters
already distrust. Both failures look identical from the outside: the code never
arrives and the site looks broken.

This is the step that bites the moment more than one person tries to sign in.

1. Create a [Resend](https://resend.com) account and verify the real domain.
2. Create an API key.
3. In Supabase SMTP Settings, enable custom SMTP:
   - Host `smtp.resend.com`, port `465`
   - Username `resend`
   - Password: the API key
   - Sender: an address on the verified domain, e.g. `hello@limonbandit.com`
4. Put the same key in the deploy environment as `RESEND_API_KEY`.

**Not currently in `.env`** — checked on 2026-10-04. `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SHEETS_WEBHOOK_URL` and `SHEETS_WEBHOOK_SECRET` are all set; `RESEND_API_KEY`
is absent.

**How to check:** request two codes a minute apart. Both should arrive, from
the real domain, and not in spam.

---

## Step 6 — leaked-password protection

**Authentication → Policies → Leaked password protection** → **on**

Supabase checks new passwords against HaveIBeenPwned so nobody can set one that
is already in a public breach dump. The security advisor flags this as off
today.

Only the password path is affected, and only when setting or changing one — but
that path still exists for older accounts and for the admin, which makes it
exactly the path worth protecting.

---

## Step 7 — Google (optional)

**Authentication → Providers → Google**

The sign-in popup hides the Google button entirely until this provider is
enabled, rather than showing one that errors — so skipping this step costs
nothing except the button.

1. In Google Cloud Console, create an OAuth 2.0 client (type: Web application).
2. Add Supabase's callback as an authorised redirect URI:
   `https://vwuuwommxvqtgzlsndip.supabase.co/auth/v1/callback`
3. Paste the client ID and secret into Supabase and enable the provider.

---

## What is already right

Checked against the live project, so none of this needs doing:

- Every account is confirmed and every admin resolves — the `admins` table and
  `auth.users` agree.
- Signup does not leak who is registered. Supabase deliberately returns a
  normal-looking user with an empty `identities` array for an address that
  already has an account, and the code handles that case rather than reporting
  "already registered" to a stranger.
- Supabase's throttle wording is translated before anyone sees it — "For
  security purposes, you can only request this after 46 seconds" reads as a
  refusal rather than a wait.
- The resend button counts down 60 seconds, matching Supabase's own minimum
  interval, so it cannot invite a press the server will refuse.
- The code box takes focus on arrival, submits itself on the sixth digit, and
  clears and re-focuses on a wrong code.
- `.env` is gitignored, and no secret is compiled into the client bundle except
  the two `VITE_` values, which are public by design.

---

## Still open, unrelated to login

`reserve_stock` and `release_stock` are `SECURITY DEFINER` and executable by
any signed-in user, so a shopper can inflate or drain stock over REST. That is
the checkout path, not the login path. `SUPABASE_SERVICE_ROLE_KEY` is now set,
which is what fixing it needs — it wants the stock mutation moved behind the
service role or into one atomic `place_order` function, plus a test account to
verify against before it ships.
