import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { RiseIn } from "@/components/lb/Reveal";
import { chapter } from "@/data/routes";
import { crewCounts } from "@/data/crew";

/**
 * CREW — the call sheet, under the house lockup.
 *
 * The heading is the landing page's poster set to this page's phrase. What
 * makes it Crew is the credits block beneath: roles ruled line by line the
 * way end credits are, counts tabular so the right column stacks.
 *
 * The old heading sat at h3 to let the call sheet carry the page. With the
 * poster above it that deference has somewhere to point, so the standfirst
 * keeps the lead voice and the roles keep theirs.
 */
/* Counts come from the roster rather than being typed here, so the call
 * sheet can never advertise more crew than the directory below it lists. */
const roles = crewCounts().map((c) => ({
  role: c.discipline === "Cover artist" ? "Cover artists" : `${c.discipline}s`,
  count: c.count,
  note: c.note,
}));

export function CrewHero() {
  const c = chapter("crew");

  return (
    <HeroFrame chapter="crew">
      <PosterLockup
        className="mt-10"
        spread={c.poster.spread}
        word={c.poster.word}
        srText={c.heading}
      />

      <div className="mt-14 max-w-[52ch]">
        <p className="t-lead text-text">{c.standfirst}</p>
      </div>

      <RiseIn delay={0.1} className="mt-12 border-t border-line">
        <ul>
          {roles.map((r) => (
            <li
              key={r.role}
              className="group flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-line py-6"
            >
              <span className="font-display text-[24px] font-bold leading-none tracking-[-0.03em] text-text transition-transform duration-300 group-hover:translate-x-2 md:text-[34px]">
                {r.role}
              </span>
              <span className="t-label text-mute">{r.note}</span>
              <span className="tnum ml-auto t-action text-acid-type">{r.count}</span>
            </li>
          ))}
        </ul>
      </RiseIn>

      <p className="t-label mt-6 text-mute">Vetted, rated, hired by the project</p>
    </HeroFrame>
  );
}
