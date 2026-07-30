import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { chapterHead } from "@/lib/seo";

export const Route = createFileRoute("/rooms")({
  head: () => chapterHead("rooms"),
  component: () => <PageShell chapter="rooms" />,
});
