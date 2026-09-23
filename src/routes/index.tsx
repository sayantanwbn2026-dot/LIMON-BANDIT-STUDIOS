import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { ProofBand } from "@/components/sections/ProofBand";
import { IdentityMarquee } from "@/components/sections/IdentityMarquee";
import { Services } from "@/components/sections/Services";
import { ThreeWaysIn } from "@/components/sections/ThreeWaysIn";
import { Rooms } from "@/components/sections/Rooms";
import { Founder } from "@/components/sections/Founder";
import { RoomFilm } from "@/components/sections/RoomFilm";
import { Numbers } from "@/components/sections/Numbers";
import { Roster } from "@/components/sections/Roster";
import { DropRail } from "@/components/sections/DropRail";
import { Wall } from "@/components/sections/Wall";
import { Rates } from "@/components/sections/Rates";
import { Testimonials } from "@/components/sections/Testimonials";
import { Process } from "@/components/sections/Process";
import { Faq } from "@/components/sections/Faq";
import { Journal } from "@/components/sections/Journal";
import { JoinList } from "@/components/sections/JoinList";
import { FinalCta } from "@/components/sections/FinalCta";
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
        <ScrollDepth>
          <IdentityMarquee />
        </ScrollDepth>
        <Services />
        <ThreeWaysIn />
        <Rooms />

        <ScrollDepth>
          <Founder />
        </ScrollDepth>

        <RoomFilm />
        <ScrollDepth>
          <Numbers />
        </ScrollDepth>
        <ScrollDepth>
          <Roster />
        </ScrollDepth>

        <DropRail />

        {/* Bento was here: a third pass at "rooms, label, shop, crew", after
            Services said it as an overview and ThreeWaysIn said it as three
            calls to action. 2,095px on a phone to repeat the page's own
            point. The component is kept (nothing else imports it) in case
            the inline player it carried is wanted back somewhere. */}
        <ScrollDepth>
          <Rates />
        </ScrollDepth>
        <ScrollDepth>
          <Testimonials />
        </ScrollDepth>
        <ScrollDepth>
          <Process />
        </ScrollDepth>
        <ScrollDepth>
          <Wall />
        </ScrollDepth>
        <ScrollDepth>
          <Faq />
        </ScrollDepth>
        <ScrollDepth>
          <Journal />
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
