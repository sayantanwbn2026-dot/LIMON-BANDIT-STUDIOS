import { createFileRoute } from "@tanstack/react-router";
import { AdminHeading } from "@/components/admin/AdminShell";
import { CollectionList } from "@/components/admin/CollectionList";
import { globalCollections } from "@/cms/collections";

export const Route = createFileRoute("/admin/global")({
  component: GlobalEditor,
});

function GlobalEditor() {
  return (
    <>
      <AdminHeading
        title="Global content"
        standfirst="The things that appear on every page, or that describe the site as a whole: contact details, the menu, social links, the scrolling tickers, the FAQ, and the title and description each page shows in search results."
      />
      <CollectionList items={globalCollections} />
    </>
  );
}
