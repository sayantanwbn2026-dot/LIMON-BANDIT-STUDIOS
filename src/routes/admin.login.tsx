import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { GridRules } from "@/components/lb/GridRules";
import { Field, FormNotice } from "@/components/lb/Field";
import { Logotype } from "@/components/sections/Nav";
import { useAuth } from "@/lib/auth";
import { checkAdmin } from "@/cms/admin";
import { pageHead } from "@/lib/seo";

/**
 * Admin sign-in.
 *
 * Uses the same Supabase auth as the shop, on purpose — one identity system,
 * one password reset flow, one place sessions expire. What separates an
 * editor from a shopper is the `admins` row, checked after the credentials
 * are accepted.
 *
 * A failed admin check signs the session straight back out. Leaving a
 * shopper's session live on the admin subtree would mean the guard is the
 * only thing standing between them and the editing UI; signing out means the
 * page is simply not usable, which is a better shape for the same refusal.
 */
export const Route = createFileRoute("/admin/login")({
  head: () =>
    pageHead({
      title: "Admin sign-in | Limon Bandit",
      description: "Content management sign-in.",
      path: "/admin/login",
      noindex: true,
    }),
  component: AdminLogin,
});

function AdminLogin() {
  const { signIn, signOut, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Already signed in and already an admin? Go straight through rather than
   * making someone re-enter a password they clearly still have. */
  useEffect(() => {
    if (loading || !user || busy) return;
    let alive = true;
    void checkAdmin().then(({ admin }) => {
      if (alive && admin) void navigate({ to: "/admin" });
    });
    return () => {
      alive = false;
    };
  }, [user, loading, busy, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const res = await signIn(email, password);
    if (!res.ok) {
      setBusy(false);
      setError(res.message);
      return;
    }

    const { admin } = await checkAdmin();
    setBusy(false);

    if (!admin) {
      await signOut();
      setError(
        `${email.trim()} is not on the admin list. If that is wrong, ask an owner to add it.`,
      );
      return;
    }

    void navigate({ to: "/admin" });
  };

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-surface-deep px-6">
      <GridRules tone="dark" />

      <div className="relative z-[2] mx-auto w-full max-w-[440px]">
        <div className="mb-10 text-text">
          <Logotype size={18} />
        </div>

        <span className="flex items-center gap-3">
          <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-acid" />
          <span className="t-label text-mute">Content management</span>
        </span>

        <h1 className="mt-6 font-display text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-text">
          Sign in
        </h1>

        <form onSubmit={onSubmit} noValidate className="mt-10 space-y-7">
          <Field
            id="admin-email"
            label="Email"
            type="email"
            inputMode="email"
            value={email}
            onChange={setEmail}
            placeholder="you@limonbandit.com"
            autoComplete="email"
            required
          />
          <Field
            id="admin-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />

          {error ? <FormNotice>{error}</FormNotice> : null}

          <button
            type="submit"
            disabled={busy}
            className="group flex h-[56px] w-full items-center justify-between gap-6 bg-acid px-7 transition-colors duration-300 hover:bg-acid-dim disabled:opacity-60"
          >
            <span className="t-action text-accent-text">{busy ? "Checking…" : "Sign in"}</span>
            <ArrowRight size={16} className="text-accent-text lb-arrow" />
          </button>
        </form>

        <p className="t-label mt-8 text-mute">
          Editing the website. Not the same as a shop account — this one has to be on the admin
          list.
        </p>
      </div>
    </main>
  );
}
