import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/lb/StubPage";

const title = "Limon Bandit Label — Independent Records from Kolkata";
const description =
  "An independent label with a roster streaming direct. Splits 70/30, paid monthly, artist first.";

export const Route = createFileRoute("/label")({
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
      label={"The Label"}
      blurb={"We sign, release, and distribute — splits 70/30, artist first."}
    />
  ),
});
