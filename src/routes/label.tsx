import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { LabelPlayer } from "@/components/label/LabelPlayer";
import { LabelRoster } from "@/components/label/LabelRoster";
import { LabelSplits } from "@/components/label/LabelSplits";
import { chapterHead } from "@/lib/seo";

export const Route = createFileRoute("/label")({
  head: () => chapterHead("label"),
  component: Label,
});

function Label() {
  return (
    <PageShell chapter="label">
      <LabelPlayer />
      <LabelRoster />
      <LabelSplits />
    </PageShell>
  );
}
