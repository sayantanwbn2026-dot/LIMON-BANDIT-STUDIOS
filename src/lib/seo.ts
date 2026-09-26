import { chapter, type ChapterKey } from "@/data/routes";
import { site } from "@/data/site";
import { docFrom, lastDocs, liveDocs } from "@/cms/live";
import { images } from "@/generated/images";

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
  /**
   * Structured data for this page — one object or several. Emitted as
   * `application/ld+json` in the head, which is what lets Google show the
   * studio's address and hours, a product's price and stock, or an article
   * as an article rather than as a blue link.
   */
  jsonLd?: object | object[];
};

/* The brand document as the editor last saved it, synchronously: `head`
 * cannot await, but every route's loader has already awaited `liveDocs()`
 * by the time its head runs (the root loader does it for all of them). */
const LEGACY_OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b1cedbea-3211-4616-a001-76f4d66bb912/id-preview-7ec2de84--81d10571-0622-4cc6-87cb-939b87a35638.lovable.app-1785234511091.png";

type SiteDoc = { name?: string; url?: string; ogImage?: string };
function liveSite() {
  const doc = docFrom<SiteDoc>(lastDocs(), "global.site");
  const url = doc.url?.trim();
  const og = doc.ogImage?.trim();
  return {
    name: doc.name?.trim() || site.name,
    url: url && /^https?:\/\//.test(url) ? url : site.url,
    /* The old seed value was a Lovable preview screenshot on a third-party
     * bucket, and the stored document still carries it because it was seeded
     * before the site had its own share image. That exact URL is treated as
     * "never chosen" so the committed image is used; anything an editor
     * actually picks still wins. */
    ogImage: og && og !== LEGACY_OG_IMAGE ? og : site.ogImage,
  };
}

/* The share image can be an absolute URL, a site path, or a key from the
 * image manifest (what the admin's image picker stores for built-in art).
 * Scrapers need an absolute URL, so all three end up as one. */
function absoluteImage(value: string, origin: string): string {
  if (/^https?:\/\//.test(value)) return value;
  const entry = (images as Record<string, { fallback: string } | undefined>)[value];
  const path = entry ? entry.fallback : value;
  return new URL(path, origin).href;
}

/** The production origin, for anything that needs absolute links. */
export function siteOrigin(): string {
  return liveSite().url;
}

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
  jsonLd,
}: PageSeo) {
  const live = liveSite();
  const url = new URL(path, live.url).href;
  const img = absoluteImage(image ?? live.ogImage, live.url);
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
      { property: "og:site_name", content: live.name },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: jsonLd
      ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((block) => ({
          type: "application/ld+json",
          /* JSON.stringify escapes nothing dangerous on its own: a "</script>"
           * inside any CMS string would close this tag early and the rest of
           * the document would be parsed as markup. */
          children: JSON.stringify(block).replaceAll("<", "\\u003c"),
        }))
      : undefined,
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
 * The read goes through cms/live.ts — the same cached, time-limited fetch
 * that feeds the rest of the site — and every failure path returns the
 * compiled chapter. An unreachable or unseeded database must degrade to
 * the shipped copy, never to a page with no title.
 * ------------------------------------------------------------------ */

type SeoRow = { key: string; title: string; description: string; to: string };

/* Reads the same cached store as the rest of the site (cms/live.ts), which
 * carries the timeout, the cache and the offline fallback this used to
 * implement for itself. */
async function pageSeoRows(): Promise<SeoRow[]> {
  const docs = await liveDocs();
  const rows = docs["global.pages"];
  return Array.isArray(rows) ? (rows as SeoRow[]) : [];
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

/* ------------------------------------------------------------------ *
 * Structured data
 *
 * Built from the CMS documents the loaders already fetched (lastDocs), so
 * an editor changing the phone number changes what Google shows, and there
 * is no second copy of the address to drift.
 * ------------------------------------------------------------------ */

type AddressDoc = { address?: string[]; phone?: string; email?: string; rating?: string };

/** Split the CMS's free-text address lines into the parts schema.org wants. */
function postalAddress(lines: string[] | undefined) {
  const rows = (lines ?? []).map((l) => l.trim()).filter(Boolean);
  if (rows.length === 0) return undefined;
  const joined = rows.join(", ");
  const postal = joined.match(/\b[1-9][0-9]{5}\b/)?.[0];
  /* Second line is "Hatibagan, Kolkata 700006" in the shipped content;
   * the city is the last word before the PIN. Anything unparseable falls
   * back to the raw lines, which is still valid — only less specific. */
  const locality = rows[1]
    ?.replace(/\b[1-9][0-9]{5}\b/, "")
    .split(",")
    .pop()
    ?.trim();
  const region = rows[2]?.split(",")[0]?.trim();
  return {
    "@type": "PostalAddress",
    streetAddress: rows[0],
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    ...(postal ? { postalCode: postal } : {}),
    addressCountry: "IN",
  };
}

/** The house itself — name, where it is, how to reach it, what it is. */
export function houseJsonLd() {
  const docs = lastDocs();
  const site = docFrom<SiteDoc & AddressDoc & { description?: string; tagline?: string }>(
    docs,
    "global.site",
  );
  const social = docs["global.social"];
  const live = liveSite();

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "MusicGroup"],
    "@id": `${live.url}#house`,
    name: live.name,
    url: live.url,
    image: absoluteImage(live.ogImage, live.url),
    ...(site.description ? { description: site.description } : {}),
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.email ? { email: site.email } : {}),
    ...(postalAddress(site.address) ? { address: postalAddress(site.address) } : {}),
    ...(Array.isArray(social) && social.length
      ? { sameAs: (social as { url?: string }[]).map((s) => s.url).filter(Boolean) }
      : {}),
  };
}

