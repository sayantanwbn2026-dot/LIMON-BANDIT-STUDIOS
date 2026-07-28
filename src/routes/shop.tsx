import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/lb/StubPage";

const title = 'The Drop — Limon Bandit Merch, Printed in Kolkata';
const description = 'Tees, outerwear, caps, and vinyl. Small runs printed locally and sold direct. No restocks.';

export const Route = createFileRoute("/shop")({
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
  component: () => <StubPage label={'The Drop'} blurb={'Merch cut and printed in Kolkata. Small runs, no restocks.'} />,
});
