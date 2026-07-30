import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { ProofBand } from "@/components/sections/ProofBand";
import { IdentityMarquee } from "@/components/sections/IdentityMarquee";
import { Services } from "@/components/sections/Services";
import { ThreeWaysIn } from "@/components/sections/ThreeWaysIn";
import { Rooms } from "@/components/sections/Rooms";
import { Founder } from "@/components/sections/Founder";
import { Numbers } from "@/components/sections/Numbers";
import { Roster } from "@/components/sections/Roster";
import { DropRail } from "@/components/sections/DropRail";
import { Bento } from "@/components/sections/Bento";
import { Wall } from "@/components/sections/Wall";
import { Rates } from "@/components/sections/Rates";
import { Testimonials } from "@/components/sections/Testimonials";
import { Process } from "@/components/sections/Process";
import { Faq } from "@/components/sections/Faq";
import { Journal } from "@/components/sections/Journal";
import { JoinList } from "@/components/sections/JoinList";
import { FinalCta } from "@/components/sections/FinalCta";
import { Preloader } from "@/components/lb/Preloader";
import { chapterHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => chapterHead("home"),
  component: Index,
});

function Index() {
  return (
    <>
      <Preloader />
      {/* Nav, Footer, Noise, Cursor and Lenis live in __root — mounted once
          above the router so they survive navigation. */}
      <main id="main">
        <Hero />
        <ProofBand />
        <IdentityMarquee />
        <Services />
        <ThreeWaysIn />
        <Rooms />
        <Founder />
        <Numbers />
        <Roster />
        <DropRail />
        <Bento />
        <Rates />
        <Testimonials />
        <Process />
        <Wall />
        <Faq />
        <Journal />
        <JoinList />
        <FinalCta />
      </main>
    </>
  );
}
