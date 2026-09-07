import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BoundaryRule, GridRules, type Tone } from "./GridRules";
import { MarginNotes } from "./Section";
import { chapter, type ChapterKey } from "@/data/routes";

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
  const c = chapter(key);
  const tint = crumbTint[tone];

  return (
    <header
      className={`relative w-full overflow-hidden ${surface ?? "bg-surface-deep"} ${className ?? ""}`}
    >
      <GridRules tone={tone} />
      <MarginNotes index={c.index} name={c.name} tone={tone} />

      <div className={`shell relative z-[2] ${bodyClassName ?? "pb-[96px] pt-[120px]"}`}>
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
