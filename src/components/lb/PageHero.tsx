import type { ReactNode } from "react";
import { BoundaryRule, GridRules, type Tone } from "./GridRules";
import { MarginNotes } from "./Section";
import { type ChapterKey } from "@/data/routes";
import { useChapter } from "@/cms/hooks";

/**
 * The chrome every page hero shares — drafting grid, margin notes and the
 * closing boundary rule — with the middle left open.
 *
 * NO BREADCRUMB. There used to be a "LMN·BNDT / <chapter>" trail under the
 * nav on every chapter page. The nav's own logotype already goes to "/" and
 * the nav's own menu already names every chapter, so the trail repeated
 * information that was one glance away twice over, and it put a line of
 * filing-system chrome under a hero that is trying to read as one confident
 * opening rather than a breadcrumb trail.
 *
 * FITS THE VIEWPORT, like the landing page. `min-h-[100svh]` at `lg` and up
 * is a floor, not a fixed height: a hero with little to say (Shop, Crew)
 * now opens as a full first screen the way the home page's does, and a hero
 * with a lot to say (the Rooms ledger, the Label figures) simply runs past
 * the floor exactly as it always could — nothing is clipped, because this
 * is `min-height`, not `height`.
 *
 * Below `lg` the floor is not applied, for the same reason the mascot
 * (see PosterLockup) does not stand there either: the hero is already the
 * tallest thing between the reader and the page on a phone, and forcing a
 * full screen of mostly air under a two-line standfirst is not what this
 * is for.
 *
 * Two contracts the rest of the app depends on and which must survive any
 * hero design: the element is a <header> (RouteTransition rises `main >
 * header` on arrival) and the heading inside carries `data-page-h1` with
 * tabIndex -1 (RouteTransition moves focus there). Each hero supplies its own
 * <h1>; this frame supplies everything around it.
 *
 * 160px of top padding clears the fixed navbar and then some — the band is a
 * chapter change in its own right.
 */

export function HeroFrame({
  chapter: key,
  tone = "dark",
  surface,
  className,
  bodyClassName,
  children,
}: {
  chapter: ChapterKey;
  tone?: Tone;
  /** override the background class; defaults to the page's deep surface */
  surface?: string;
  /** applied to the <header> itself — inverted heroes use it to clear the navbar */
  className?: string;
  /** override the inner padding when a hero needs a different rhythm */
  bodyClassName?: string;
  children: ReactNode;
}) {
  const c = useChapter(key);

  return (
    <header
      /* Marks this page as opening with a hero — the navbar floats over one
       * transparently and only goes solid further down. A page without the
       * mark starts its content directly under the bar, so the bar has to
       * be solid from the first pixel (see Nav). */
      data-hero
      className={`relative w-full overflow-hidden ${surface ?? "bg-surface-deep"} lg:min-h-[100svh] ${className ?? ""}`}
    >
      <GridRules tone={tone} />
      <MarginNotes index={c.index} name={c.name} tone={tone} />

      <div className={`shell relative z-[2] ${bodyClassName ?? "pb-[96px] pt-[120px]"}`}>
        {children}
      </div>

      <BoundaryRule tone={tone} ticks className="bottom-0" />
    </header>
  );
}

/**
 * Shared <h1> treatment. Size varies per hero; the contract does not.
 *
 * `ref` is taken as a plain prop (React 19) and forwarded, because the heroes
 * pass this as WordReveal's `as` target and WordReveal attaches a ref to
 * drive the split-word timeline. Swallowing it would silently disable the
 * reveal rather than break anything visibly.
 */
export function HeroHeading({
  children,
  className,
  ref,
}: {
  children?: ReactNode;
  className?: string;
  ref?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <h1 ref={ref} data-page-h1 tabIndex={-1} className={`outline-none ${className ?? ""}`}>
      {children}
    </h1>
  );
}
