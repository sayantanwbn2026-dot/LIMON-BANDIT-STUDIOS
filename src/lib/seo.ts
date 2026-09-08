import { chapter, type ChapterKey } from "@/data/routes";
import { site } from "@/data/site";

export type PageSeo = {
  title: string;
  description: string;
  /** absolute path, e.g. "/rooms" — canonicalised against site.url */
  path: string;
  ogType?: "website" | "article" | "product";
  image?: string;
  /**
   * Keep the page out of search results. For the transactional pages —
   * checkout, order history — which are per-person, useless to a stranger,
   * and would leak a shape of the shop nobody asked to publish.
   */
  noindex?: boolean;
};

/**
 * The only way a route should build its <head>.
 *
 * Every field is required, so a new page cannot quietly inherit the landing
 * page's title and description — which is what six routes were doing before
 * this existed. Canonical and og:url are derived from the path rather than
 * hand-written, so they cannot point at the wrong page.
 */
export function pageHead({
  title,
  description,
  path,
  ogType = "website",
  image,
  noindex,
}: PageSeo) {
  const url = new URL(path, site.url).href;
  const img = image ?? site.ogImage;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      { property: "og:image", content: img },
      { property: "og:site_name", content: site.name },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/** Head for one of the seven house chapters, straight from src/data/routes. */
export function chapterHead(key: ChapterKey) {
  const c = chapter(key);
  return pageHead({ title: c.title, description: c.description, path: c.to });
}

/* ------------------------------------------------------------------ *
 * Making the CMS's SEO panel actually do something
 *
 * The admin has a "Page titles & SEO" collection with a search-engine
 * title and description for each of the seven chapters, and until now
 * editing them changed nothing whatsoever: every route called
 * `chapterHead()`, which reads the compiled `src/data/routes`. An editor
 * could rewrite every title, save, reload, and view-source would still
 * show the shipped text. A field that silently does nothing is worse
 * than no field, because it spends someone's afternoon.
 *
 * It has to be resolved in a `loader` rather than a hook, because `head`
 * is a static route function that runs outside React and, for a crawler,
 * has to be right in the server-rendered HTML — a `useEffect` that
 * retitles the page after hydration is invisible to every social scraper
 * and unreliable for search.
 *
 * `getSupabase()` refuses to build a client during SSR on purpose (it
 * would reach for localStorage), so the server reads over plain REST
 * instead. `cms_documents` is world-readable, so the publishable key is
 * the right credential and no service role is involved.
 *
 * Three things keep this from becoming a liability on every page view:
 *
 *   - a 60-second process-level cache, because this document changes a
 *     few times a month and is identical for every visitor;
 *   - a 1.5s timeout, so a slow database delays a render by at most that
 *     rather than hanging it;
 *   - every failure path returns the compiled chapter. An unreachable or
 *     unseeded database must degrade to the shipped copy, never to a
 *     page with no title.
 * ------------------------------------------------------------------ */

type SeoRow = { key: string; title: string; description: string; to: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const CACHE_MS = 60_000;
const FETCH_TIMEOUT_MS = 1500;

let cache: { at: number; rows: SeoRow[] } | null = null;
let inflight: Promise<SeoRow[]> | null = null;

async function fetchPageSeo(): Promise<SeoRow[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cms_documents?key=eq.global.pages&select=data`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: controller.signal,
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as { data: unknown }[];
    const doc = rows[0]?.data;
    return Array.isArray(doc) ? (doc as SeoRow[]) : [];
  } catch {
    /* Aborted, offline, or the project is paused. The caller falls back
     * to the compiled chapter, which is the whole point of seeds. */
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function pageSeoRows(): Promise<SeoRow[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.rows;
  /* Collapse a burst of concurrent renders onto one request rather than
   * letting every in-flight page open its own connection. */
  inflight ??= fetchPageSeo().then((rows) => {
    if (rows.length) cache = { at: Date.now(), rows };
    inflight = null;
    return rows;
  });
  return inflight;
}

/**
 * The loader behind every chapter route's `head`.
 *
 * Returns the CMS row for this chapter when there is one, and the
 * compiled chapter otherwise — so the shape handed to `head` is the same
 * either way and `head` never has to branch.
 */
export async function chapterSeo(key: ChapterKey): Promise<PageSeo> {
  const compiled = chapter(key);
  const fallback: PageSeo = {
    title: compiled.title,
    description: compiled.description,
    path: compiled.to,
  };

  const rows = await pageSeoRows();
  const row = rows.find((r) => r?.key === key);
  if (!row) return fallback;

  /* A half-filled row is worse than no row: an empty <title> is a real
   * ranking problem, where a stale-but-correct one is not. Each field
   * falls back on its own. */
  return {
    title: row.title?.trim() || fallback.title,
    description: row.description?.trim() || fallback.description,
    path: row.to?.trim() || fallback.path,
  };
}

/**
 * What a chapter route's `head` should call.
 *
 * `loaderData` is optional in the router's types — `head` also runs for
 * the pending and error states, where the loader has not resolved — and
 * a page that rendered with no title at all in those moments would be a
 * worse bug than the one this whole mechanism exists to fix. So the
 * compiled chapter answers whenever the CMS row is not there yet.
 */
export function chapterHeadFrom(key: ChapterKey, data?: PageSeo) {
  return data ? pageHead(data) : chapterHead(key);
}
