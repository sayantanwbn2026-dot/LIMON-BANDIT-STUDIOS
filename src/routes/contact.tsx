import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/lb/StubPage";

const title = "Contact Limon Bandit — Book a Room in Kolkata";
const description =
  "Send us the dates and what you're recording. We confirm within a few hours and hold the slot for 48 hours.";

export const Route = createFileRoute("/contact")({
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
      label={"Contact"}
      blurb={"Send the dates and what you're recording. We answer fast."}
    />
  ),
});
