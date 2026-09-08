import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { LabelPlayer } from "@/components/label/LabelPlayer";
import { LabelRoster } from "@/components/label/LabelRoster";
import { LabelSplits } from "@/components/label/LabelSplits";
import { LabelHero } from "@/components/heroes/LabelHero";
import { chapterHeadFrom, chapterSeo } from "@/lib/seo";

export const Route = createFileRoute("/label")({
  loader: () => chapterSeo("label"),
  head: ({ loaderData }) => chapterHeadFrom("label", loaderData),
  component: Label,
});

function Label() {
  return (
    <PageShell chapter="label" hero={<LabelHero />}>
      <LabelPlayer />
      <LabelRoster />
      <LabelSplits />
    </PageShell>
  );
}
