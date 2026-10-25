import { useEffect, useRef, useState, type FormEvent } from "react";
import { Modal } from "@/components/lb/Modal";
import { Field, FormNotice, SubmitButton } from "@/components/lb/Field";
import { useAuth, type AuthMode } from "@/lib/auth";
import { setAuthWords } from "@/lib/auth-words";
import { EMAIL_DELIVERS } from "@/lib/auth-mode";
import { useWords } from "@/cms/hooks";
import { fill } from "@/cms/words";

/**
 * The login popup.
 *
 * Mounted once, above the router, and opened by `useAuth().requireAuth` from
 * wherever an action was blocked. The `reason` it was opened with is printed
 * at the top — "Sign in to add this to your cart" — because a modal that
 * appears with no explanation reads as the site malfunctioning rather than as
 * an answer to what you just pressed.
 *
 * Signing in successfully does not just close this: the provider re-runs the
 * action that was interrupted, so the tee lands in the basket without anyone
 * pressing Add again.
 *
 * TWO DOORS, NEITHER OF THEM A PASSWORD
 *
 *   Google      — one tap, nothing to type, nothing to remember.
 *   A code      — six digits to the address given. First visit or tenth,
 *                 same form: the code proves the address, so there is no
 *                 separate "confirm your email" step to lose people in.
 *
 * Passwords are still accepted for accounts that already have one (and for
 * the admin, who must be able to get in when email is slow), but they are
 * behind a link rather than the front door. A password on a shop this size
 * is a liability someone else's breach can trigger: people reuse them, this
 * database would be storing the hash of something that opens their bank, and
 * every one of them is a "forgot password" round trip waiting to happen. A
 * code cannot be reused, cannot be phished from a leak elsewhere, and
 * expires by itself.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const CODE_LENGTH = 6;
/* Matches Supabase's own minimum interval between one-time codes for the
 * same address. A shorter countdown would invite a second press that the
 * server refuses, which reads as the site being broken. */
const RESEND_SECONDS = 60;

type Errors = Partial<Record<"email" | "password" | "fullName" | "phone" | "code", string>>;

