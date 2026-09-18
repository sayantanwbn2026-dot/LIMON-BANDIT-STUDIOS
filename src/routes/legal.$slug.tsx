import { createFileRoute, notFound } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { liveDocs, listFrom } from "@/cms/live";
import { useLegal, type LegalDoc } from "@/cms/hooks";
import { pageHead } from "@/lib/seo";

/**
 * /legal/terms, /legal/privacy, /legal/shipping-returns — and any other
 * policy an editor adds in the "Legal pages" collection.
 *
 * Resolved in the loader against the CMS, like journal entries, so an
 * unknown slug is a real 404 and a new page exists as soon as it is saved.
 */
export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    const docs = await liveDocs();
    const doc = listFrom<LegalDoc>(docs, "global.legal").find((d) => d.slug === params.slug);
    if (!doc) throw notFound();
    const name = (docs["global.site"] as { name?: string } | undefined)?.name;
    return { doc, siteName: name?.trim() || "Limon Bandit" };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: `${loaderData.doc.title} | ${loaderData.siteName}`,
          description: loaderData.doc.standfirst || loaderData.doc.title,
          path: `/legal/${loaderData.doc.slug}`,
        })
      : {},
  component: Legal,
});

function Legal() {
  const { doc } = Route.useLoaderData();
  const live = useLegal().find((d) => d.slug === doc.slug);
  return <LegalPage doc={live ?? doc} />;
}
