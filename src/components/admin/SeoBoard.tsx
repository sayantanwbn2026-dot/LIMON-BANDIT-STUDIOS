import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Check, ExternalLink, RefreshCw } from "lucide-react";
import { loadDocuments } from "@/cms/admin";
import { docFrom, listFrom } from "@/cms/live";
import { resolveImage } from "@/cms/media";
import { images } from "@/generated/images";
import type { SearchDoc } from "@/lib/seo";

/**
 * The search board: what every page looks like in a search result and on a
 * share card, and what is still missing before any of it works.
 *
 * The fields themselves are edited underneath this, in the two collections
 * the rest of the admin already renders. What is new here is the *answer*
 * to the question an editor actually has — "is this right?" — which no
 * form can give, because the form shows a title as a text input and Google
 * shows it as one line that either fits or is cut off mid-word.
 *
 * So this screen is a preview and an audit, and deliberately not another
 * editor. Everything it reports is read from the same stored documents the
 * site renders from, which is why it can be trusted about what is live.
 *
 * It reads them itself rather than through the site's hooks: the admin may
 * be sitting on content the public pages have not re-fetched, and a board
 * that reassures you about yesterday's copy would be worse than no board.
 */

/* What Google shows before it cuts. Both are soft limits — a longer title
 * is not rejected, it is truncated, which is only a problem when the part
 * that gets cut is the part that mattered. The fields themselves allow a
 * few characters past these so a good line is never blocked at 61. */
const TITLE_MAX = 60;
const DESC_MAX = 155;

type PageRow = {
  key?: string;
  name?: string;
  to?: string;
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  priority?: string;
  changefreq?: string;
};

type SiteRow = { name?: string; url?: string; ogImage?: string };

type Check = {
  tone: "ok" | "warn";
  title: string;
  detail: string;
};

/** A stored image value as something an <img> can load, or nothing. */
function imageSrc(value: unknown): string | null {
  const r = resolveImage(value);
  if (r.kind === "url") return r.url;
  if (r.kind === "manifest") return images[r.key].fallback;
  return null;
}

/** "limonbandit.com/rooms" — how a result prints the address, not a link. */
function crumb(origin: string, path: string): string {
  try {
    const url = new URL(path || "/", origin || "https://example.com");
    const host = url.hostname.replace(/^www\./, "");
    const rest = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "").replaceAll("/", " › ");
    return host + rest;
  } catch {
    return path;
  }
}

export function SeoBoard() {
  const [docs, setDocs] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    void loadDocuments()
      .then(setDocs)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (docs === null) return <p className="t-label text-mute">Reading the content…</p>;
  return <Board docs={docs} onRefresh={load} loading={loading} />;
}

