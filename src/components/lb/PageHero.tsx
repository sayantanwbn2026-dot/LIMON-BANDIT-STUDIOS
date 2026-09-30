import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BoundaryRule, GridRules, type Tone } from "./GridRules";
import { Picture } from "./Picture";
import { MarginNotes } from "./Section";
import { type ChapterKey } from "@/data/routes";
import { useChapter } from "@/cms/hooks";

/**
 * The chrome every page hero shares — drafting grid, margin notes, breadcrumb
 * and the closing boundary rule — with the middle left open.
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

const crumbTint: Record<Tone, { rest: string; here: string; hover: string }> = {
  dark: { rest: "text-mute", here: "text-text", hover: "hover:text-text" },
  light: { rest: "text-alt-mute", here: "text-alt-text", hover: "hover:text-alt-text" },
  acid: { rest: "text-accent-text", here: "text-accent-text", hover: "hover:text-accent-text" },
};

export function HeroFrame({
  chapter: key,
  tone = "dark",
  surface,
  className,
  bodyClassName,
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
   * Stand the mascot at the foot of the hero, as he stands on the home
   * page. On by default: every chapter should open as the same building.
   *
   * Pass false for a hero that needs the whole band — the Journal
   * masthead is set as a newspaper and a lemon in a leather jacket
   * standing in the margin of it is a different joke.
   */
  mascot?: boolean;
  children: ReactNode;
}) {
  const c = useChapter(key);
  const tint = crumbTint[tone];

  return (
    <header
      /* Marks this page as opening with a hero — the navbar floats over one
       * transparently and only goes solid further down. A page without the
       * mark starts its content directly under the bar, so the bar has to
       * be solid from the first pixel (see Nav). */
      data-hero
      className={`relative w-full overflow-hidden ${surface ?? "bg-surface-deep"} ${className ?? ""}`}
    >
      <GridRules tone={tone} />
      <MarginNotes index={c.index} name={c.name} tone={tone} />

      {/* HE GETS HIS OWN BAND RATHER THAN FLOATING OVER THE CONTENT.
       *
       * Three of the six chapter heroes carry something in their right
       * column — the rooms ledger, the label's figures, the contact card —
       * and all three are set on transparent ground, so a mascot behind
       * them would read straight through the type. Extra bottom padding
       * gives him a strip of his own at the foot of the band, standing on
       * the boundary rule exactly as he stands on the home page's.
       *
       * Desktop only. On a phone the hero is already the tallest thing
       * between the reader and the page, and 200px of lemon is not what
       * that space is for. */}
      <div
        className={`shell relative z-[2] ${bodyClassName ?? "pb-[96px] pt-[120px]"} ${
          mascot ? "lg:pb-[248px] xl:pb-[288px]" : ""
        }`}
      >
        <nav aria-label="Breadcrumb">
          <ol
            className={`flex flex-wrap items-center gap-2 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] ${tint.rest}`}
          >
            <li>
              <Link to="/" className={`tap transition-colors duration-300 ${tint.hover}`}>
                LMN&middot;BNDT
              </Link>
            </li>
            <li aria-hidden="true" className="opacity-50">
              /
            </li>
            <li aria-current="page" className={tint.here}>
              {c.name}
            </li>
          </ol>
        </nav>

        {children}
      </div>

      {mascot ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-[var(--page-margin)] z-[1] hidden h-[190px] w-auto lg:block xl:h-[230px]"
        >
          <Picture
            src="limon-mascot"
            alt=""
            sizes="260px"
            className="block h-full w-auto object-contain"
            /* The home hero's treatment, so the two read as one figure in
             * one building rather than two different lemons. */
            style={{ filter: "saturate(0.92) drop-shadow(0 30px 60px var(--limon-shadow))" }}
          />
        </div>
      ) : null}

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
