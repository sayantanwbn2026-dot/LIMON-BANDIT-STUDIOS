import { seeds } from "./seeds";

/**
 * The CMS, read where the page is rendered.
 *
 * `ContentProvider` used to fetch every document in the browser, after
 * hydration. The server therefore rendered the committed seeds, and anything
 * an editor had changed arrived a beat later as a visible swap — and never
 * arrived at all for a crawler, a link preview, or a route that had to
 * decide on the server whether something exists (a journal post written in
 * the admin was a 404, because the article route checked the compiled list).
 *
 * This reads all of `cms_documents` in one request, over plain REST with the
 * publishable key (`cms_documents` is world-readable; RLS guards writes), so
 * it runs the same on the server and in the browser. The root route's loader
 * calls it once and hands the result to `ContentProvider` as its initial
 * state, so the server HTML and the first client render agree.
 *
 * The whole store is ~40 KB of JSON, ~10 KB on the wire — cheap enough to
 * ship with the page.
 *
 * Guard rails, the same ones the SEO fetch already had:
 *   - a 30-second process-level cache: identical for every visitor, and it
 *     changes a few times a month;
 *   - a 1.5s timeout: a slow database delays a render by at most that;
 *   - every failure returns `{}`, and every reader falls back to the seed
 *     for a missing key — the site never renders emptier than its seeds.
 */

export type Docs = Record<string, unknown>;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const CACHE_MS = 30_000;
const FETCH_TIMEOUT_MS = 1500;

let cache: { at: number; docs: Docs } | null = null;
let inflight: Promise<Docs> | null = null;

async function fetchDocs(): Promise<Docs | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cms_documents?select=key,data`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { key: string; data: unknown }[];
    const docs: Docs = {};
    for (const r of rows) if (r && typeof r.key === "string") docs[r.key] = r.data;
    return docs;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Every stored document, cached. `{}` when the store cannot be reached. */
export async function liveDocs(): Promise<Docs> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.docs;
  inflight ??= fetchDocs().then((docs) => {
    inflight = null;
    if (docs) cache = { at: Date.now(), docs };
    /* A failed refresh keeps serving the last good copy rather than
     * dropping the whole site back to seeds for thirty seconds. */
    return docs ?? cache?.docs ?? {};
  });
  return inflight;
}

/** The last documents fetched, synchronously — for `head`, which cannot await. */
export function lastDocs(): Docs {
  return cache?.docs ?? {};
}

/** One document from a fetched set, falling back to its seed. */
export function docFrom<T>(docs: Docs, key: string): T {
  const stored = docs[key];
  if (stored !== undefined && stored !== null) return stored as T;
  return (seeds[key] ?? {}) as T;
}

/** A list document, guaranteed to be an array (same rule as `useList`). */
export function listFrom<T>(docs: Docs, key: string): T[] {
  const value = docs[key];
  if (Array.isArray(value) && value.length > 0) return value as T[];
  const seed = seeds[key];
  return Array.isArray(seed) ? (seed as T[]) : [];
}
