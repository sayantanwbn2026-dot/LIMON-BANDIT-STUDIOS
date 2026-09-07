import { useEffect, useState, type ReactNode } from "react";
import { Outlet, createFileRoute, useRouterState, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { checkAdmin } from "@/cms/admin";
import { useAuth } from "@/lib/auth";
import { pageHead } from "@/lib/seo";

/**
 * The admin layout and its gate.
 *
 * Two conditions to get past: a Supabase session, and a row in `admins` for
 * that email. The second is asked of the database rather than assumed from
 * the first, because being able to sign in is not the same as being allowed
 * to edit — every shopper on the site has an account.
 *
 * This guard hides the UI. It is not the security boundary: RLS on
 * `cms_documents`, `cms_media` and `admins` is, and it refuses writes from
 * a non-admin session no matter what the browser renders. Treating this as
 * cosmetic is the correct way to think about it.
 *
 * `/admin/login` is a child of this route but must not be gated, or signing
 * in would require being signed in.
 */
export const Route = createFileRoute("/admin")({
  head: () =>
    pageHead({
      title: "Admin | Limon Bandit",
      description: "Content management.",
      path: "/admin",
      noindex: true,
    }),
  component: AdminLayout,
});

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/admin/login")) return <Outlet />;
  return (
    <Guard>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </Guard>
  );
}

function Guard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setState("denied");
      return;
    }
    let alive = true;
    void checkAdmin().then(({ admin }) => {
      if (alive) setState(admin ? "allowed" : "denied");
    });
    return () => {
      alive = false;
    };
  }, [user, loading]);

  if (loading || state === "checking") {
    return (
      <Centered>
        <p className="t-label text-mute">Checking access…</p>
      </Centered>
    );
  }

  if (state === "denied") {
    return (
      <Centered>
        <span className="mb-6 flex items-center gap-3">
          <span className="h-[10px] w-[10px] shrink-0 bg-acid" />
          <span className="t-label text-mute">Restricted</span>
        </span>
        <h1 className="font-display text-[34px] font-extrabold uppercase leading-[1] tracking-[-0.03em] text-text">
          Staff only
        </h1>
        <p className="mt-6 max-w-[46ch] font-ui text-[15px] leading-[1.6] text-mute">
          {user
            ? `${user.email} is signed in, but is not on the admin list. Ask an owner to add it, then reload.`
            : "This area needs an admin account."}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/admin/login"
            className="flex h-12 items-center justify-center bg-acid px-7 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
          >
            {user ? "Sign in as someone else" : "Sign in"}
          </Link>
          <a
            href="/"
            className="flex h-12 items-center justify-center border border-line px-7 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-acid-type"
          >
            Back to the site
          </a>
        </div>
      </Centered>
    );
  }

  return <>{children}</>;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center bg-surface-deep px-6">
      <div className="mx-auto w-full max-w-[560px]">{children}</div>
    </main>
  );
}