/** One journal entry, as an article rather than a page. */
export function articleJsonLd(entry: {
  title: string;
  standfirst?: string;
  date?: string;
  slug: string;
  image?: string;
}) {
  const live = liveSite();
  const url = new URL(`/journal/${entry.slug}`, live.url).href;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    ...(entry.standfirst ? { description: entry.standfirst } : {}),
    ...(entry.date && /^\d{4}-\d{2}-\d{2}/.test(entry.date) ? { datePublished: entry.date } : {}),
    ...(entry.image ? { image: absoluteImage(entry.image, live.url) } : {}),
    mainEntityOfPage: url,
    url,
    publisher: { "@type": "Organization", name: live.name, url: live.url },
  };
}

/** The catalogue, so prices and "in stock" can show in search results. */
export function shopJsonLd() {
  const docs = lastDocs();
  const products = docs["commerce.products"];
  if (!Array.isArray(products) || products.length === 0) return undefined;
  const live = liveSite();

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${live.name} — the shop`,
    itemListElement: (products as Record<string, unknown>[]).slice(0, 40).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: String(p.title ?? ""),
        ...(p.blurb ? { description: String(p.blurb) } : {}),
        ...(p.image ? { image: absoluteImage(String(p.image), live.url) } : {}),
        ...(p.by ? { brand: { "@type": "Brand", name: String(p.by) } } : {}),
        offers: {
          "@type": "Offer",
          price: Number(p.price ?? 0),
          priceCurrency: "INR",
          availability:
            Number(p.stock ?? 0) > 0 || p.digital
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url: new URL(`/shop/${String(p.id ?? "")}`, live.url).href,
        },
      },
    })),
  };
}

/** One product, for its own page: price, stock and what it is. */
export function productJsonLd(p: {
  id: string;
  title: string;
  blurb?: string;
  by?: string;
  image?: string;
  price: number;
  stock: number;
  digital?: boolean;
}) {
  const live = liveSite();
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    ...(p.blurb ? { description: p.blurb } : {}),
    ...(p.image ? { image: absoluteImage(p.image, live.url) } : {}),
    ...(p.by ? { brand: { "@type": "Brand", name: p.by } } : {}),
    sku: p.id,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "INR",
      availability:
        p.stock > 0 || p.digital ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: new URL(`/shop/${p.id}`, live.url).href,
      seller: { "@type": "Organization", name: live.name },
    },
  };
}
