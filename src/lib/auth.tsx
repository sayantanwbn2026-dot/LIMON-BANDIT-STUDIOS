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

  /** run `action` if signed in, otherwise open the gate and run it after */
  requireAuth: (reason: string, action: () => void) => void;
  /** open the popup with no pending action, e.g. the nav's "Sign in" */
  openAuth: (reason?: string, mode?: AuthMode) => void;
  closeAuth: () => void;
  gate: { open: boolean; reason: GateReason; mode: AuthMode };
  setMode: (m: AuthMode) => void;
};

export type AuthMode = "signin" | "signup" | "reset";

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; message: string };

const Ctx = createContext<AuthState | null>(null);

const NOT_CONFIGURED =
  "Accounts are not connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env and restart the dev server.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<GateReason>(null);
  const [mode, setMode] = useState<AuthMode>("signin");

  /* The action that was blocked. Held in a ref so the sign-in re-render does
   * not drop it, and cleared before it runs so it can never fire twice. */
  const pending = useRef<(() => void) | null>(null);

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

      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        if (!alive) return;
        setSession(next);
        setLoading(false);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    })();

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  const user = session?.user ?? null;

  /* When a session appears, close the popup and release whatever the visitor
   * was trying to do when we interrupted them. */
  useEffect(() => {
    if (!user) return;
    setOpen(false);
    setReason(null);
    const run = pending.current;
    pending.current = null;
    if (run) run();
  }, [user]);

  const signUp = useCallback(async (input: SignUpInput): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, message: NOT_CONFIGURED };

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: { full_name: input.fullName.trim(), phone: input.phone?.trim() ?? "" },
        emailRedirectTo: `${window.location.origin}/shop`,
      },
    });
    if (error) return { ok: false, message: error.message };

    /* With "Confirm email" on (the Supabase default) signUp returns a user
     * but no session — they cannot shop until they click the link. Say so,
     * rather than leaving them staring at a popup that did nothing. */
    if (!data.session) return { ok: true, needsConfirmation: true };
    return { ok: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, message: NOT_CONFIGURED };

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, message: error.message };
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

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/shop`,
    });
    if (error) return { ok: false, message: error.message };
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
