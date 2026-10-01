import type { ReactNode } from "react";
import { BoundaryRule, GridRules, type Tone } from "./GridRules";
import { Picture } from "./Picture";
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
 * THE POSTER STAGE
 *
 * Pass `lockup` and the hero opens the way the landing page opens: one
 * viewport, exactly — `height: 100svh, minHeight: 680`, the same two values
 * the home hero's own <section> carries — holding the chapter's wordmark
 * and the mascot standing in front of it, and nothing else. The chapter's
 * own content starts underneath, below the fold.
 *
 * That split is the whole reason this takes a slot rather than reading the
 * first child. The mascot is 52–68vh of the band; if the ledger, the split
 * figures or the contact slip shared the band with him they would be behind
 * him, and they are the things people came to the page for. Home has the
 * same arrangement for the same reason — its hero holds a wordmark, a
 * mascot and one button, and every fact on the page is below it.
 *
 * Without `lockup` the frame stays a plain band and only takes a
 * `lg:min-h-[100svh]` floor, which is what the Journal masthead wants: it
 * is set as a newspaper front page and has no mascot.
 *
 * Two contracts the rest of the app depends on and which must survive any
 * hero design: the element is a <header> (RouteTransition rises `main >
 * header` on arrival) and the heading inside carries `data-page-h1` with
 * tabIndex -1 (RouteTransition moves focus there). Each hero supplies its own
 * <h1>; this frame supplies everything around it.
 */

export function HeroFrame({
  chapter: key,
  tone = "dark",
  surface,
  className,
  bodyClassName,
  lockup,
  mascot = true,
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
  /**
   * The chapter's wordmark. Given one, the hero opens with a full-viewport
   * poster stage — wordmark plus mascot — and `children` begins below it.
   */
  lockup?: ReactNode;
  /**
   * Stand the mascot on the poster stage. Only meaningful alongside
   * `lockup`, since the stage is what he is positioned against.
   */
  mascot?: boolean;
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
      className={`relative w-full overflow-hidden ${surface ?? "bg-surface-deep"} ${
        lockup ? "" : "lg:min-h-[100svh]"
      } ${className ?? ""}`}
    >
      <GridRules tone={tone} />
      <MarginNotes index={c.index} name={c.name} tone={tone} />

      {lockup ? (
        /* One viewport, the same two values home's own hero section uses.
         * `height`, not `min-height`: the stage is a fixed stage, and
         * anything that wants to grow belongs in the band below it. */
        <div className="relative" style={{ height: "100svh", minHeight: 680 }}>
          <div className="shell relative z-[2] pt-[120px]">{lockup}</div>

          {mascot ? (
            /* Verbatim from the home hero — the same breakpoint ladder, the
             * same anchor, the same z-index above the wordmark, the same
             * saturation and the same 40/80 drop shadow. Copied rather than
             * re-derived on purpose: "like the home page" is a thing that
             * has to stay true after somebody edits one of the two, and the
             * only way to see that is for the two to read identically.
             *
             * `priority` for the same reason home sets it: at 52–68vh he is
             * the largest paint on the page, so he is the LCP, and `sizes`
             * has to track the box or the browser picks a source half the
             * width he needs and he arrives soft. */
            <div className="pointer-events-none absolute bottom-[18svh] left-1/2 z-[5] h-[52svh] w-[92vw] max-w-[560px] -translate-x-1/2 md:bottom-[8svh] md:h-[54vh] md:w-[54vw] lg:h-[62vh] lg:w-[48vw] lg:max-w-[720px] 2xl:h-[68vh]">
              <Picture
                src="limon-mascot"
                alt="Limon, the Limon Bandit mascot: a lemon in a bandana and leather jacket"
                sizes="(max-width: 767px) 90vw, (max-width: 1023px) 360px, 660px"
                priority
                className="block h-full w-full object-contain"
                style={{ filter: "saturate(0.92) drop-shadow(0 40px 80px var(--limon-shadow))" }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={`shell relative z-[2] ${
          bodyClassName ?? (lockup ? "pb-[96px] pt-[96px]" : "pb-[96px] pt-[120px]")
        }`}
      >
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
