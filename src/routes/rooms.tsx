import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/lb/StubPage";

const title = "Limon Bandit Rooms — Studio Hire in Kolkata";
const description =
  "Live room, vocal booth, and overnight lockout sessions. Engineer included, no clock-watching after midnight.";

export const Route = createFileRoute("/rooms")({
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
    <StubPage label={"The Rooms"} blurb={"Live room, vocal booth, and overnight lockouts."} />
  ),
});
