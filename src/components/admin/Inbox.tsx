import type { ReactNode } from "react";
import { Download, Search } from "lucide-react";

/**
 * Pieces shared by the three inbox screens (orders, enquiries, subscribers):
 * a filter/search/export toolbar, an honest error panel, and date helpers.
 * Kept here rather than in AdminShell because nothing else in the admin
 * lists records — the CMS edits documents, the inbox works rows.
 */

export function Toolbar<T extends string>({
  tabs,
  tab,
  onTab,
  query,
  onQuery,
  placeholder,
  onExport,
}: {
  tabs: { id: T; label: string; count: number }[];
  tab: T;
  onTab: (t: T) => void;
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  onExport?: () => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div role="tablist" className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTab(t.id)}
            className={`flex h-9 items-center gap-2 px-3 font-ui text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-300 ${
              tab === t.id
                ? "bg-acid text-accent-text"
                : "border border-line text-mute hover:border-acid-type hover:text-text"
            }`}
          >
            {t.label}
            <span className="tnum opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      <label className="ml-auto flex h-9 min-w-[220px] flex-1 items-center gap-2 border border-line px-3 focus-within:border-acid-type sm:max-w-[320px]">
        <Search size={14} className="shrink-0 text-mute" aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent font-ui text-[13px] text-text outline-none placeholder:text-[color:var(--placeholder)]"
        />
      </label>

      {onExport ? (
        <button
          type="button"
          onClick={onExport}
          className="flex h-9 items-center gap-2 border border-line px-3 font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-text transition-colors duration-300 hover:border-acid-type"
        >
          <Download size={14} aria-hidden="true" />
          Export CSV
        </button>
      ) : null}
    </div>
  );
}

export function InboxError({ message }: { message: string }) {
  return (
    <div role="alert" className="border border-acid-type bg-surface-deep p-5">
      <p className="t-label text-acid-type">Cannot load this</p>
      <p className="mt-2 max-w-[70ch] font-ui text-[14px] leading-[1.55] text-text">{message}</p>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-line p-8 text-center font-ui text-[14px] text-mute">
      {children}
    </p>
  );
}

export function Pill({
  children,
  tone = "mute",
}: {
  children: ReactNode;
  tone?: "acid" | "mute" | "text";
}) {
  const cls =
    tone === "acid"
      ? "bg-acid text-accent-text"
      : tone === "text"
        ? "border border-line-strong text-text"
        : "border border-line text-mute";
  return (
    <span
      className={`inline-flex h-6 items-center px-2 font-ui text-[10px] font-bold uppercase tracking-[0.1em] ${cls}`}
    >
      {children}
    </span>
  );
}
