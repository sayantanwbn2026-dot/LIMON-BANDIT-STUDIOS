import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Globe,
  Image,
  LayoutGrid,
  LogOut,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { PAGES } from "@/cms/schema";
import { useAuth } from "@/lib/auth";
import { Logotype } from "@/components/sections/Nav";

/**
 * The admin frame: a fixed sidebar and the working area beside it.
 *
 * Deliberately not the site's own chrome. The public site is an editorial
 * object — scroll choreography, a cursor, smooth scrolling, a preloader —
 * and every one of those is hostile to a form you are trying to type into.
 * The design language carries over (square corners, hairline rules, acid
 * accent, the same two typefaces) so it is recognisably the same house,
 * but nothing here moves unless it was asked to.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [navOpen, setNavOpen] = useState(false);

  /* Close the mobile drawer whenever the route changes, or it stays open on
   * top of the page you just navigated to. */
  useEffect(() => {
    setNavOpen(false);
  }, [path]);

  return (
    <div className="min-h-screen bg-surface text-text">
      {/* top bar — mobile only */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-surface-deep px-4 py-3 lg:hidden">
        <Link to="/admin" className="text-text">
          <Logotype size={15} />
        </Link>
        <button
          type="button"
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          className="flex h-10 items-center border border-line px-3 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-text"
        >
          {navOpen ? "Close" : "Menu"}
        </button>
      </header>

      <div className="lg:flex">
        <aside
          className={`${
            navOpen ? "block" : "hidden"
          } border-b border-line bg-surface-deep lg:sticky lg:top-0 lg:block lg:h-screen lg:w-[260px] lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r`}
        >
          <div className="hidden items-center gap-3 border-b border-line px-5 py-5 lg:flex">
            <Link to="/admin" className="text-text">
              <Logotype size={16} />
            </Link>
          </div>

          <nav aria-label="Admin" className="p-3">
            <Group label="Overview">
              <Item to="/admin" icon={<LayoutGrid size={14} />} label="Dashboard" exact />
              <Item to="/admin/analytics" icon={<BarChart3 size={14} />} label="Analytics" />
            </Group>

            <Group label="Pages">
              {PAGES.map((p) => (
                <Item key={p.key} to="/admin/page/$page" params={{ page: p.key }} label={p.label} />
              ))}
            </Group>

            <Group label="Site-wide">
              <Item to="/admin/global" icon={<Globe size={14} />} label="Global content" />
              <Item to="/admin/shop" icon={<ShoppingBag size={14} />} label="Shop & pricing" />
              <Item to="/admin/media" icon={<Image size={14} />} label="Media" />
            </Group>

            <Group label="Account">
              <Item to="/admin/ownership" icon={<ShieldCheck size={14} />} label="Ownership" />
            </Group>
          </nav>

          <div className="border-t border-line p-5">
            <p className="t-label text-mute">Signed in</p>
            <p className="mt-1 truncate font-ui text-[12px] font-semibold text-text">
              {user?.email}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-4 flex h-9 w-full items-center justify-center gap-2 border border-line font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
            >
              <LogOut size={13} />
              Sign out
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex h-9 w-full items-center justify-center border border-line font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
            >
              View site
            </a>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 lg:px-10 lg:py-12">{children}</main>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="px-3 pb-2 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-mute">
        {label}
      </p>
      <ul className="space-y-px">{children}</ul>
    </div>
  );
}

function Item({
  to,
  label,
  icon,
  exact,
  params,
}: {
  to: string;
  label: string;
  icon?: ReactNode;
  exact?: boolean;
  params?: Record<string, string>;
}) {
  return (
    <li>
      <Link
        to={to as never}
        params={params as never}
        activeOptions={{ exact: Boolean(exact) }}
        activeProps={{ "data-active": "true" }}
        className="flex items-center gap-3 px-3 py-2.5 font-ui text-[13px] text-mute transition-colors duration-200 hover:bg-surface-raised hover:text-text data-[active=true]:bg-acid data-[active=true]:font-semibold data-[active=true]:text-accent-text"
      >
        {icon ? <span className="shrink-0">{icon}</span> : <span className="w-[14px] shrink-0" />}
        {label}
      </Link>
    </li>
  );
}

/** Page heading inside the admin working area. */
export function AdminHeading({
  title,
  standfirst,
  aside,
}: {
  title: string;
  standfirst?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-text lg:text-[34px]">
          {title}
        </h1>
        {standfirst ? (
          <p className="mt-3 max-w-[62ch] font-ui text-[14px] leading-[1.55] text-mute">
            {standfirst}
          </p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}
