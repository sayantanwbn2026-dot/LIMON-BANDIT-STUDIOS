import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/**
 * Membership, and the gate in front of everything that needs it.
 *
 * Two things live here because they are one mechanism. The site does not just
 * want to know whether you are signed in — it wants to stop an action, ask
 * you to sign in, and then **carry out the action you originally pressed**.
 * Splitting that across two providers means the pending action has to be
 * lifted somewhere they can both see, which is this file anyway.
 *
 *   const { requireAuth } = useAuth();
 *   requireAuth("add this to your cart", () => cart.add(product));
 *
 * Signed in, that runs now. Signed out, it opens the login popup with
 * "Sign in to add this to your cart" at the top, and runs it the moment the
 * session arrives. The user never has to press the button twice.
 *
 * The pending action is held in a ref, not state: it must survive the
 * re-render that signing in causes, and it must fire exactly once.
 */

export type GateReason = string | null;

type AuthState = {
  user: User | null;
  session: Session | null;
  /** true until the first session check resolves — routes must not flash */
  loading: boolean;
  /** false when the env vars are missing; the UI says so rather than failing */
  configured: boolean;

  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  /** Leaves the page for Google and comes back signed in. */
  signInWithGoogle: () => Promise<AuthResult>;
  /** true once the Supabase project has the Google provider switched on */
  googleEnabled: boolean;

  /** run `action` if signed in, otherwise open the gate and run it after */
  requireAuth: (reason: string, action: () => void) => void;
  /** open the popup with no pending action, e.g. the nav's "Sign in" */
  openAuth: (reason?: string, mode?: AuthMode) => void;
  closeAuth: () => void;
  gate: { open: boolean; reason: GateReason; mode: AuthMode };
  setMode: (m: AuthMode) => void;
};

export type AuthMode = "signin" | "signup" | "reset" | "update";

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

export type AuthResult =
  | { ok: true; needsConfirmation?: boolean }
  /* `unconfirmed` lets the caller offer a way out of the one failure
   * that a visitor can recover from without help. */
  | { ok: false; message: string; unconfirmed?: boolean };

const Ctx = createContext<AuthState | null>(null);

const NOT_CONFIGURED =
  "Accounts are not connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env and restart the dev server.";

/**
 * Supabase's auth errors, said in a way a customer can act on.
 *
 * These strings were going straight to the screen. "Invalid login
 * credentials" is a database's way of speaking, and "Email not confirmed"
 * tells someone what is wrong without telling them what to do about it —
 * which matters here more than on most sites, because this project still
 * has email confirmation switched on, so *every* new member hits that
 * state at least once.
 *
 * Anything unrecognised falls through unchanged. A raw message is worse
 * than a written one and much better than a confident wrong guess.
 */
