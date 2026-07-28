import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/lb/StubPage";

const title = "Journal — Notes from the Limon Bandit Room";
const description =
  "Writing on gear, label splits, recording in Kolkata, and how a print run actually gets made.";

export const Route = createFileRoute("/journal")({
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
      label={"Journal"}
      blurb={"Notes from the room. Gear, splits, the city, print runs."}
    />
  ),
});
