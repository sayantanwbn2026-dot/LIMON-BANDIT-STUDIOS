import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { Featured } from "@/components/sections/Featured";
import { ProofBand } from "@/components/sections/ProofBand";
import { Rooms } from "@/components/sections/Rooms";
import { RoomFilm } from "@/components/sections/RoomFilm";
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
import { useHomeOrder } from "@/cms/hooks";
import { HOME_SECTIONS, type HomeSectionKey } from "@/cms/home-sections";
import { chapterHeadFrom, chapterSeoWith, houseJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: () => chapterSeoWith("home", houseJsonLd),
  head: ({ loaderData }) => chapterHeadFrom("home", loaderData),
  component: Index,
});

/**
 * The house, top to bottom — in whatever order the CMS says.
 *
 * WHY A REGISTRY RATHER THAN JSX IN ORDER
 * The page used to be a literal stack of components, so changing the order
 * meant changing this file. It is now a map from the key an editor picks to
 * the thing that renders, and the order comes from "Home page order" in the
 * admin. Nothing else about a section changes.
 *
 * WHICH ONES ARE WRAPPED
 * `ScrollDepth` transforms its subtree, and a transformed ancestor re-bases
 * `position: sticky` against the transform instead of the viewport. So every
 * section with a sticky part — the film's stage, the rooms' pinned column,
 * the drop rail — renders bare, and only the ones that are ordinary flow get
 * the arrive-from-depth treatment. Getting this wrong does not throw; it
 * quietly breaks the pinning, which is why it is a property of the registry
 * rather than a decision made per-render.
 */
const SECTIONS: Record<HomeSectionKey, { render: () => React.ReactNode; depth: boolean }> = {
  featured: { render: () => <Featured />, depth: true },
  proof: { render: () => <ProofBand />, depth: true },
  rooms: { render: () => <Rooms />, depth: false },
  film: { render: () => <RoomFilm />, depth: false },
  estimator: { render: () => <BookingEstimator />, depth: true },
  numbers: { render: () => <Numbers />, depth: true },
  roster: { render: () => <Roster />, depth: true },
  drops: { render: () => <DropRail />, depth: false },
  testimonials: { render: () => <Testimonials />, depth: true },
  faq: { render: () => <Faq />, depth: true },
  join: { render: () => <JoinList />, depth: true },
  cta: { render: () => <FinalCta />, depth: true },
};

function Index() {
  const order = useHomeOrder();

  /* Resolve the stored order against what actually exists.
   *
   * Two failure modes this has to survive, because both WILL happen:
   *
   *   A row naming a section that no longer exists in the code — an old
   *   document, or a key removed in a deploy. Dropped silently; there is
   *   nothing to render and a crash on the front page is not a reasonable
   *   answer to a stale row.
   *
   *   A section that exists in the code but is in nobody's stored order —
   *   anything shipped since the document was last saved. Appended at the
   *   end rather than hidden, so a new section is never invisible while an
   *   editor waits for someone to tell them it is there. They can then put
   *   it where they want it. */
  const chosen = order.filter((r) => r.on !== false && r.section in SECTIONS);
  const named = new Set(chosen.map((r) => r.section));
  const missing = HOME_SECTIONS.filter((s) => !order.some((r) => r.section === s.key)).map((s) => ({
    section: s.key,
    on: true,
  }));

  const rows = [...chosen, ...missing.filter((m) => !named.has(m.section))];

  return (
    <>
      <Preloader />
      {/* Nav, Footer, Noise, Cursor and Lenis live in __root — mounted once
          above the router so they survive navigation. */}
      <main id="main">
        {/* Always first, never in the list. The masthead is not a section
            an editor should be able to put in the middle of the page. */}
        <Hero />

        {rows.map((row) => {
          const entry = SECTIONS[row.section as HomeSectionKey];
          if (!entry) return null;
          return entry.depth ? (
            <ScrollDepth key={row.section}>{entry.render()}</ScrollDepth>
          ) : (
            <div key={row.section}>{entry.render()}</div>
          );
        })}
      </main>
    </>
  );
}
