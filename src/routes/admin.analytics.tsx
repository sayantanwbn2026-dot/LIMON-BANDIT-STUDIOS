import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminHeading } from "@/components/admin/AdminShell";
import { analytics, commerceStats, type DailyPoint, type Summary, type TopPath } from "@/cms/admin";
import { inr } from "@/lib/money";

export const Route = createFileRoute("/admin/analytics")({
  component: Analytics,
});

const RANGES = [7, 30, 90];

/**
 * First-party traffic, measured by the site itself.
 *
 * No third-party script and no cookie: a per-tab random id in sessionStorage
 * and a path, which is enough for visits, top pages and a daily trend and not
 * enough to follow anyone anywhere. That means no bounce rate and no session
 * duration — those need cross-visit identity, which is exactly the thing not
 * being collected. Said plainly at the bottom of the page rather than
 * implied by their absence.
 */
function Analytics() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [top, setTop] = useState<TopPath[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [shop, setShop] = useState({ orders: 0, revenue: 0, signups: 0, wishlist: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void Promise.all([analytics(days), commerceStats(days)]).then(([a, s]) => {
      if (!alive) return;
      setSummary(a.summary);
      setTop(a.top);
      setDaily(a.daily);
      setShop(s);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [days]);

  const peak = Math.max(1, ...daily.map((d) => d.views));

  return (
    <>
      <AdminHeading
        title="Analytics"
        standfirst="Traffic measured by the site itself — no third-party tracker, no cookies."
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

      <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        <Stat label="Page views" value={summary ? String(summary.total_views) : "—"} />
        <Stat label="Visitors" value={summary ? String(summary.unique_sessions) : "—"} />
        <Stat label="Orders" value={String(shop.orders)} />
        <Stat label="Revenue" value={inr(shop.revenue)} />
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
            Shop
          </h2>
          <dl className="mt-6 border-t border-line">
            <Row k="Mailing list signups" v={String(shop.signups)} />
            <Row k="Wishlist adds" v={String(shop.wishlist)} />
            <Row k="Orders placed" v={String(shop.orders)} />
            <Row k="Revenue" v={inr(shop.revenue)} />
          </dl>
        </section>
      </div>

      <p className="mt-14 max-w-[70ch] border-l-2 border-line py-2 pl-5 font-ui text-[13px] leading-[1.6] text-mute">
        Counted on the site itself, with a random id that lasts as long as the browser tab and no
        cookie. That is enough for the numbers above and deliberately not enough to follow anyone
        between visits — which is also why there is no bounce rate or time-on-page here. If you ever
        need those, they need a proper analytics product and a cookie notice.
      </p>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-deep p-5">
      <p className="t-label text-mute">{label}</p>
      <p className="tnum mt-3 font-display text-[24px] font-extrabold tracking-[-0.02em] text-text">
        {value}
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <dt className="font-ui text-[13px] text-mute">{k}</dt>
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
