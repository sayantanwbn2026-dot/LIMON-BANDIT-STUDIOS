import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { chapterHead } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  head: () => chapterHead("shop"),
  component: () => <PageShell chapter="shop" />,
});
