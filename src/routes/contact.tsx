import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/lb/PageShell";
import { chapterHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => chapterHead("contact"),
  component: () => <PageShell chapter="contact" />,
});
