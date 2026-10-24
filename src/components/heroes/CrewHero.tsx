import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { RiseIn } from "@/components/lb/Reveal";
import { useChapter } from "@/cms/hooks";
import { disciplines, disciplineNote } from "@/data/crew";
import { useCrew } from "@/cms/hooks";

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
export function CrewHero() {
  const c = useChapter("crew");
  /* Counts come from the CMS roster the directory below renders, so the
   * call sheet can never advertise more — or fewer — crew than it lists.
   * They used to come from the compiled roster, which an editor never
   * touches, so adding someone in the admin left the count behind. */
  const crew = useCrew();
  const roles = disciplines.map((d) => ({
    role: d === "Cover artist" ? "Cover artists" : `${d}s`,
    count: String(crew.filter((m) => m.discipline === d).length).padStart(2, "0"),
    note: disciplineNote[d],
  }));

  return (
    <HeroFrame
      chapter="crew"
      lockup={<PosterLockup spread={c.poster.spread} word={c.poster.word} srText={c.heading} />}
    >
      <div className="mt-14 max-w-[52ch]">
        <p className="t-lead text-text">{c.standfirst}</p>
      </div>

      <RiseIn delay={0.1} className="mt-12 border-t border-line">
        <ul>
          {roles.map((r) => (
            /* A grid on a phone, a ruled line from md. As a wrapping flex
             * row each discipline broke differently with the length of its
             * note: "Engineers" kept its note on the first line and pushed
             * the count down alone, the others dropped the note and kept
             * the count beside it. The grid pins the count to the name's
             * line and the note under it, so all four rows share one shape. */
            <li
              key={r.role}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-2 border-b border-line py-6 md:flex md:flex-wrap"
            >
              <span className="font-display text-[24px] font-extrabold uppercase leading-none tracking-[-0.03em] text-text transition-transform duration-300 group-hover:translate-x-2 md:text-[34px]">
                {r.role}
              </span>
              <span className="tnum col-start-2 row-start-1 font-ui text-[12px] font-bold uppercase tracking-[0.18em] text-acid-type md:order-3 md:ml-auto">
                {r.count}
              </span>
              <span className="t-label text-mute md:order-2">{r.note}</span>
            </li>
          ))}
        </ul>
      </RiseIn>

      <p className="t-label mt-6 text-mute">Vetted, rated, hired by the project</p>
    </HeroFrame>
  );
}
