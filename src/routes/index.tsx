import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/sections/Nav";
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
import { Footer } from "@/components/sections/Footer";
import { Noise } from "@/components/lb/Noise";
import { Cursor } from "@/components/lb/Cursor";
import { Preloader } from "@/components/lb/Preloader";
import { SmoothScroll } from "@/components/lb/SmoothScroll";

const title = "Limon Bandit — Kolkata Music House, Studio Rooms & Label";
const description =
  "Four recording rooms, an independent label, a Kolkata-printed merch line, and a crew of vetted directors and engineers. Book a night, sign a record, print a run.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  return (
    <>
      <Preloader />
      <SmoothScroll />
      <Noise />
      <Cursor />
      <Nav />
      <main>
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
      <Footer />
    </>
  );
}
