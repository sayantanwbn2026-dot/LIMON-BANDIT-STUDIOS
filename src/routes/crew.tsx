import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/lb/StubPage";

const title = "The Crew — Hire Video Directors and Engineers";
const description =
  "A marketplace of vetted video directors, cover artists, photographers, and mixing engineers, hired by the project.";

export const Route = createFileRoute("/crew")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <StubPage
      label={"The Crew"}
      blurb={"Vetted directors, cover artists, photographers, and engineers."}
    />
  ),
});
