import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { liveDocs } from "@/cms/live";
import { siteOrigin } from "@/lib/seo";

/**
 * robots.txt, served rather than static so it can name the sitemap at the
 * production address the editor set in Brand & contact.
 *
 * The admin and the per-person shop pages (checkout, order history) are
 * kept out: they are useless to a stranger and already `noindex` in their
 * heads — this stops crawlers spending time fetching them at all.
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        await liveDocs();
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /checkout",
          "Disallow: /orders",
          "",
          `Sitemap: ${new URL("/sitemap.xml", siteOrigin()).href}`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
