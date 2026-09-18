import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { useAuth } from "@/lib/auth";
import { myOrders } from "@/lib/orders";
import { inr } from "@/lib/money";
import { pageHead } from "@/lib/seo";

/**
 * Order history.
 *
 * Reads straight from Postgres with the buyer's own session — RLS restricts
 * the table to `auth.uid()`, so there is no user filter in the query and no
 * way to widen it from the client.
 */
export const Route = createFileRoute("/orders")({
  head: () =>
    pageHead({
      title: "Your orders | Limon Bandit",
      description: "Everything you have ordered from the shop.",
      path: "/orders",
      noindex: true,
    }),
  component: Orders,
});

type OrderRow = Awaited<ReturnType<typeof myOrders>>[number];

const STATUS_NOTE: Record<string, string> = {
  received: "With us. Stock is being confirmed by hand.",
  confirmed: "Confirmed and queued to pack.",
  packed: "Packed, waiting on the courier.",
  shipped: "On its way.",
  delivered: "Delivered.",
  cancelled: "Cancelled.",
};

function Orders() {
  const { user, loading, openAuth } = useAuth();
  const [rows, setRows] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      openAuth("Sign in to see your orders.");
      setRows([]);
      return;
    }
    let alive = true;
    void myOrders().then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, [user, loading, openAuth]);

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
              Orders
            </li>
          </ol>
        </nav>
        <h1 data-page-h1 tabIndex={-1} className="t-h2 mt-8 max-w-[18ch] text-text outline-none">
          Your orders
        </h1>
      </header>

      <section className="relative w-full bg-surface-deep pb-[96px] pt-10">
        <GridRules tone="dark" />
        <BoundaryRule tone="dark" className="top-0" />

        <div className="shell relative z-[2]">
          {!user && !loading ? (
            <Empty
              body="Sign in and anything you have ordered shows up here."
              cta={
                <button
                  type="button"
                  onClick={() => openAuth("Sign in to see your orders.")}
                  className="flex h-[56px] items-center justify-center bg-acid px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
                >
                  Sign in
                </button>
              }
            />
          ) : rows === null ? (
            <p className="t-label text-mute">Loading…</p>
          ) : rows.length === 0 ? (
            <Empty
              body="Nothing ordered yet. The runs are small and they do not come back."
              cta={
                <Link
                  to="/shop"
                  className="flex h-[56px] items-center justify-center bg-acid px-8 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text transition-colors duration-300 hover:bg-acid-dim"
                >
                  Go to the shop
                </Link>
              }
            />
          ) : (
            <ul className="border-t border-line">
              {rows.map((o) => {
                const items = (o.items ?? []) as {
                  title: string;
                  qty: number;
                  size: string | null;
                }[];
                return (
                  <li key={o.id} className="border-b border-line py-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
                      <span className="tnum font-display text-[20px] font-extrabold tracking-[0.04em] text-acid-type">
                        {o.reference}
                      </span>
                      <span className="t-label text-mute">
                        {new Date(o.created_at as string).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="tnum ml-auto font-display text-[20px] font-extrabold tracking-[-0.02em] text-text">
                        {inr(o.total_inr as number)}
                      </span>
                    </div>

                    <p className="mt-4 font-ui text-[14px] leading-[1.5] text-mute">
                      {items
                        .map((i) => `${i.qty}× ${i.title}${i.size ? ` (${i.size})` : ""}`)
                        .join(", ")}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <span className="bg-surface-raised px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-acid-type">
                        {String(o.status)}
                      </span>
                      <span className="t-label text-mute">
                        {STATUS_NOTE[String(o.status)] ?? ""}
                      </span>
                      {o.payment_status === "pending" ? (
                        <span className="t-label text-mute">Pay on delivery</span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function Empty({ body, cta }: { body: string; cta: React.ReactNode }) {
  return (
    <div className="max-w-[560px]">
      <p className="font-ui text-[16px] leading-[1.6] text-mute">{body}</p>
      <div className="mt-10">{cta}</div>
    </div>
  );
}
