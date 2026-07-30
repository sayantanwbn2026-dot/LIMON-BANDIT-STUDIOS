import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BoundaryRule, GridRules } from "./GridRules";
import { MarginNotes } from "./Section";
import { chapter, neighbours, type ChapterKey } from "@/data/routes";

/**
 * The frame every inner route sits in: header band, breadcrumb, and the
 * prev/next chapter footer that makes six documents read as one building.
 *
 * Built once, here, rather than six times slightly differently.
 */
export function PageShell({
  chapter: key,
  children,
}: {
  chapter: ChapterKey;
  children?: ReactNode;
}) {
  const c = chapter(key);

  return (
    <main id="main" className="relative w-full bg-surface-deep">
      <header className="relative w-full overflow-hidden">
        <GridRules tone="dark" />
        <MarginNotes index={c.index} name={c.name} />

        {/* 160px top: the band follows the fixed navbar, which is a chapter
            change in its own right. */}
        <div className="shell relative z-[2] pb-[120px] pt-[160px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
              <li>
                <Link to="/" className="transition-colors duration-300 hover:text-text">
                  LMN&middot;BNDT
                </Link>
              </li>
              <li aria-hidden="true" className="opacity-50">
                /
              </li>
              <li aria-current="page" className="text-text">
                {c.name}
              </li>
            </ol>
          </nav>

          {/* focus lands here on navigation — see RouteTransition */}
          <h1 data-page-h1 tabIndex={-1} className="t-h2 mt-8 max-w-[18ch] text-text outline-none">
            {c.heading}
          </h1>
          <p className="t-lead mt-6 max-w-[54ch] text-mute">{c.standfirst}</p>
        </div>

        <BoundaryRule tone="dark" ticks className="bottom-0" />
      </header>

      {children}

      <ChapterNav current={key} />
    </main>
  );
}

/** Two half-width doors: the room you came from, and the next one along. */
function ChapterNav({ current }: { current: ChapterKey }) {
  const { prev, next } = neighbours(current);

  return (
    <nav aria-label="Chapters" className="relative w-full border-t border-line bg-surface">
      <GridRules tone="dark" />
      <div className="shell relative z-[2] grid grid-cols-1 md:grid-cols-2">
        <ChapterPanel chapter={prev} direction="prev" />
        <ChapterPanel chapter={next} direction="next" />
      </div>
    </nav>
  );
}

function ChapterPanel({
  chapter: c,
  direction,
}: {
  chapter: ReturnType<typeof chapter>;
  direction: "prev" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      to={c.to}
      className={`group flex flex-col gap-6 border-line py-[64px] transition-colors duration-300 hover:bg-surface-raised ${
        isNext ? "md:items-end md:border-l md:pl-10" : "md:pr-10"
      } border-t md:border-t-0`}
    >
      <span className="t-label flex items-center gap-3 text-mute">
        {!isNext && (
          <ArrowLeft
            size={14}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
        )}
        {isNext ? "Next" : "Previous"}
        {isNext && (
          <ArrowRight
            size={14}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        )}
      </span>

      <span className={`flex items-baseline gap-4 ${isNext ? "md:flex-row-reverse" : ""}`}>
        <span className="tnum font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-acid-type">
          {c.index}
        </span>
        <span
          className={`font-display text-[28px] font-extrabold uppercase leading-[1] tracking-[-0.02em] text-text transition-transform duration-300 md:text-[36px] ${
            isNext ? "group-hover:-translate-x-2" : "group-hover:translate-x-2"
          }`}
        >
          {c.name}
        </span>
      </span>
    </Link>
  );
}
