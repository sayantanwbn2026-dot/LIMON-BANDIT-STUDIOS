import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { AboutHero } from "@/components/heroes/AboutHero";
import { Founder } from "@/components/about/Founder";
import { Team } from "@/components/about/Team";
import { chapterHeadFrom, chapterSeo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  loader: () => chapterSeo("about"),
  head: ({ loaderData }) => chapterHeadFrom("about", loaderData),
  component: About,
});

function About() {
  return (
    <PageShell chapter="about" hero={<AboutHero />}>
      {/* One voice, then the rest of the building. The founder's statement
          earns the top because it is the only part of this page that is an
          argument rather than a list; the team reads as a ledger under it,
          which is the same shape as the rooms and the crew. */}
      <Founder />
      <Team />
    </PageShell>
  );
}
