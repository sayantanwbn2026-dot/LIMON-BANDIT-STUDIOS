import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, LogOut, Package } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Field } from "@/components/lb/Field";
import { Button } from "@/components/lb/Button";
import { Skeleton } from "@/components/lb/Skeleton";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { loadProfile, saveProfile } from "@/lib/profile";
import { myOrders } from "@/lib/orders";
import { useToast } from "@/lib/toast";
import { inr } from "@/lib/money";
import { pageHead } from "@/lib/seo";

/**
 * The account dashboard.
 *
 * Signing in used to change exactly one thing on screen: the "Sign in" button
 * became an avatar with a three-item dropdown. There was nowhere to *be*
 * signed in — no page that belonged to the person, no way to correct the name
 * on their orders, nothing that answered "what is in this account".
 *
 * This is that page, and it is deliberately a landing rather than a
 * destination in itself. Orders already have a full page and the wishlist is
 * a drawer; duplicating either here would mean two places to fix when one of
 * them changes. So it summarises and hands off: how many orders and what the
 * last one was, how many saved items, and the one thing that lives nowhere
 * else — the name and phone that go on the next order.
 *
 * `noindex`, like /orders: a page that is empty to everyone except one person
 * has nothing to offer a search engine, and the title alone would leak that
 * the account exists.
 */
export const Route = createFileRoute("/account")({
  head: () =>
    pageHead({
      title: "Your account | Limon Bandit",
      description: "Your details, orders and saved items.",
      path: "/account",
      noindex: true,
    }),
  component: Account,
});

