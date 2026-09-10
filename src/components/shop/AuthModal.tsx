import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/lb/Modal";
import { Field, FormNotice, SubmitButton } from "@/components/lb/Field";
import { useAuth, type AuthMode } from "@/lib/auth";

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
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Errors = Partial<Record<"email" | "password" | "fullName" | "phone", string>>;

export function AuthModal() {
  const {
    gate,
    closeAuth,
    setMode,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    resendConfirmation,
    signInWithGoogle,
    googleEnabled,
    configured,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<{ tone: "bad" | "good"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  /* Shown only after a sign-in fails specifically because the account
   * was never confirmed — the one failure a visitor can fix alone. */
  const [canResend, setCanResend] = useState(false);

  const mode = gate.mode;

  /* Clear the form between openings — leaving a typed password sitting in a
   * closed dialog is both a surprise and a small hazard on a shared laptop. */
  useEffect(() => {
    if (gate.open) return;
    setPassword("");
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

  const validate = (): Errors => {
    const e: Errors = {};
    /* "update" runs on a recovery session that already knows who the
     * visitor is, so it asks for a password and nothing else. */
    if (mode !== "update" && !EMAIL.test(email)) {
      e.email = "That address will not reach you — check it.";
    }
    if (mode !== "reset" && password.length < MIN_PASSWORD) {
      e.password = `At least ${MIN_PASSWORD} characters.`;
    }
    if (mode === "signup") {
      if (fullName.trim().length < 2) e.fullName = "Tell us who you are.";
      if (phone.trim() && phone.trim().length < 6) e.phone = "That number looks short.";
    }
    return e;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstBad = (["fullName", "email", "password", "phone"] as const).find((k) => found[k]);
      if (firstBad) document.getElementById(`auth-${firstBad}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      if (mode === "reset") {
        const res = await resetPassword(email);
        setNotice(
          res.ok
            ? { tone: "good", text: "Check your inbox for a link to set a new password." }
            : { tone: "bad", text: res.message },
        );
        return;
      }

      if (mode === "update") {
        const res = await updatePassword(password);
        if (!res.ok) {
          setNotice({ tone: "bad", text: res.message });
          return;
        }
        setNotice({ tone: "good", text: "Password changed. You are signed in." });
        /* Long enough to read the confirmation, short enough not to
         * feel stuck in a dialog with nothing left to do. */
        window.setTimeout(closeAuth, 1400);
        return;
      }

      if (mode === "signin") {
        const res = await signIn(email, password);
        /* On success the provider closes this and releases the pending
         * action, so there is nothing to do here but report a failure. */
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
          text: `Account made. Confirm it from the link we sent to ${email.trim()}, then sign in.`,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setBusy(true);
    try {
      const res = await resendConfirmation(email);
      setNotice(
        res.ok
          ? { tone: "good", text: `Sent again to ${email.trim()}. It can take a minute.` }
          : { tone: "bad", text: res.message },
      );
      if (res.ok) setCanResend(false);
    } finally {
      setBusy(false);
    }
  };

  const heading: Record<AuthMode, string> = {
    signin: "Sign in",
    signup: "Become a member",
    reset: "Reset your password",
    update: "Choose a new password",
  };

  const standfirst = gate.reason
    ? gate.reason
    : mode === "signup"
      ? "Members can cart, wishlist and order. It takes a minute."
      : mode === "reset"
        ? "We will email you a link to set a new one."
        : mode === "update"
          ? "Pick something you have not used here before. At least 8 characters."
          : "Welcome back.";

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

      {/* Google first, when it exists. It is the one path with no password
       * to invent and no confirmation email to wait for — which on this
       * project, with confirmation still switched on, is the difference
       * between shopping now and shopping after an inbox round trip.
       * Hidden entirely until the provider is enabled, rather than shown
       * and broken. */}
      {googleEnabled && (mode === "signin" || mode === "signup") ? (
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
            Continue with Google
          </button>
          <div className="mt-8 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="t-label text-mute">or with email</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {mode === "signup" ? (
          <Field
            id="auth-fullName"
            label="Your name"
            value={fullName}
            onChange={setFullName}
            error={errors.fullName}
            placeholder="Who is ordering"
            autoComplete="name"
            required
          />
        ) : null}

        {mode !== "update" ? (
          <Field
            id="auth-email"
            label="Email"
            type="email"
            inputMode="email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            placeholder="you@somewhere.in"
            autoComplete="email"
            required
          />
        ) : null}

        {mode !== "reset" ? (
          <Field
            id="auth-password"
            label={mode === "update" ? "New password" : "Password"}
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder="At least 8 characters"
            autoComplete={
              mode === "signup" || mode === "update" ? "new-password" : "current-password"
            }
            required
          />
        ) : null}

        {mode === "signup" ? (
          <Field
            id="auth-phone"
            label="Phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={setPhone}
            error={errors.phone}
            placeholder="+91"
            autoComplete="tel"
            hint="Optional. Logistics call this one when they are outside."
          />
        ) : null}

        {notice ? <FormNotice tone={notice.tone}>{notice.text}</FormNotice> : null}

        <SubmitButton
          label={
            mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : mode === "update"
                  ? "Save new password"
                  : "Send link"
          }
          busyLabel={mode === "signup" ? "Creating…" : mode === "update" ? "Saving…" : "Sending…"}
          busy={busy}
          disabled={!configured}
        />
      </form>

      {/* The escape hatch from the one failure a visitor can fix alone.
       * Without it, an unconfirmed account is a closed loop: signing in
       * is refused, and signing up again is refused too because the
       * account already exists. */}
      {canResend ? (
        <div className="mt-6 border-t border-line pt-6">
          <button
            type="button"
            onClick={onResend}
            disabled={busy}
            className="t-label text-acid-type underline underline-offset-4 transition-opacity duration-300 hover:opacity-70 disabled:opacity-40"
          >
            Send the confirmation email again
          </button>
        </div>
      ) : null}

      {mode === "update" ? null : (
        <div className="mt-8 space-y-3 border-t border-line pt-6">
          {mode === "signin" ? (
            <>
              <Switch
                prompt="No account yet?"
                label="Become a member"
                onClick={() => setMode("signup")}
              />
              <Switch
                prompt="Forgotten it?"
                label="Reset your password"
                onClick={() => setMode("reset")}
              />
            </>
          ) : (
            <Switch prompt="Already a member?" label="Sign in" onClick={() => setMode("signin")} />
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
