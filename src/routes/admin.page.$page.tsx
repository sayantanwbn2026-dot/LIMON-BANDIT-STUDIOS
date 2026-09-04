import { createFileRoute, notFound } from "@tanstack/react-router";
import { AdminHeading } from "@/components/admin/AdminShell";
import { CollectionList } from "@/components/admin/CollectionList";
import { ViewLive } from "@/components/admin/DocEditor";
import { PAGES, type PageKey } from "@/cms/schema";
import { pageCollections } from "@/cms/collections";

/**
 * One page's editable sections.
 *
 * The route takes the chapter key and asks the registry what belongs to it,
 * so this file never needs touching when a page gains a section.
 */
export const Route = createFileRoute("/admin/page/$page")({
  component: PageEditor,
});

function PageEditor() {
  const { page } = Route.useParams();
  const meta = PAGES.find((p) => p.key === page);
  if (!meta) throw notFound();

  const items = pageCollections(meta.key as PageKey);

  return (
    <>
      <AdminHeading
        title={meta.label}
        standfirst={`Everything that appears on ${meta.path}. Changes go live as soon as you save.`}
        aside={<ViewLive path={meta.path} />}
      />
      <CollectionList items={items} />
    </>
  );
}
