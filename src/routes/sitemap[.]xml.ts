import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { liveDocs, listFrom } from "@/cms/live";
import { siteOrigin } from "@/lib/seo";
import type { LegalDoc, PostDoc, ProductDoc } from "@/cms/hooks";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

/* Only a date the sitemap protocol accepts (W3C: YYYY-MM-DD). Journal dates
 * are free text in the CMS ("Feb 2026"), so anything else is left off rather
 * than emitted malformed. */
const isoDay = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The sitemap, built from the CMS on each request (the read is cached for
 * 30s in cms/live.ts).
 *
 * Absolute URLs against the "Live website address" in Brand & contact —
 * the protocol requires them, and the old version emitted bare paths, which
 * search engines reject. Journal entries and policy pages are listed from
 * the CMS, so a new post is discoverable as soon as it is saved.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const docs = await liveDocs();
        const origin = siteOrigin();

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/rooms", changefreq: "monthly", priority: "0.8" },
          { path: "/label", changefreq: "monthly", priority: "0.8" },
          { path: "/shop", changefreq: "weekly", priority: "0.7" },
          { path: "/crew", changefreq: "monthly", priority: "0.7" },
          { path: "/journal", changefreq: "weekly", priority: "0.6" },
          { path: "/contact", changefreq: "yearly", priority: "0.5" },
          ...listFrom<PostDoc>(docs, "page.journal.posts").map((p) => ({
            path: `/journal/${p.slug}`,
            lastmod: isoDay(p.date),
            changefreq: "yearly" as const,
            priority: "0.5",
          })),
          /* Every product has its own indexable page carrying Product
           * structured data — name, price, availability — and until now not
           * one of them was listed here. The only way in was the shop grid,
           * so the twenty pages most likely to earn a search result were the
           * twenty a crawler had to find by accident. Priority sits above
           * the policy pages and below the chapters: a tee is worth more to
           * this site than the returns policy and less than the shop. */
          ...listFrom<ProductDoc>(docs, "commerce.products")
            .filter((p) => p.id)
            .map((p) => ({
              path: `/shop/${p.id}`,
              changefreq: "weekly" as const,
              priority: "0.6",
            })),
          ...listFrom<LegalDoc>(docs, "global.legal").map((d) => ({
            path: `/legal/${d.slug}`,
            lastmod: isoDay(d.updated),
            changefreq: "yearly" as const,
            priority: "0.2",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${escapeXml(new URL(e.path, origin).href)}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
