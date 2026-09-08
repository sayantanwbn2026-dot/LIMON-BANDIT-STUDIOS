import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { JournalHero } from "@/components/heroes/JournalHero";
import { JournalIndex } from "@/components/journal/JournalIndex";
import { JournalTopics } from "@/components/journal/JournalTopics";
import { chapterHeadFrom, chapterSeo } from "@/lib/seo";

/* `journal.index.tsx`, not `journal.tsx`. With a sibling `journal.$slug`,
 * a bare `journal.tsx` becomes the LAYOUT for /journal/* — it rendered this
 * index at every article URL, and the entry never appeared because there is
 * no <Outlet/> here to put it in. As an index route the two are siblings and
 * each owns its own URL. */
export const Route = createFileRoute("/journal/")({
  loader: () => chapterSeo("journal"),
  head: ({ loaderData }) => chapterHeadFrom("journal", loaderData),
  component: Journal,
});

function Journal() {
  return (
    <PageShell chapter="journal" hero={<JournalHero />} pole="alt">
      {/* the whole chapter stays on the alt pole — see JournalIndex */}
      <JournalIndex />
      <JournalTopics />
    </PageShell>
  );
}
