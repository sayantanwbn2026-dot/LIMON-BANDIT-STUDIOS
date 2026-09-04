import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock } from "lucide-react";
import { AdminHeading } from "@/components/admin/AdminShell";
import { PAGES } from "@/cms/schema";
import { collections, pageCollections } from "@/cms/collections";
import { recentChanges, commerceStats, type AuditRow } from "@/cms/admin";
import { inr } from "@/lib/money";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

/**
 * The landing screen.
 *
 * Answers the two questions someone actually opens the admin with — "what can
 * I change" and "what changed recently" — rather than showing a wall of
 * charts nobody asked for. The numbers here are the ones that move: orders,
 * revenue, list signups.
 */
function Dashboard() {
  const [changes, setChanges] = useState<AuditRow[]>([]);
  const [stats, setStats] = useState({ orders: 0, revenue: 0, signups: 0, wishlist: 0 });

  useEffect(() => {
    let alive = true;
    void recentChanges(8).then((r) => alive && setChanges(r));
    void commerceStats(30).then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <AdminHeading
        title="Dashboard"
        standfirst="Everything on the website can be changed from here. Pick a page to edit what appears on it, or Global for the things that appear everywhere."
      />

      <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        <Stat label="Orders — 30 days" value={String(stats.orders)} />
        <Stat label="Revenue — 30 days" value={inr(stats.revenue)} />
        <Stat label="List signups" value={String(stats.signups)} />
        <Stat label="Wishlist adds" value={String(stats.wishlist)} />
      </div>

      <h2 className="mt-14 font-display text-[18px] font-extrabold uppercase tracking-[-0.02em] text-text">
        Pages
      </h2>
      <ul className="mt-5 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {PAGES.map((p) => {
          const n = pageCollections(p.key).length;
          return (
            <li key={p.key} className="bg-surface-deep">
              <Link
                to="/admin/page/$page"
                params={{ page: p.key }}
                className="group flex h-full flex-col justify-between gap-6 p-6 transition-colors duration-300 hover:bg-surface-raised"
              >
                <div>
                  <span className="font-display text-[20px] font-extrabold uppercase tracking-[-0.02em] text-text">
                    {p.label}
                  </span>
                  <p className="mt-2 font-ui text-[12px] text-mute">
                    {n > 0
                      ? `${n} editable ${n === 1 ? "section" : "sections"}`
                      : "Titles & SEO only"}
                  </p>
                </div>
                <span className="flex items-center gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors group-hover:text-acid-type">
                  Edit
                  <ArrowUpRight size={13} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-14 font-display text-[18px] font-extrabold uppercase tracking-[-0.02em] text-text">
        Recent changes
      </h2>
      {changes.length === 0 ? (
        <p className="mt-5 font-ui text-[14px] text-mute">
          Nothing has been edited yet. Every change is recorded here with who made it.
        </p>
      ) : (
        <ul className="mt-5 border-t border-line">
          {changes.map((c) => {
            const title = collections.find((x) => x.key === c.key)?.title ?? c.key;
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-line py-4"
              >
                <Clock size={13} className="shrink-0 text-mute" />
                <span className="font-ui text-[13px] font-semibold text-text">{title}</span>
                <span className="font-ui text-[12px] text-mute">{c.actor ?? "unknown"}</span>
                <span className="t-label ml-auto text-mute">
                  {new Date(c.created_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-deep p-5">
      <p className="t-label text-mute">{label}</p>
      <p className="tnum mt-3 font-display text-[26px] font-extrabold tracking-[-0.02em] text-text">
        {value}
      </p>
    </div>
  );
}
