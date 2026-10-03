import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminHeading } from "@/components/admin/AdminShell";
import {
  analytics,
  commerceStats,
  insights,
  type DailyPoint,
  type Insights,
  type Summary,
  type TopPath,
} from "@/cms/admin";
import { inboxCounts } from "@/cms/inbox";
import { inr } from "@/lib/money";

export const Route = createFileRoute("/admin/analytics")({
  component: Analytics,
});

const RANGES = [7, 30, 90];

/**
 * What the house can see about itself.
 *
 * TRAFFIC is measured first-party: a per-tab random id in sessionStorage and a
 * path, which is enough for visits, top pages and a daily trend and not enough
 * to follow anyone anywhere. That means no bounce rate and no session duration
 * — those need cross-visit identity, which is exactly the thing not being
 * collected. Said plainly at the bottom of the page rather than implied by
 * their absence.
 *
 * THE REST is the business: enquiries and what people asked for, orders and
 * where they are, what is nearly out of stock, what the reviews say. It used to
 * be a dashboard of traffic and revenue, which is the half you cannot act on.
 * The top row now answers "is anything waiting for me?" before it answers "how
 * are we doing?", because the first question has a deadline attached.
 *
 * WHAT IS AND IS NOT WINDOWED: the range buttons change the window on views,
 * enquiries, orders and revenue — things that happen on a date. Stock and
 * reviews are a state, not a flow: "three tees left" is true today regardless
 * of which window you are looking at, so those read whole and say so.
 */
