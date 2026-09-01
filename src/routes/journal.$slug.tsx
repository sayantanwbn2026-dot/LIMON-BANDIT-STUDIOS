import { createFileRoute, notFound } from "@tanstack/react-router";
import { JournalArticle } from "@/components/journal/JournalArticle";
import { post } from "@/data/journal";
import { pageHead } from "@/lib/seo";
import { site } from "@/data/site";

/**
 * A journal entry.
 *
 * The slug is resolved in `loader` rather than in the component so an
 * unknown one is a real 404 — served with the right status and the root's
 * not-found screen — instead of a page that renders blank and returns 200
 * to anything crawling it.
 */
export const Route = createFileRoute("/journal/$slug")({
  loader: ({ params }) => {
    const entry = post(params.slug);
    if (!entry) throw notFound();
    return entry;
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: `${loaderData.title} | ${site.name} Journal`,
          description: loaderData.standfirst,
          path: `/journal/${loaderData.slug}`,
          ogType: "article",
        })
      : {},
  component: Entry,
});

function Entry() {
  const entry = Route.useLoaderData();
  return <JournalArticle entry={entry} />;
}