export function AuthModal() {
  const {
    gate,
    closeAuth,
    setMode,
    signIn,
    signUp,
    sendEmailCode,
    verifyEmailCode,
    resetPassword,
    updatePassword,
    resendConfirmation,
    signInWithGoogle,
    googleEnabled,
    configured,
  } = useAuth();
  const w = useWords("account");
  const c = useWords("common");
  setAuthWords(w);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<{ tone: "bad" | "good"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  /* Shown only after a password sign-in fails specifically because the
   * account was never confirmed — the one failure a visitor can fix alone. */
  const [canResend, setCanResend] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  /* The address the code actually went to, so the screen can name it even
   * if the field is edited afterwards. */
  const sentTo = useRef("");
  const formRef = useRef<HTMLFormElement>(null);
  /* The last complete code this screen submitted by itself. Without it the
   * auto-submit below would fire again on every re-render while a wrong
   * code sat in the box — including the re-render its own failure causes,
   * which is an infinite loop against the auth server. */
  const autoSent = useRef("");

  const mode = gate.mode;

  /* Clear the form between openings — leaving a typed password or a live
   * code sitting in a closed dialog is both a surprise and a small hazard
   * on a shared laptop. */
  useEffect(() => {
    if (gate.open) return;
    setPassword("");
    setCode("");
    autoSent.current = "";
    setErrors({});
    setNotice(null);
    setBusy(false);
    setCanResend(false);
  }, [gate.open]);

  useEffect(() => {
    setErrors({});
    setNotice(null);
    setCanResend(false);
  }, [mode]);

  /* ARRIVING AT THE CODE STEP, PUT THE CARET IN THE BOX.
   *
   * The step before this was a button press, so focus is left on a button
   * that no longer exists. Without this the screen asks for six digits and
   * the keyboard is shut — on a phone that is a tap nobody should have to
   * find, and for a screen reader it is a silent change of subject. */
  useEffect(() => {
    if (mode !== "code") return;
    const t = window.setTimeout(() => document.getElementById("auth-code")?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [mode]);

  /* SIX DIGITS IS THE WHOLE INTENT — DO NOT ALSO ASK FOR A PRESS.
   *
   * A one-time code has exactly one meaning: nobody types six digits they
   * did not mean to submit. Pasting from the mail app and then hunting for
   * a button is the step that makes a code feel slower than a password,
   * and on iOS the keyboard's own autofill drops all six in at once — so
   * the press is a tap on a button the visitor cannot see under the
   * keyboard.
   *
   * `requestSubmit`, not a direct call, so this goes through exactly the
   * same validation and busy-state path as the button. `autoSent` makes it
   * fire once per distinct complete code: a wrong code re-renders this
   * component, and without the guard that re-render would submit it again,
   * and again, until Supabase started refusing us. Clearing the box on
   * failure (below) is what lets a corrected code through. */
  useEffect(() => {
    if (mode !== "code" || busy) return;
    if (code.length !== CODE_LENGTH) return;
    if (autoSent.current === code) return;
    autoSent.current = code;
    formRef.current?.requestSubmit();
  }, [code, mode, busy]);

  /* Counts the resend button back down to zero, once per second, and only
   * while there is something to count. */
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const validate = (): Errors => {
    const e: Errors = {};
    /* "update" runs on a recovery session that already knows who the
     * visitor is, so it asks for a password and nothing else. */
    if (mode !== "update" && mode !== "code" && !EMAIL.test(email)) {
      e.email = c.emailInvalid;
    }
    if (mode === "code" && code.replace(/\D/g, "").length !== CODE_LENGTH) {
      e.code = fill(w.codeLength, { digits: CODE_LENGTH });
    }
    if (
      (mode === "password" || mode === "signup" || mode === "update") &&
      password.length < MIN_PASSWORD
    ) {
      e.password = fill(w.passwordShort, { count: MIN_PASSWORD });
    }
    if (mode === "signup") {
      if (fullName.trim().length < 2) e.fullName = c.nameMissing;
      if (phone.trim() && phone.trim().length < 6) e.phone = w.phoneShort;
    }
    return e;
  };

  const requestCode = async (): Promise<boolean> => {
    const res = await sendEmailCode(email, fullName);
    if (!res.ok) {
      setNotice({ tone: "bad", text: res.message });
      return false;
    }
    sentTo.current = email.trim();
    setCooldown(RESEND_SECONDS);
    setCode("");
    autoSent.current = "";
    return true;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstBad = (["fullName", "email", "code", "password", "phone"] as const).find(
        (k) => found[k],
      );
      if (firstBad) document.getElementById(`auth-${firstBad}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      /* ---- the default door: email, then a code ---- */
      if (mode === "signin") {
        /* Straight to the screen that matches what the email will hold. A
         * link template and a code box is a dead end — a field the visitor
         * cannot fill from anything they were sent. */
        if (await requestCode()) setMode(EMAIL_DELIVERS === "code" ? "code" : "sent");
        return;
      }

      if (mode === "code") {
        const res = await verifyEmailCode(sentTo.current || email, code);
        /* On success the provider closes this and releases the pending
         * action, so there is nothing to do here but report a failure. */
        if (!res.ok) {
          setNotice({ tone: "bad", text: res.message });
          /* Empty the box and put the caret back in it. A wrong code is
           * never worth editing — you retype it or you paste the right one
           * — and leaving six stale digits there means select-all before
           * either. It also re-arms the auto-submit, which will not fire
           * twice on the same value. */
          setCode("");
          autoSent.current = "";
          document.getElementById("auth-code")?.focus();
        }
        return;
      }

      /* ---- the password doors, for accounts that already have one ---- */
      if (mode === "reset") {
        const res = await resetPassword(email);
        setNotice(
          res.ok ? { tone: "good", text: w.resetSent } : { tone: "bad", text: res.message },
        );
        return;
      }

      if (mode === "update") {
        const res = await updatePassword(password);
        if (!res.ok) {
          setNotice({ tone: "bad", text: res.message });
          return;
        }
        setNotice({ tone: "good", text: w.passwordChanged });
        /* Long enough to read the confirmation, short enough not to
         * feel stuck in a dialog with nothing left to do. */
        window.setTimeout(closeAuth, 1400);
        return;
      }

      if (mode === "password") {
        const res = await signIn(email, password);
        if (!res.ok) {
          setNotice({ tone: "bad", text: res.message });
          setCanResend(Boolean(res.unconfirmed));
        }
        return;
      }

      const res = await signUp({ email, password, fullName, phone });
      if (!res.ok) {
        setNotice({ tone: "bad", text: res.message });
        return;
      }
      if (res.needsConfirmation) {
        setNotice({
          tone: "good",
          text: fill(w.accountMade, { email: email.trim() }),
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const onResendCode = async () => {
    if (cooldown > 0) return;
    setBusy(true);
    setNotice(null);
    try {
      if (await requestCode()) {
        setNotice({ tone: "good", text: fill(w.sentAgain, { email: sentTo.current }) });
      }
    } finally {
      setBusy(false);
    }
  };

  const onResendConfirmation = async () => {
    setBusy(true);
    try {
      const res = await resendConfirmation(email);
      setNotice(
        res.ok
          ? { tone: "good", text: fill(w.confirmationSentAgain, { email: email.trim() }) }
          : { tone: "bad", text: res.message },
      );
      if (res.ok) setCanResend(false);
    } finally {
      setBusy(false);
    }
  };

  const heading: Record<AuthMode, string> = {
    signin: w.titleSignIn,
    code: w.titleCode,
    sent: w.titleCode,
    password: w.titlePassword,
    signup: w.titleSignUp,
    reset: w.titleReset,
    update: w.titleUpdate,
  };

  const standfirst =
    mode === "sent"
      ? fill(w.sentLink, { email: sentTo.current || w.yourInbox })
      : mode === "code"
        ? fill(w.sentCode, { digits: CODE_LENGTH, email: sentTo.current || w.yourInbox })
        : gate.reason
          ? gate.reason
          : mode === "signup"
            ? w.ledeSignUp
            : mode === "reset"
              ? w.ledeReset
              : mode === "update"
                ? w.ledeUpdate
                : mode === "password"
                  ? w.ledePassword
                  : EMAIL_DELIVERS === "code"
                    ? w.ledeCode
                    : w.ledeLink;

  return (
    <Modal open={gate.open} onClose={closeAuth} title={heading[mode]} standfirst={standfirst}>
      {!configured ? (
        <div className="mb-6">
          <FormNotice>
            Accounts are not connected yet. Add <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to <code>.env</code>, then restart the dev
            server.
          </FormNotice>
        </div>
      ) : null}

      {/* Google first: one tap, no code to wait for. Hidden entirely until
       * the provider is enabled on the Supabase project, rather than shown
       * and broken. */}
      {googleEnabled && (mode === "signin" || mode === "signup" || mode === "password") ? (
        <div className="mb-8">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setNotice(null);
              const res = await signInWithGoogle();
              /* On success the browser is already leaving for Google; only
               * a failure comes back here to be reported. */
              if (!res.ok) {
                setNotice({ tone: "bad", text: res.message });
                setBusy(false);
              }
            }}
            className="flex h-[52px] w-full items-center justify-center gap-3 border border-line-strong bg-transparent font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-acid-type disabled:cursor-wait disabled:opacity-60"
          >
            <GoogleMark />
            {w.google}
          </button>
          <div className="mt-8 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="t-label text-mute">{w.orEmail}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6">
        {mode === "signup" ? (
          <Field
            id="auth-fullName"
            label={w.name}
            value={fullName}
            onChange={setFullName}
            error={errors.fullName}
            placeholder={w.namePlaceholder}
            autoComplete="name"
            required
          />
        ) : null}

        {mode !== "update" && mode !== "code" && mode !== "sent" ? (
          <Field
            id="auth-email"
            label={c.emailLabel}
            type="email"
            inputMode="email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            placeholder={c.emailPlaceholder}
            autoComplete="email"
            required
          />
        ) : null}

        {mode === "code" ? (
          <Field
            id="auth-code"
            label={w.code}
            inputMode="numeric"
            value={code}
            /* Digits only, because people paste them with spaces out of the
             * mail app, and capped at six so a double paste cannot silently
             * make the code wrong. */
            onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, CODE_LENGTH))}
            error={errors.code}
            placeholder={w.codePlaceholder}
            autoComplete="one-time-code"
            required
            /* Not "good for an hour": the expiry is a dashboard setting and
             * a shortened one would make this copy a lie in the dangerous
             * direction. The newest-code warning is the more useful fact
             * anyway — the common failure is not an expired code, it is
             * someone pressing resend and then typing the FIRST email's
             * digits, which the server has already replaced. */
            hint={w.codeHint}
          />
        ) : null}

        {mode === "password" || mode === "signup" || mode === "update" ? (
          <Field
            id="auth-password"
            label={mode === "update" ? w.newPassword : w.password}
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder={w.passwordPlaceholder}
            autoComplete={
              mode === "signup" || mode === "update" ? "new-password" : "current-password"
            }
            required
          />
        ) : null}

        {mode === "signup" ? (
          <Field
            id="auth-phone"
            label={w.phone}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={setPhone}
            error={errors.phone}
            placeholder={w.phonePlaceholder}
            autoComplete="tel"
            hint={w.phoneHint}
          />
        ) : null}

        {notice ? <FormNotice tone={notice.tone}>{notice.text}</FormNotice> : null}

        {/* No submit on the sent screen. There is nothing left to send: the
         * email is already gone and the next move is in the visitor's inbox,
         * not on this form. A button here would either do nothing or send a
         * second email nobody asked for — and the resend below, with its
         * cooldown, is the deliberate way to do that. */}
        {mode === "sent" ? null : (
          <SubmitButton
            label={
              mode === "signin"
                ? EMAIL_DELIVERS === "code"
                  ? w.submitCode
                  : w.submitLink
                : mode === "code" || mode === "password"
                  ? w.submitSignIn
                  : mode === "signup"
                    ? w.submitSignUp
                    : mode === "update"
                      ? w.submitUpdate
                      : w.submitReset
            }
            busyLabel={
              mode === "code"
                ? w.busyChecking
                : mode === "signup"
                  ? w.busyCreating
                  : mode === "update"
                    ? w.busySaving
                    : w.busySending
            }
            busy={busy}
            disabled={!configured}
          />
        )}
      </form>

      {/* The escape hatch from the one failure a password visitor can fix
       * alone. Without it, an unconfirmed account is a closed loop: signing
       * in is refused, and signing up again is refused too because the
       * account already exists. */}
      {canResend ? (
        <div className="mt-6 border-t border-line pt-6">
          <button
            type="button"
            onClick={onResendConfirmation}
            disabled={busy}
            className="t-label text-acid-type underline underline-offset-4 transition-opacity duration-300 hover:opacity-70 disabled:opacity-40"
          >
            {w.resendConfirmation}
          </button>
        </div>
      ) : null}

      {mode === "code" || mode === "sent" ? (
        <div className="mt-8 space-y-3 border-t border-line pt-6">
          <p className="font-ui text-[13px] text-mute">
            {w.nothingYet}{" "}
            <button
              type="button"
              onClick={onResendCode}
              disabled={busy || cooldown > 0}
              className="font-semibold text-text transition-colors duration-300 hover:text-acid-type disabled:text-mute"
            >
              <span className={cooldown > 0 ? "" : "wipe-underline"}>
                {cooldown > 0 ? fill(w.sendAnotherIn, { seconds: cooldown }) : w.sendAnother}
              </span>
            </button>
          </p>
          <Switch
            prompt={w.wrongAddress}
            label={w.useDifferent}
            onClick={() => setMode("signin")}
          />
        </div>
      ) : mode === "update" ? null : (
        <div className="mt-8 space-y-3 border-t border-line pt-6">
          {mode === "signin" ? (
            <Switch
              /* "before we moved to codes" was true only while the email
               * carried a code. The email sends a link on the free tier, so
               * this names the change rather than the mechanism and stays
               * true whichever one is switched on. */
              prompt={w.oldAccount}
              label={w.usePassword}
              onClick={() => setMode("password")}
            />
          ) : mode === "password" ? (
            <>
              <Switch
                prompt={w.ratherNot}
                label={w.codeInstead}
                onClick={() => setMode("signin")}
              />
              <Switch prompt={w.forgotten} label={w.resetLink} onClick={() => setMode("reset")} />
            </>
          ) : (
            <Switch
              prompt={w.alreadyMember}
              label={w.signInLink}
              onClick={() => setMode("signin")}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

function Switch({
  prompt,
  label,
  onClick,
}: {
  prompt: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <p className="font-ui text-[13px] text-mute">
      {prompt}{" "}
      <button
        type="button"
        onClick={onClick}
        className="font-semibold text-text transition-colors duration-300 hover:text-acid-type"
      >
        <span className="wipe-underline">{label}</span>
      </button>
    </p>
  );
}

/**
 * Google's "G", in Google's colours.
 *
 * The one element on the site allowed off-palette, and not by choice:
 * Google's sign-in branding guidelines require the official multicolour
 * mark on a "Continue with Google" button and do not permit it recoloured.
 * Rendering it in acid would read as house style and break those terms.
 * Decorative — the button's text already says what it does.
 */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.3 44 33 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