export function readableAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "That email and password do not match an account. Check both — or reset your password below.";
  }
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "This account is not confirmed yet. Open the link we emailed you — check spam — or send it again below.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "There is already an account on that email. Sign in instead, or reset the password.";
  }
  if (m.includes("password should be at least") || m.includes("password is too short")) {
    return "That password is too short. Use at least 8 characters.";
  }
  /* Supabase words its own throttle as "For security purposes, you can
   * only request this after N seconds", which reads like a refusal
   * rather than a wait. */
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts just now. Wait a minute and try again.";
  }
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("network")) {
    return "Could not reach the server. Check your connection and try again.";
  }
  if (m.includes("invalid email") || (m.includes("email") && m.includes("invalid"))) {
    return "That email address does not look right.";
  }
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) {
    return "Google sign-in is not switched on yet. Use your email and password for now.";
  }
  if (m.includes("same password")) {
    return "That is already your password. Pick a different one.";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<GateReason>(null);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [googleEnabled, setGoogleEnabled] = useState(false);

  /* The action that was blocked. Held in a ref so the sign-in re-render does
   * not drop it, and cleared before it runs so it can never fire twice. */
  const pending = useRef<(() => void) | null>(null);
  /* Mirrors `mode` for the release effect, which has to read it
   * without taking a dependency on it. */
  const modeRef = useRef<AuthMode>("signin");
  modeRef.current = mode;

  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | null = null;

    /* `getSupabase()` is dynamic — the module is imported off the critical
     * path — so the effect body cannot itself be async. IIFE, and the
     * `alive` flag guards against writing back after unmount. */
    void (async () => {
      const supabase = await getSupabase();
      if (!alive) return;
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data.session);
      setLoading(false);

      const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
        if (!alive) return;
        setSession(next);
        setLoading(false);
        /* Arriving from a "reset your password" email. Supabase has
         * already exchanged the token and signed them in by this point,
         * so without opening this the visitor lands on the homepage,
         * mysteriously logged in, with the old password still in force
         * and nothing on screen about it. */
        if (event === "PASSWORD_RECOVERY") {
          pending.current = null;
          setReason("Choose a new password.");
          setMode("update");
          setOpen(true);
        }
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    })();

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  /* Which sign-in methods the project actually has switched on.
   *
   * The Google button is shown only when the provider is enabled in
   * Supabase, read from the public settings endpoint rather than
   * hardcoded. A button that is always there but errors until someone
   * configures OAuth is worse than no button: it is the first thing a
   * new visitor would try. Read this way, it appears by itself the
   * moment the provider is turned on, with no deploy. */
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    if (!url || !key) return;
    let alive = true;
    fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { external?: Record<string, boolean> } | null) => {
        if (alive) setGoogleEnabled(Boolean(j?.external?.google));
      })
      /* Unreachable settings just means no Google button — email and
       * password still work, which is the right way to degrade. */
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const user = session?.user ?? null;

  /* When a session appears, close the popup and release whatever the visitor
   * was trying to do when we interrupted them.
   *
   * Keyed on the user's id, NOT the user object. Supabase hands back a
   * fresh object on every token refresh and on every return to the tab,
   * and this effect closes the popup — so on the object it would slam
   * the "choose a new password" prompt shut roughly an hour into a
   * session, or the moment someone switched tabs to go and read the
   * email we just told them to open. The id only changes when the
   * person does.
   *
   * `mode` is read but deliberately not a dependency: the recovery
   * prompt is opened by the auth listener at the same moment the
   * session lands, and re-running this on a mode change would race it. */
  const uid = user?.id ?? null;
  useEffect(() => {
    if (!uid) return;
    if (modeRef.current === "update") return;
    setOpen(false);
    setReason(null);
    const run = pending.current;
    pending.current = null;
    if (run) run();
  }, [uid]);

  const signUp = useCallback(async (input: SignUpInput): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, message: NOT_CONFIGURED };

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: { full_name: input.fullName.trim(), phone: input.phone?.trim() ?? "" },
        /* Home, not /shop. Confirming your email is the end of signing
         * up, not the start of shopping — landing someone in the middle
         * of a product grid gives them no idea whether it worked or
         * where they are. The homepage opens on the hero, which is the
         * one screen on this site that says what the place is. */
        emailRedirectTo: `${window.location.origin}/?confirmed=1`,
      },
    });
    if (error) return { ok: false, message: readableAuthError(error.message) };

    /* An email that already has an account does NOT come back as an
     * error. Supabase deliberately returns a normal-looking user with an
     * empty `identities` array, so that a stranger cannot use the signup
     * form to discover who is registered. Left unhandled, that reads to
     * the actual owner of the address as "Account made — check your
     * inbox", and then no email ever arrives. Same obfuscation, honest
     * wording: it is safe to say this to someone who typed the address. */
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        ok: false,
        message:
          "There is already an account on that email. Sign in instead, or reset the password.",
      };
    }

    /* With "Confirm email" on (still the case on this project) signUp
     * returns a user but no session — they cannot shop until they click
     * the link. Say so, rather than leaving them staring at a popup that
     * did nothing. */
    if (!data.session) return { ok: true, needsConfirmation: true };
    return { ok: true };
  }, []);

  /**
   * Send the confirmation email again.
   *
   * The single most common way to get stuck on this site: sign up, miss
   * the email, come back, try to sign in, and be told the account is not
   * confirmed with no way to do anything about it. Without this the only
   * escape is signing up again, which now correctly refuses because the
   * account already exists — a closed loop.
   */
  const resendConfirmation = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, message: NOT_CONFIGURED };
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/?confirmed=1` },
    });
    if (error) return { ok: false, message: readableAuthError(error.message) };
    return { ok: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, message: NOT_CONFIGURED };

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      return {
        ok: false,
        message: readableAuthError(error.message),
        /* Lets the popup offer "send it again" instead of leaving the
         * one recoverable failure looking like a dead end. */
        unconfirmed: /not confirmed/i.test(error.message),
      };
    }
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, message: NOT_CONFIGURED };

    /* Home, and flagged, for the same reason as the confirmation link —
     * plus one that matters more: the link signs the visitor in and
     * fires PASSWORD_RECOVERY, and something has to be listening in
     * order to actually let them set a new password. This used to point
     * at /shop with nothing listening anywhere, so "reset your password"
     * delivered a working email whose link changed no password: you
     * arrived signed in, on a product grid, with the old password still
     * the only one that worked. */
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/?recover=1`,
    });
    if (error) return { ok: false, message: readableAuthError(error.message) };
    return { ok: true };
  }, []);

  /**
   * Sign in with Google.
   *
   * A full-page redirect, not a popup: popups are blocked by default on
   * iOS Safari and inside Instagram's in-app browser, which is exactly
   * where a music site's visitors arrive from.
   *
   * It comes back to the page it left, not the homepage. A shopper who
   * pressed "Add to cart" and was asked to sign in should land back on
   * that product; the email-confirmation link goes home because that is
   * the end of signing up, but this is the middle of doing something.
   *
   * The pending action cannot survive the trip — it is a function in
   * memory and the page is torn down — so the visitor returns signed in
   * to the right page and presses the button once more. That is one
   * extra tap, and it is honest; serialising arbitrary actions into
   * storage to replay them after a redirect is how carts end up with a
   * phantom item nobody remembers adding.
   */
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, message: NOT_CONFIGURED };
    const back = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: back,
        /* Always show the account chooser. Without it, someone signed
         * into Google with a work account gets silently signed in as
         * that one, with no chance to pick their personal address. */
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) return { ok: false, message: readableAuthError(error.message) };
    return { ok: true };
  }, []);

  /** Set a new password. Only reachable while a recovery session is live. */
  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, message: NOT_CONFIGURED };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, message: readableAuthError(error.message) };
    return { ok: true };
  }, []);

  const openAuth = useCallback((r?: string, m: AuthMode = "signin") => {
    pending.current = null;
    setReason(r ?? null);
    setMode(m);
    setOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    pending.current = null;
    setOpen(false);
    setReason(null);
  }, []);

  const requireAuth = useCallback(
    (r: string, action: () => void) => {
      if (user) {
        action();
        return;
      }
      pending.current = action;
      setReason(r);
      setMode("signin");
      setOpen(true);
    },
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      resendConfirmation,
      signInWithGoogle,
      googleEnabled,
      requireAuth,
      openAuth,
      closeAuth,
      gate: { open, reason, mode },
      setMode,
    }),
    [
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      resendConfirmation,
      signInWithGoogle,
      googleEnabled,
      requireAuth,
      openAuth,
      closeAuth,
      open,
      reason,
      mode,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

/** The name to greet someone by, falling back to the local part of the email. */
export function displayName(user: User | null): string {
  if (!user) return "";
  const meta = user.user_metadata as { full_name?: string } | undefined;
  const full = meta?.full_name?.trim();
  if (full) return full.split(" ")[0];
  return user.email?.split("@")[0] ?? "you";
}
