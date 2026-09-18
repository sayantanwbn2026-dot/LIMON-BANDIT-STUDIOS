import { createFileRoute, notFound } from "@tanstack/react-router";
import { JournalArticle } from "@/components/journal/JournalArticle";
import { liveDocs, listFrom } from "@/cms/live";
import { usePost, type PostDoc } from "@/cms/hooks";
import { pageHead } from "@/lib/seo";

/**
 * A journal entry.
 *
 * The slug is resolved in `loader` rather than in the component so an
 * unknown one is a real 404 — served with the right status and the root's
 * not-found screen — instead of a page that renders blank and returns 200
 * to anything crawling it.
 */
export const Route = createFileRoute("/journal/$slug")({
  /* Resolved against the CMS, so a post written in the admin exists on the
   * server — it used to check the compiled list, which made every new
   * entry a 404 — and a deleted one is a real 404 rather than a stale page. */
  loader: async ({ params }) => {
    const docs = await liveDocs();
    const entry = listFrom<PostDoc>(docs, "page.journal.posts").find((p) => p.slug === params.slug);
    if (!entry) throw notFound();
    const name = (docs["global.site"] as { name?: string } | undefined)?.name;
    return { entry, siteName: name?.trim() || "Limon Bandit" };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: `${loaderData.entry.title} | ${loaderData.siteName} Journal`,
          description: loaderData.entry.standfirst,
          path: `/journal/${loaderData.entry.slug}`,
          image: loaderData.entry.image,
          ogType: "article",
        })
      : {},
  component: Entry,
});

function Entry() {
  const { entry } = Route.useLoaderData();
  /* The provider's copy wins once it is fresher (an open tab, an admin
   * save); the loader's is what the server rendered. */
  const live = usePost(entry.slug);
  return <JournalArticle entry={live ?? entry} />;
}