function Analytics() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [top, setTop] = useState<TopPath[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [shop, setShop] = useState({ orders: 0, revenue: 0, signups: 0, wishlist: 0 });
  const [ins, setIns] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  /* The open-work counts are NOT windowed and are not computed here — they
   * come from `inboxCounts()`, the same call the dashboard makes, so the two
   * screens cannot disagree about how many orders need packing. A backlog is
   * also not a flow: an enquiry from 40 days ago is still unanswered, so
   * putting it inside the 30-day window would hide it. Hence a separate
   * effect with no `days` dependency — switching the range does not refetch
   * something the range does not affect. */
  const [open, setOpen] = useState<{ orders: number | null; enquiries: number | null }>({
    orders: null,
    enquiries: null,
  });

  useEffect(() => {
    let alive = true;
    void inboxCounts().then((w) => alive && setOpen(w));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void Promise.all([analytics(days), commerceStats(days), insights(days)]).then(([a, s, i]) => {
      if (!alive) return;
      setSummary(a.summary);
      setTop(a.top);
      setDaily(a.daily);
      setShop(s);
      setIns(i);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [days]);

  const peak = Math.max(1, ...daily.map((d) => d.views));
  const views = summary?.total_views ?? 0;

  /* Orders per hundred views. Stated as a rate rather than a percentage with
   * two decimal places, because on these volumes "0.83%" reads as precision
   * that is not there. */
  const per100 = views > 0 ? Math.round((shop.orders / views) * 1000) / 10 : null;

  const waiting = (open.orders ?? 0) + (open.enquiries ?? 0);
  const outOfStock = ins?.stock.soldOut.length ?? 0;
  const lowStock = ins?.stock.low.length ?? 0;

  return (
    <>
      <AdminHeading
        title="Insights"
        standfirst="Traffic, the inbox, the shop and the shelf — measured by the site itself, no third-party tracker."
        aside={
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDays(r)}
                aria-pressed={days === r}
                className={`h-9 px-3 font-ui text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-300 ${
                  days === r
                    ? "bg-acid text-accent-text"
                    : "border border-line text-mute hover:border-acid-type hover:text-text"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      />

      {/* NEEDS YOU — above the numbers on purpose.
       *
       * This strip only exists when there is something in it. An "all clear"
       * banner that is permanently on screen stops being read within a week,
       * and then the one day it says something is the day nobody looks. */}
      {!loading && (waiting > 0 || outOfStock > 0 || lowStock > 0) ? (
        <div className="ui-panel mb-8 border border-line p-5">
          <p className="t-label text-acid-type">Needs you</p>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {open.orders ? (
              <li>
                <Link
                  to="/admin/orders"
                  className="font-ui text-[13px] font-semibold text-text underline decoration-line underline-offset-4 hover:decoration-acid-type"
                >
                  {open.orders} {plural(open.orders, "order")} still open
                </Link>
              </li>
            ) : null}
            {open.enquiries ? (
              <li>
                <Link
                  to="/admin/enquiries"
                  className="font-ui text-[13px] font-semibold text-text underline decoration-line underline-offset-4 hover:decoration-acid-type"
                >
                  {open.enquiries} unanswered {plural(open.enquiries, "enquiry", "enquiries")}
                </Link>
              </li>
            ) : null}
            {outOfStock > 0 ? (
              <li className="font-ui text-[13px] font-semibold text-danger">
                {outOfStock} {plural(outOfStock, "product")} sold out
              </li>
            ) : null}
            {lowStock > 0 ? (
              <li className="font-ui text-[13px] font-semibold text-text">
                {lowStock} running low
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        <Stat label="Page views" value={summary ? String(views) : "—"} />
        <Stat label="Visitors" value={summary ? String(summary.unique_sessions) : "—"} />
        <Stat label="Enquiries" value={ins ? String(ins.enquiries.total) : "—"} />
        <Stat label="Orders" value={String(shop.orders)} />
      </div>

      <div className="mt-px grid grid-cols-2 gap-px border border-t-0 border-line bg-line lg:grid-cols-4">
        <Stat label="Revenue" value={inr(shop.revenue)} />
        <Stat
          label="Average order"
          value={ins && ins.orders.averageOrder > 0 ? inr(ins.orders.averageOrder) : "—"}
        />
        <Stat
          label="Orders per 100 views"
          value={per100 === null ? "—" : per100.toFixed(1)}
          note={views > 0 && views < 200 ? "too little traffic to mean much yet" : undefined}
        />
        <Stat
          label="Reviews"
          value={ins && ins.reviews.count > 0 ? `${ins.reviews.average} / 5` : "—"}
          note={ins && ins.reviews.count > 0 ? `${ins.reviews.count} all time` : undefined}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="font-display text-[18px] font-extrabold uppercase tracking-[-0.02em] text-text">
            Traffic
          </h2>
          {loading ? (
            <p className="t-label mt-5 text-mute">Loading…</p>
          ) : daily.length === 0 ? (
            <Empty />
          ) : (
            <div className="mt-6 border border-line bg-surface-deep p-5">
              <div className="flex h-[180px] items-end gap-[3px]">
                {daily.map((d) => (
                  <div
                    key={d.day}
                    title={`${d.day}: ${d.views} views, ${d.sessions} visitors`}
                    className="flex-1 bg-acid transition-opacity hover:opacity-70"
                    style={{ height: `${Math.max(2, (d.views / peak) * 100)}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between">
                <span className="t-label text-mute">{daily[0]?.day}</span>
                <span className="t-label text-mute">{daily[daily.length - 1]?.day}</span>
              </div>
            </div>
          )}

          {/* WHAT PEOPLE ASKED FOR.
           *
           * The contact form's intent field is the only place anyone states
           * what they actually want from the house, and until now it was
           * readable one enquiry at a time. In aggregate it is the clearest
           * demand signal the site produces. */}
          <h2 className="mt-12 font-display text-[18px] font-extrabold uppercase tracking-[-0.02em] text-text">
            What people asked for
          </h2>
          {!ins || ins.enquiries.byIntent.length === 0 ? (
            <p className="t-label mt-5 text-mute">
              {loading ? "Loading…" : "No enquiries in this window."}
            </p>
          ) : (
            <ul className="mt-6 border-t border-line">
              {ins.enquiries.byIntent.map((r) => (
                <li key={r.intent} className="border-b border-line py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-ui text-[13px] capitalize text-text">{r.intent}</span>
                    <span className="tnum shrink-0 font-ui text-[13px] font-semibold text-acid-type">
                      {r.count}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-2 h-[3px] bg-acid"
                    style={{ width: `${(r.count / ins.enquiries.total) * 100}%` }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-[18px] font-extrabold uppercase tracking-[-0.02em] text-text">
            Top pages
          </h2>
          {top.length === 0 ? (
            <p className="t-label mt-5 text-mute">No visits recorded yet.</p>
          ) : (
            <ul className="mt-6 border-t border-line">
              {top.map((t) => (
                <li
                  key={t.path}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                >
                  <span className="truncate font-mono text-[12px] text-text">{t.path}</span>
                  <span className="tnum shrink-0 font-ui text-[12px] font-semibold text-acid-type">
                    {t.views}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 font-display text-[18px] font-extrabold uppercase tracking-[-0.02em] text-text">
            Orders
          </h2>
          {!ins || ins.orders.byStatus.length === 0 ? (
            <p className="t-label mt-5 text-mute">
              {loading ? "Loading…" : "No orders in this window."}
            </p>
          ) : (
            <dl className="mt-6 border-t border-line">
              {ins.orders.byStatus.map((r) => (
                <Row key={r.status} k={r.status} v={String(r.count)} />
              ))}
            </dl>
          )}

          <h2 className="mt-10 font-display text-[18px] font-extrabold uppercase tracking-[-0.02em] text-text">
            Selling
          </h2>
          {!ins || ins.orders.topSellers.length === 0 ? (
            <p className="t-label mt-5 text-mute">
              {loading ? "Loading…" : "Nothing sold in this window."}
            </p>
          ) : (
            <ul className="mt-6 border-t border-line">
              {ins.orders.topSellers.map((p) => (
                <li
                  key={p.id}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                >
                  <Link
                    to="/shop/$id"
                    params={{ id: p.id }}
                    className="truncate font-ui text-[13px] text-text underline decoration-line underline-offset-4 hover:decoration-acid-type"
                  >
                    {p.title}
                  </Link>
                  <span className="tnum shrink-0 font-ui text-[13px] font-semibold text-text">
                    {p.qty}
                    <span className="pl-2 font-normal text-mute">{inr(p.revenue)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 font-display text-[18px] font-extrabold uppercase tracking-[-0.02em] text-text">
            The shelf
          </h2>
          {!ins ? (
            <p className="t-label mt-5 text-mute">Loading…</p>
          ) : ins.stock.soldOut.length === 0 && ins.stock.low.length === 0 ? (
            <p className="mt-5 font-ui text-[13px] leading-[1.6] text-mute">
              Nothing is low. Digital items are not counted — there is no run to run out of.
            </p>
          ) : (
            <ul className="mt-6 border-t border-line">
              {ins.stock.soldOut.map((p) => (
                <li
                  key={p.id}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                >
                  <Link
                    to="/shop/$id"
                    params={{ id: p.id }}
                    className="truncate font-ui text-[13px] text-text underline decoration-line underline-offset-4 hover:decoration-acid-type"
                  >
                    {p.title}
                  </Link>
                  <span className="t-label shrink-0 text-danger">Sold out</span>
                </li>
              ))}
              {ins.stock.low.map((p) => (
                <li
                  key={p.id}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                >
                  <Link
                    to="/shop/$id"
                    params={{ id: p.id }}
                    className="truncate font-ui text-[13px] text-text underline decoration-line underline-offset-4 hover:decoration-acid-type"
                  >
                    {p.title}
                  </Link>
                  <span className="tnum shrink-0 font-ui text-[13px] font-semibold text-text">
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 font-display text-[18px] font-extrabold uppercase tracking-[-0.02em] text-text">
            Audience
          </h2>
          <dl className="mt-6 border-t border-line">
            <Row k="Mailing list signups" v={String(shop.signups)} />
            <Row k="Wishlist adds" v={String(shop.wishlist)} />
          </dl>
        </section>
      </div>

      <p className="mt-14 max-w-[70ch] border-l-2 border-line py-2 pl-5 font-ui text-[13px] leading-[1.6] text-mute">
        Traffic is counted on the site itself, with a random id that lasts as long as the browser
        tab and no cookie. That is enough for the numbers above and deliberately not enough to
        follow anyone between visits — which is also why there is no bounce rate or time-on-page
        here. If you ever need those, they need a proper analytics product and a cookie notice.
        Views, enquiries, orders and revenue follow the range above; stock and reviews are
        today&rsquo;s state and read whole.
      </p>
    </>
  );
}

function plural(n: number, one: string, many?: string) {
  return n === 1 ? one : (many ?? `${one}s`);
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-surface-deep p-5">
      <p className="t-label text-mute">{label}</p>
      <p className="tnum mt-3 font-display text-[24px] font-extrabold tracking-[-0.02em] text-text">
        {value}
      </p>
      {note ? <p className="mt-2 font-ui text-[11px] leading-[1.4] text-mute">{note}</p> : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <dt className="font-ui text-[13px] capitalize text-mute">{k}</dt>
      <dd className="tnum font-ui text-[13px] font-semibold text-text">{v}</dd>
    </div>
  );
}

function Empty() {
  return (
    <p className="mt-6 max-w-[52ch] font-ui text-[14px] leading-[1.6] text-mute">
      Nothing recorded yet. Visits start being counted as soon as someone opens the site — including
      you, so open the site in another tab and this will fill in.
    </p>
  );
}