function Account() {
  const { user, loading, openAuth, signOut } = useAuth();
  const wishlist = useWishlist();
  const toast = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof myOrders>> | null>(null);

  /* Seed the form from the profile row, falling back to the metadata the
   * account was created with. Someone who signed up through the popup has a
   * `full_name` in their user metadata and an empty profile row, and showing
   * them a blank name box reads as the site having lost it. */
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      const [p, o] = await Promise.all([loadProfile(), myOrders()]);
      if (!alive) return;
      const meta = (user.user_metadata ?? {}) as { full_name?: string; phone?: string };
      setFullName(p?.full_name ?? meta.full_name ?? "");
      setPhone(p?.phone ?? meta.phone ?? "");
      setOrders(o);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const res = await saveProfile(user.id, { full_name: fullName, phone });
      if (res.ok) toast.ok("Saved.");
      else toast.error(res.error);
    } finally {
      setBusy(false);
    }
  };

  const spent = (orders ?? []).reduce((n, o) => n + (o.total_inr ?? 0), 0);
  const last = orders?.[0];

  return (
    <main id="main" className="relative w-full bg-surface-deep">
      <header className="shell relative z-[2] pb-10 pt-[120px]">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
            <li>
              <Link to="/" className="transition-colors duration-300 hover:text-text">
                LMN&middot;BNDT
              </Link>
            </li>
            <li aria-hidden="true" className="opacity-50">
              /
            </li>
            <li aria-current="page" className="text-text">
              Account
            </li>
          </ol>
        </nav>
        <h1 data-page-h1 tabIndex={-1} className="t-h2 mt-8 max-w-[18ch] text-text outline-none">
          Your account
        </h1>
        {user ? (
          <p className="mt-4 font-ui text-[14px] text-mute">
            Signed in as <span className="text-text">{user.email}</span>
          </p>
        ) : null}
      </header>

      <section className="relative w-full bg-surface-deep pb-[96px] pt-10">
        <GridRules tone="dark" />
        <BoundaryRule tone="dark" className="top-0" />

        <div className="shell relative z-[2]">
          {!user && !loading ? (
            <div className="max-w-[560px]">
              <p className="font-ui text-[16px] leading-[1.6] text-mute">
                Sign in and your details, orders and saved items live here.
              </p>
              <div className="mt-10">
                <Button onClick={() => openAuth("Sign in to see your account.")}>Sign in</Button>
              </div>
            </div>
          ) : !user || !ready ? (
            /* Shaped like the two panels below, so nothing jumps when the
             * profile and the orders land. */
            <div className="grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-[1fr_360px]">
              <div className="bg-surface-deep p-6">
                <Skeleton w="38%" h={10} />
                <Skeleton w="100%" h={44} className="mt-6" />
                <Skeleton w="100%" h={44} className="mt-4" />
                <Skeleton w={140} h={44} className="mt-6" />
              </div>
              <div className="bg-surface-deep p-6">
                <Skeleton w="48%" h={10} />
                <Skeleton w="70%" h={28} className="mt-4" />
                <Skeleton w="56%" h={12} className="mt-6" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-[1fr_360px]">
              {/* ---- the only thing that lives nowhere else ---- */}
              <div className="bg-surface-deep p-6 sm:p-8">
                <h2 className="t-label text-mute">Your details</h2>
                <p className="mt-3 max-w-[48ch] font-ui text-[14px] leading-[1.5] text-mute">
                  These go on your next order, so you do not type them again at checkout.
                </p>

                <form onSubmit={onSave} noValidate className="mt-8 max-w-[420px] space-y-6">
                  <Field
                    id="account-name"
                    label="Name"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Who is ordering"
                    autoComplete="name"
                  />
                  <Field
                    id="account-phone"
                    label="Phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+91"
                    autoComplete="tel"
                    hint="Optional. Logistics call this one when they are outside."
                  />
                  {/* Email is shown in the header and not editable here.
                   * Changing it is a different operation with its own
                   * confirmation email, and a box that looks editable but
                   * silently does nothing is worse than no box. */}
                  <Button type="submit" loading={busy} loadingLabel="Saving…">
                    Save details
                  </Button>
                </form>
              </div>

              {/* ---- summaries that hand off rather than duplicate ---- */}
              <div className="bg-surface-deep p-6 sm:p-8">
                <h2 className="t-label text-mute">Orders</h2>
                {orders && orders.length > 0 ? (
                  <>
                    <p className="tnum mt-3 font-display text-[28px] font-extrabold tracking-[-0.02em] text-text">
                      {orders.length}
                    </p>
                    <p className="mt-1 font-ui text-[13px] text-mute">
                      {inr(spent)} all time
                      {last ? (
                        <>
                          <span aria-hidden="true" className="px-2 text-line-strong">
                            &middot;
                          </span>
                          last{" "}
                          {new Date(last.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </>
                      ) : null}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 font-ui text-[13px] leading-[1.5] text-mute">
                    Nothing ordered yet.
                  </p>
                )}
                <Link
                  to="/orders"
                  className="mt-5 inline-flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.12em] text-text transition-colors duration-300 hover:text-acid-type"
                >
                  <Package size={14} />
                  <span className="wipe-underline">See your orders</span>
                </Link>

                <h2 className="t-label mt-10 border-t border-line pt-8 text-mute">Saved</h2>
                <p className="tnum mt-3 font-display text-[28px] font-extrabold tracking-[-0.02em] text-text">
                  {wishlist.count}
                </p>
                <p className="mt-1 font-ui text-[13px] text-mute">
                  {wishlist.count === 1 ? "item on your list" : "items on your list"}
                </p>
                <button
                  type="button"
                  onClick={() => wishlist.setOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.12em] text-text transition-colors duration-300 hover:text-acid-type"
                >
                  <Heart size={14} />
                  <span className="wipe-underline">Open your wishlist</span>
                </button>

                {/* Sign out lives at the bottom of the page as well as in the
                 * header menu. The menu is where you reach for it by habit;
                 * this is where you look when you are already here and done. */}
                <div className="mt-10 border-t border-line pt-8">
                  <Button variant="ghost" onClick={() => void signOut()}>
                    <LogOut size={14} />
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
