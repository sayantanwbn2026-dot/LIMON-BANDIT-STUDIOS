import { createFileRoute } from "@tanstack/react-router";
import { AdminHeading } from "@/components/admin/AdminShell";
import { CollectionList } from "@/components/admin/CollectionList";
import { SeoBoard } from "@/components/admin/SeoBoard";
import { collections } from "@/cms/collections";

/**
 * Everything about how the site is found, on one screen.
 *
 * The two collections underneath are not new — "Page titles & SEO" has
 * always been under Global content, where it sat between the menu and the
 * tickers as though it were the same kind of thing. It is not: a title
 * that is forty characters too long costs a click from every search for
 * the next year, and nothing in a form tells you that.
 *
 * So the board comes first and the forms follow it. Collect them here as
 * well as leaving them under Global content, because both are true — they
 * are global content, and they are the search settings.
 */
const seoCollections = collections.filter(
  (c) => c.key === "global.search" || c.key === "global.pages",
);

export const Route = createFileRoute("/admin/seo")({
  component: SeoScreen,
});

function SeoScreen() {
  return (
    <>
      <AdminHeading
        title="Search & sharing"
        standfirst="How each page reads in a search result and on a share card, what is still missing, and the settings behind both. Everything here is public the moment it is saved."
      />
      <div className="space-y-12">
        <SeoBoard />
        <CollectionList items={seoCollections} />
      </div>
    </>
  );
}
