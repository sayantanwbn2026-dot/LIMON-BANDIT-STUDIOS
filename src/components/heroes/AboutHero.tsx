import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { RiseIn } from "@/components/lb/Reveal";
import { useChapter, useMetrics, useTeam } from "@/cms/hooks";

/**
 * ABOUT — the house, counted.
 *
 * Same poster lockup as every other chapter, so the page reads as another
 * door in the same building rather than a different design wearing the grid.
 *
 * What makes it About is the ledger beneath: the figures that already exist
 * elsewhere on the site, gathered in one place. They are READ, not written —
 * the team count comes from the team list this page renders further down, so
 * the hero can never claim a number the page then contradicts. That mistake
 * is easy to make by hand and impossible to make this way.
 */
export function AboutHero() {
  const c = useChapter("about");
  const team = useTeam();
  const metrics = useMetrics();

  /* Two from the CMS metrics, one counted live. If an editor removes a
   * metric the row shortens rather than rendering a hole, which is why this
   * filters rather than indexes. */
  const figures = [
    { value: String(team.length).padStart(2, "0"), label: "People in the building" },
    ...metrics.slice(0, 2).map((m) => ({ value: `${m.value}${m.unit ?? ""}`, label: m.label })),
  ].filter((f) => f.label);

  return (
    <HeroFrame
      chapter="about"
      lockup={<PosterLockup spread={c.poster.spread} word={c.poster.word} srText={c.heading} />}
    >
      <div className="mt-14 max-w-[54ch]">
        <p className="t-lead text-text">{c.standfirst}</p>
      </div>

      <RiseIn delay={0.1} className="mt-12 border-t border-line">
        <dl className="grid grid-cols-1 sm:grid-cols-3">
          {figures.map((f, i) => (
            <div
              key={f.label}
              /* Ruled between on a phone where they stack, and beside each
               * other from `sm` where the vertical rule does that job. The
               * last one never draws, so the block closes on the section
               * rule rather than on a line of its own. */
              className={`py-6 sm:py-8 ${i < figures.length - 1 ? "border-b border-line sm:border-b-0 sm:border-r" : ""} ${i > 0 ? "sm:pl-8" : ""}`}
            >
              <dd className="tnum font-display text-[34px] font-extrabold uppercase leading-none tracking-[-0.03em] text-acid-type md:text-[42px]">
                {f.value}
              </dd>
              <dt className="t-label mt-3 text-mute">{f.label}</dt>
            </div>
          ))}
        </dl>
      </RiseIn>
    </HeroFrame>
  );
}
