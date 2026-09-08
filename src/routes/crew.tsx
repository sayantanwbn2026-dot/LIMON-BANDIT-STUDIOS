import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { CrewHero } from "@/components/heroes/CrewHero";
import { CrewDirectory } from "@/components/crew/CrewDirectory";
import { CrewHiring } from "@/components/crew/CrewHiring";
import { chapterHeadFrom, chapterSeo } from "@/lib/seo";

export const Route = createFileRoute("/crew")({
  loader: () => chapterSeo("crew"),
  head: ({ loaderData }) => chapterHeadFrom("crew", loaderData),
  component: Crew,
});

function Crew() {
  return (
    <PageShell chapter="crew" hero={<CrewHero />}>
      {/* the names first, the terms after */}
      <CrewDirectory />
      <CrewHiring />
    </PageShell>
  );
}
