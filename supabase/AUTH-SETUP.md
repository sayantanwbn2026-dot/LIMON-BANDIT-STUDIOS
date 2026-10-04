# Sign-in setup

Everything here is a **dashboard** setting. None of it lives in the repo, so a
restored project, a new environment or a second Supabase account needs this page
run through again.

The site's front door is a six-digit code emailed to the address someone types.
`signInWithOtp` sends it, `verifyOtp` checks it, and `AuthModal` is the screen.
Google is offered above it when the provider is on, and a password is kept
behind a link for accounts made before codes existed — including the admin, who
has to be able to get in when email is slow.

---

## 1. The Magic Link template — the one thing that is actually broken

**Authentication → Emails → Magic Link**

Supabase's default template emails a **link**. The site asks for a **code**. So
today someone on the code screen gets an email with a button and stares at six
empty boxes with nothing to type into them.

`{{ .Token }}` is the fix — that variable _is_ the six-digit code. Paste this
in as the template body:

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

Both are deliberate. The code is what the screen asks for; the link is what the
screen's own copy promises as an alternative ("or press the link in the same
email"), and it is the faster path for anyone reading mail on the same device.
Drop the link paragraph and that copy becomes a lie.

**Letter-spacing on the code is not decoration.** Ten pixels is what stops `11`
reading as `ll` and `0` as `O` when someone copies it across by eye.

---

## 2. Shorten the code's life

**Authentication → Providers → Email → Email OTP Expiration**

The default is **3600 seconds**. For a sign-in code that is an hour in which a
forwarded or screenshotted email still works. Set it to **600** (ten minutes) —
long enough for a slow inbox, short enough that a stale email in someone's
history is worthless.

Supabase's own security linter flags anything over an hour; ten minutes is the
usual recommendation and nothing in the site depends on the longer window. The
modal deliberately does not quote a duration, so this can be changed without
making the copy wrong.

---

## 3. Send through a real mail service

**Authentication → SMTP Settings**

Supabase's built-in sender is rate-limited to a handful of messages **per hour
for the entire project**, and it sends from a shared domain that spam filters
already distrust. Both failures look identical to the visitor: the code never
arrives, the site looks broken.

`RESEND_API_KEY` is already on the environment list. Point SMTP at it and send
from an address on the real domain. Until that is done, testing sign-in a few
times in a row will exhaust the quota and the next person gets nothing.

---

## 4. Turn off "Confirm email"

**Authentication → Providers → Email → Confirm email**

It should be **off**, and this is not a shortcut. Arriving with a code that was
emailed to the address _is_ the proof the address is real — that is the whole
mechanism. Leaving confirmation on adds a second email, a second trip and a
second way to get stuck, to prove a thing already proven.

It only still matters for the password path, where `AuthModal` offers to resend
the confirmation when a sign-in fails for that specific reason.

---

## 5. Leaked-password protection

**Authentication → Policies → Leaked password protection**

Off today; the advisor flags it. Supabase checks new passwords against
HaveIBeenPwned so nobody can set one that is already in a public breach dump.

Only the password path is affected, and only when setting or changing one — but
that path still exists for older accounts and for the admin, which makes it
exactly the path worth protecting.

---

## 6. Google (optional)

**Authentication → Providers → Google**

`AuthModal` hides the Google button entirely until the provider is enabled,
rather than showing one that errors. Add the OAuth client id and secret from
Google Cloud, and add the Supabase callback URL to the authorised redirect URIs
there.

---

## What is already right

Checked on 2026-10-04 against the live project, so nothing here needs doing:

- Every account is confirmed and every admin resolves — the admins table and
  `auth.users` agree.
- Signup does not leak who is registered: Supabase returns a normal-looking
  user with an empty `identities` array for an address that already exists, and
  `signUp` handles that case rather than reporting "already registered".
- Supabase's throttle messages are translated before a visitor sees them — "For
  security purposes, you can only request this after 46 seconds" reads as a
  refusal, not a wait.
- The resend button counts down 60 seconds, matching Supabase's own minimum
  interval, so it cannot invite a press the server will refuse.