function Board({
  docs,
  onRefresh,
  loading,
}: {
  docs: Record<string, unknown>;
  onRefresh: () => void;
  loading: boolean;
}) {
  const site = docFrom<SiteRow>(docs, "global.site");
  const search = docFrom<SearchDoc>(docs, "global.search");
  const pages = listFrom<PageRow>(docs, "global.pages");
  const origin = site.url?.trim() || "";
  const houseImage = imageSrc(site.ogImage);

  const checks = useMemo(
    () => runChecks({ site, search, pages, origin }),
    [site, search, pages, origin],
  );

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[18px] font-extrabold uppercase tracking-[-0.01em] text-text">
            What still needs doing
          </h2>
          <div className="flex items-center gap-4">
            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-300 hover:text-acid-type"
            >
              robots.txt
              <ExternalLink size={12} />
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-300 hover:text-acid-type"
            >
              sitemap.xml
              <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={onRefresh}
              className="flex h-11 items-center gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-300 hover:text-acid-type"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : undefined} />
              {loading ? "Reading…" : "Refresh"}
            </button>
          </div>
        </div>

        <ul className="divide-y divide-line border-y border-line">
          {checks.map((c) => (
            <li key={c.title} className="flex items-start gap-3 py-3">
              <span className="mt-[3px] shrink-0">
                {c.tone === "ok" ? (
                  <Check size={14} className="text-acid-type" />
                ) : (
                  <AlertTriangle size={14} className="text-danger" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block font-ui text-[14px] font-bold text-text">{c.title}</span>
                <span className="mt-0.5 block font-ui text-[13px] leading-[1.55] text-mute">
                  {c.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-display text-[18px] font-extrabold uppercase tracking-[-0.01em] text-text">
          How each page reads
        </h2>
        <p className="mb-6 max-w-[62ch] font-ui text-[13px] leading-[1.6] text-mute">
          On the left, the page as a search result. On the right, the card someone sees when the
          link is pasted into WhatsApp or Instagram. Both are built from the same two lines you edit
          below.
        </p>

        <div className="space-y-6">
          {pages.map((p, i) => (
            <PagePreview
              key={p.key || String(i)}
              page={p}
              origin={origin}
              houseImage={houseImage}
              siteName={site.name?.trim() || "Limon Bandit"}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function PagePreview({
  page,
  origin,
  houseImage,
  siteName,
}: {
  page: PageRow;
  origin: string;
  houseImage: string | null;
  siteName: string;
}) {
  const title = page.title?.trim() || "";
  const description = page.description?.trim() || "";
  const own = imageSrc(page.ogImage);
  const card = own ?? houseImage;

  return (
    <article className="border border-line bg-surface-raised">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h3 className="font-ui text-[13px] font-bold uppercase tracking-[0.12em] text-text">
          {page.name?.trim() || page.key || "Page"}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {page.noindex ? <Badge tone="warn">Hidden from search</Badge> : null}
          {own ? <Badge>Own share image</Badge> : null}
          {page.canonical?.trim() ? <Badge tone="warn">Canonical override</Badge> : null}
          {page.priority?.trim() ? <Badge>Priority {page.priority}</Badge> : null}
          <a
            href={page.to || "/"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-300 hover:text-acid-type"
          >
            View live
            <ExternalLink size={12} />
          </a>
        </div>
      </header>

      <div className="grid gap-6 p-4 md:grid-cols-2">
        {/* the search result */}
        <div>
          <p className="t-label mb-3 text-mute">In a search result</p>
          <p className="font-ui text-[12px] text-mute">{crumb(origin, page.to || "/")}</p>
          <p className="mt-1 line-clamp-1 font-ui text-[17px] leading-[1.3] text-acid-type">
            {title || "— no title —"}
          </p>
          <p className="mt-1 line-clamp-2 font-ui text-[13px] leading-[1.5] text-mute">
            {description || "— no description —"}
          </p>
          <div className="mt-3 flex gap-4">
            <Count label="Title" value={title.length} max={TITLE_MAX} />
            <Count label="Description" value={description.length} max={DESC_MAX} />
          </div>
        </div>

        {/* the share card */}
        <div>
          <p className="t-label mb-3 text-mute">Pasted into a chat</p>
          <div className="border border-line">
            <div className="aspect-[1200/630] w-full overflow-hidden bg-surface-deep">
              {card ? (
                <img src={card} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-ui text-[12px] text-mute">
                  No share image
                </span>
              )}
            </div>
            <div className="border-t border-line px-3 py-2">
              <p className="font-ui text-[11px] uppercase tracking-[0.12em] text-mute">
                {crumb(origin, "/")}
              </p>
              <p className="mt-1 line-clamp-1 font-ui text-[13px] font-bold text-text">
                {title || siteName}
              </p>
              <p className="mt-0.5 line-clamp-2 font-ui text-[12px] leading-[1.45] text-mute">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Badge({ children, tone = "ok" }: { children: ReactNode; tone?: "ok" | "warn" }) {
  return (
    <span
      className={`border px-2 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.12em] ${
        tone === "warn" ? "border-danger text-danger" : "border-line text-mute"
      }`}
    >
      {children}
    </span>
  );
}

/** "52 / 60", in the house colour until it is over, then in the alarm one. */
function Count({ label, value, max }: { label: string; value: number; max: number }) {
  const over = value > max;
  return (
    <span className="font-ui text-[11px] uppercase tracking-[0.12em]">
      <span className="text-mute">{label} </span>
      <span className={over ? "text-danger" : "text-mute"}>
        {value} / {max}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The audit
 *
 * Every check answers a question somebody would otherwise have to know to
 * ask. They are ordered by what it costs to leave undone, not by how hard
 * they are to fix: an unregistered domain breaks every canonical link on
 * the site, where a missing price range only costs a line in one result.
 * ------------------------------------------------------------------ */

function runChecks({
  site,
  search,
  pages,
  origin,
}: {
  site: SiteRow;
  search: SearchDoc;
  pages: PageRow[];
  origin: string;
}): Check[] {
  const out: Check[] = [];
  const named = (rows: PageRow[]) => rows.map((p) => p.name?.trim() || p.key).join(", ");

  /* The live address. Every canonical link, the sitemap and both share
   * cards are built against it, so a wrong one sends search engines to a
   * site nobody owns. */
  out.push(
    /^https:\/\/\S+\.\S+/.test(origin)
      ? { tone: "ok", title: "Live website address is set", detail: origin }
      : {
          tone: "warn",
          title: "No live website address",
          detail:
            "Brand & contact → Live website address. Until it is a real https:// domain, canonical links and the sitemap point nowhere.",
        },
  );

  out.push(
    site.ogImage?.toString().trim()
      ? {
          tone: "ok",
          title: "House share image is set",
          detail: "Used by every page without one of its own.",
        }
      : {
          tone: "warn",
          title: "No house share image",
          detail:
            "Brand & contact → Social share image. Without it a link pasted into WhatsApp is a bare line of text.",
        },
  );

  out.push(
    search.verifyGoogle?.trim()
      ? {
          tone: "ok",
          title: "Google Search Console code is in place",
          detail: "The domain can be verified, which is what lets you see what people search for.",
        }
      : {
          tone: "warn",
          title: "Google cannot confirm you own the domain",
          detail:
            "Paste the Search Console HTML-tag code below. Without it there are no search statistics and no way to ask Google to re-crawl a page.",
        },
  );

  /* Two pages with the same title are two pages competing for the same
   * result, and the one Google keeps is not the one you would pick. */
  const dupTitles = duplicates(pages.map((p) => p.title?.trim().toLowerCase()));
  out.push(
    dupTitles.length === 0
      ? {
          tone: "ok",
          title: "Every page has its own title",
          detail: "No two pages compete for the same result.",
        }
      : {
          tone: "warn",
          title: "Two pages share a title",
          detail: `${dupTitles.join("; ")} — give each page a line that says what is on that page.`,
        },
  );

  const dupDescriptions = duplicates(pages.map((p) => p.description?.trim().toLowerCase()));
  if (dupDescriptions.length > 0) {
    out.push({
      tone: "warn",
      title: "Two pages share a description",
      detail: `${dupDescriptions.join("; ")} — the line under the title is the one chance to say why this page and not the other.`,
    });
  }

  const longTitles = pages.filter((p) => (p.title?.trim().length ?? 0) > TITLE_MAX);
  if (longTitles.length > 0) {
    out.push({
      tone: "warn",
      title: `${longTitles.length} title${longTitles.length === 1 ? "" : "s"} will be cut off`,
      detail: `${named(longTitles)} — over ${TITLE_MAX} characters. Google keeps the beginning, so put the useful words first.`,
    });
  }

  const longDescriptions = pages.filter((p) => (p.description?.trim().length ?? 0) > DESC_MAX);
  if (longDescriptions.length > 0) {
    out.push({
      tone: "warn",
      title: `${longDescriptions.length} description${longDescriptions.length === 1 ? "" : "s"} will be cut off`,
      detail: `${named(longDescriptions)} — over ${DESC_MAX} characters.`,
    });
  }

  const empty = pages.filter((p) => !p.title?.trim() || !p.description?.trim());
  if (empty.length > 0) {
    out.push({
      tone: "warn",
      title: "A page has no search text",
      detail: `${named(empty)} — Google will invent a line from whatever is on the page.`,
    });
  }

  const hidden = pages.filter((p) => p.noindex);
  if (hidden.length > 0) {
    out.push({
      tone: "ok",
      title: `${hidden.length} page${hidden.length === 1 ? " is" : "s are"} kept out of search`,
      detail: `${named(hidden)} — on purpose, and dropped from the sitemap too. Untick it below to let them back in.`,
    });
  }

  /* The three facts that turn a name in a result into a place. None of
   * them is on the page in a form a crawler can read, so each one is only
   * published if somebody types it here. */
  const place = [
    search.priceRange?.trim() ? null : "a price range",
    (search.hours ?? []).length > 0 ? null : "opening hours",
    search.geo?.lat?.trim() && search.geo?.lng?.trim() ? null : "a map position",
  ].filter(Boolean) as string[];
  out.push(
    place.length === 0
      ? {
          tone: "ok",
          title: "The studio reads as a place",
          detail: "Price, hours and position are all published with the address.",
        }
      : {
          tone: "warn",
          title: "The studio reads as a website, not a place",
          detail: `Still missing: ${place.join(", ")}. Local results show these beside the name, and a studio someone can see is open is a studio they call.`,
        },
  );

  out.push(
    search.faqRich === false
      ? {
          tone: "warn",
          title: "The FAQ is not offered to Google",
          detail:
            "The questions on the front page could appear under the search result, expandable. Nothing is published that a visitor cannot already read.",
        }
      : {
          tone: "ok",
          title: "The FAQ is offered as rich results",
          detail: "The questions the front page shows are published as structured data.",
        },
  );

  return out;
}

/** The values that appear more than once, as readable text. Empties ignored. */
function duplicates(values: (string | undefined)[]): string[] {
  const seen = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    seen.set(v, (seen.get(v) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, n]) => n > 1)
    .map(([v, n]) => `“${v.slice(0, 40)}${v.length > 40 ? "…" : ""}” on ${n} pages`);
}
