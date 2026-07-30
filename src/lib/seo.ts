import { chapter, type ChapterKey } from "@/data/routes";
import { site } from "@/data/site";

export type PageSeo = {
  title: string;
  description: string;
  /** absolute path, e.g. "/rooms" — canonicalised against site.url */
  path: string;
  ogType?: "website" | "article" | "product";
  image?: string;
};

/**
 * The only way a route should build its <head>.
 *
 * Every field is required, so a new page cannot quietly inherit the landing
 * page's title and description — which is what six routes were doing before
 * this existed. Canonical and og:url are derived from the path rather than
 * hand-written, so they cannot point at the wrong page.
 */
export function pageHead({ title, description, path, ogType = "website", image }: PageSeo) {
  const url = new URL(path, site.url).href;
  const img = image ?? site.ogImage;
  return {
    meta: [
      { title },
      { name: "description", content: description },
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
