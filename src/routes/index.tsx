import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { ProofBand } from "@/components/sections/ProofBand";
import { ThreeWaysIn } from "@/components/sections/ThreeWaysIn";
import { Rooms } from "@/components/sections/Rooms";
import { Numbers } from "@/components/sections/Numbers";
import { Roster } from "@/components/sections/Roster";
import { DropRail } from "@/components/sections/DropRail";
import { Testimonials } from "@/components/sections/Testimonials";
import { Faq } from "@/components/sections/Faq";
import { JoinList } from "@/components/sections/JoinList";
import { FinalCta } from "@/components/sections/FinalCta";
import { BookingEstimator } from "@/components/sections/BookingEstimator";
import { ScrollDepth } from "@/components/lb/ScrollDepth";
import { Preloader } from "@/components/lb/Preloader";
import { chapterHeadFrom, chapterSeo, houseJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: () => chapterSeo("home"),
  head: ({ loaderData }) =>
    chapterHeadFrom("home", loaderData ? { ...loaderData, jsonLd: houseJsonLd() } : undefined),
  component: Index,
});

/**
 * The house, top to bottom.
 *
 * Sections wrapped in <ScrollDepth> arrive from depth and are passed through
 * as the camera moves on. Four are deliberately NOT wrapped, and the reason
 * is the same in every case: a transformed ancestor breaks `position: fixed`
 * descendants and re-bases `position: sticky`.
 *
 *   Hero, ThreeWaysIn, DropRail — each pins with ScrollTrigger
 *   Rooms, Services, RoomFilm   — sticky visual column
 *
 * Wrapping any of those would kill the pin, not merely restyle it. Leave
 * them bare; they already carry their own scroll choreography.
 */
function Index() {
  return (
    <>
      <Preloader />
      {/* Nav, Footer, Noise, Cursor and Lenis live in __root — mounted once
          above the router so they survive navigation. */}
      <main id="main">
        <Hero />

        <ScrollDepth>
          <ProofBand />
        </ScrollDepth>

        {/* Three doors, and they open. The page's own navigation. */}
        <ThreeWaysIn />
        <Rooms />

        {/* Was a table of three plans and a paragraph each — 2,000px of
            reading to reach a number you then had to do arithmetic on. Now
            two questions and a total that moves as you answer them. */}
        <ScrollDepth>
          <BookingEstimator />
        </ScrollDepth>

        <ScrollDepth>
          <Numbers />
        </ScrollDepth>
        <ScrollDepth>
          <Roster />
        </ScrollDepth>

        <DropRail />

        <ScrollDepth>
          <Testimonials />
        </ScrollDepth>
        <ScrollDepth>
          <Faq />
        </ScrollDepth>
        <ScrollDepth>
          <JoinList />
        </ScrollDepth>
        <ScrollDepth>
          <FinalCta />
        </ScrollDepth>
      </main>
    </>
  );
}
