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
  const { gate, closeAuth, setMode, signIn, signUp, resetPassword, configured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<{ tone: "bad" | "good"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const mode = gate.mode;

  /* Clear the form between openings — leaving a typed password sitting in a
   * closed dialog is both a surprise and a small hazard on a shared laptop. */
  useEffect(() => {
    if (gate.open) return;
    setPassword("");
    setErrors({});
    setNotice(null);
    setBusy(false);
  }, [gate.open]);

  useEffect(() => {
    setErrors({});
    setNotice(null);
  }, [mode]);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!EMAIL.test(email)) e.email = "That address will not reach you — check it.";
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

      if (mode === "signin") {
        const res = await signIn(email, password);
        /* On success the provider closes this and releases the pending
         * action, so there is nothing to do here but report a failure. */
        if (!res.ok) setNotice({ tone: "bad", text: res.message });
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

  const heading: Record<AuthMode, string> = {
    signin: "Sign in",
    signup: "Become a member",
    reset: "Reset your password",
  };

  const standfirst = gate.reason
    ? gate.reason
    : mode === "signup"
      ? "Members can cart, wishlist and order. It takes a minute."
      : mode === "reset"
        ? "We will email you a link to set a new one."
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

        {mode !== "reset" ? (
          <Field
            id="auth-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder="At least 8 characters"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
          label={mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send link"}
          busyLabel={mode === "signup" ? "Creating…" : "Sending…"}
          busy={busy}
          disabled={!configured}
        />
      </form>

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
