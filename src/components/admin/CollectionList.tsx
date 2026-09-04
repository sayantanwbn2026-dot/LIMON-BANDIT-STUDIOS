import { useCallback, useEffect, useState } from "react";
import { DocEditor } from "./DocEditor";
import { loadDocuments } from "@/cms/admin";
import type { Collection } from "@/cms/schema";

/**
 * Renders a set of collections as stacked editors, sharing one load of the
 * stored documents.
 *
 * Every admin screen that edits content is this component with a different
 * list, which is why there is no per-page admin code — adding a section to a
 * page means adding it to `collections.ts` and nothing else.
 */
export function CollectionList({ items }: { items: Collection[] }) {
  const [docs, setDocs] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(() => {
    void loadDocuments().then(setDocs);
  }, []);

  useEffect(load, [load]);

  if (docs === null) {
    return <p className="t-label text-mute">Loading content…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="max-w-[60ch] font-ui text-[14px] leading-[1.6] text-mute">
        This page has no editable sections of its own yet. Its heading, standfirst and search-engine
        text are under Global content → Page titles &amp; SEO.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {items.map((c) => (
        <DocEditor key={c.key} collection={c} stored={docs[c.key]} onSaved={load} />
      ))}
    </div>
  );
}
