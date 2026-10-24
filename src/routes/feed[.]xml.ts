import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { liveDocs, listFrom, docFrom } from "@/cms/live";
import { siteOrigin, siteNameFrom } from "@/lib/seo";
import type { PostDoc } from "@/cms/hooks";
import { WORDS, fill, type Words } from "@/cms/words";

/**
 * The journal as a feed, at /feed.xml.
 *
 * Writing a journal nobody can subscribe to means every reader has to
 * remember to come back. A feed is twenty lines of XML and it is how a post
 * reaches readers, aggregators and anything that reposts automatically.
 *
 * Built from the CMS on request (cached 30s upstream), so a post published
 * in the admin is in the feed immediately.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* RFC 822, which is what RSS wants. CMS dates are free text ("Feb 2026"),
 * so anything unparseable simply carries no date rather than a wrong one. */
function rfc822(value: string | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toUTCString();
}

export const Route = createFileRoute("/feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        const docs = await liveDocs();
        const origin = siteOrigin();
        /* docFrom, not docs[key]: before anything has been saved the
         * store is empty, and reading it raw gave the feed a generic name
         * and description instead of the committed ones. */
        const site = docFrom<{ name?: string; description?: string }>(docs, "global.site");
        const name = siteNameFrom(docs);
        const journal = listFrom<{ key?: string; description?: string }>(docs, "global.pages").find(
          (p) => p?.key === "journal",
        );
        const system = {
          ...WORDS.system,
          ...docFrom<Partial<Words["system"]>>(docs, "global.words.system"),
        };
        const channelTitle = fill(system.feedTitle?.trim() || WORDS.system.feedTitle, { name });
        const channelDescription =
          journal?.description?.trim() || site.description?.trim() || channelTitle;
        const posts = listFrom<PostDoc>(docs, "page.journal.posts");

        const items = posts
          .map((p) => {
            const url = new URL(`/journal/${p.slug}`, origin).href;
            const date = rfc822(p.date);
            return [
              "    <item>",
              `      <title>${esc(p.title)}</title>`,
              `      <link>${esc(url)}</link>`,
              `      <guid isPermaLink="true">${esc(url)}</guid>`,
              p.standfirst ? `      <description>${esc(p.standfirst)}</description>` : null,
              p.category ? `      <category>${esc(p.category)}</category>` : null,
              date ? `      <pubDate>${date}</pubDate>` : null,
              "    </item>",
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
          `  <channel>`,
          `    <title>${esc(channelTitle)}</title>`,
          `    <link>${esc(new URL("/journal", origin).href)}</link>`,
          `    <description>${esc(channelDescription)}</description>`,
          `    <language>en-IN</language>`,
          `    <atom:link href="${esc(new URL("/feed.xml", origin).href)}" rel="self" type="application/rss+xml" />`,
          items,
          `  </channel>`,
          `</rss>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
