import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal, RiseIn } from "@/components/lb/Reveal";
import { useSection, useTeam } from "@/cms/hooks";

/**
 * The house — the people who run the building.
 *
 * DELIBERATELY NOT PORTRAITS. Four headshots in a row is the single most
 * templated thing an About page can do, and it would also be a promise the
 * site cannot keep: there is one portrait in the image set, so three of the
 * four would be a grey placeholder and the row would read as a team half
 * assembled. Set as a ruled ledger instead — the same device the rooms, the
 * rates and the crew call sheet already use — it is consistent with the rest
 * of the building and it is true at any headcount.
 *
 * The name slides on hover the way the crew roles do, so the row answers the
 * pointer without needing a card to sit in.
 *
 * Not to be confused with the Crew page: these people are the house, the
 * crew are hired per project and set their own rates. Conflating them would
 * misrepresent both, which is why they are two lists and not one filtered.
 */
export function Team() {
  const copy = useSection("about", "team");
  const team = useTeam();

  if (team.length === 0) return null;

  return (
    <Section tone="dark" className="py-[96px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal as="h2" className="t-h2 text-text" text={copy.heading} />
        </div>
        <div className="flex items-end md:col-span-1">
          {copy.standfirst ? (
            <p className="section-lede font-ui text-[15px] leading-[1.5] text-mute">
              {copy.standfirst}
            </p>
          ) : null}
        </div>
      </div>

      <RiseIn delay={0.08} className="mt-12 border-t border-line">
        <ul>
          {team.map((m, i) => (
            <li
              key={`${m.name}-${i}`}
              className="group grid grid-cols-1 items-baseline gap-x-8 gap-y-2 border-b border-line py-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:py-7"
            >
              {/* THE NAME AND THE ROLE SHARE A LINE ON A PHONE ONLY IF THEY
               * FIT, which they do not: a name at 22px and a tracked label
               * want more than 311px between them. So the name owns its
               * line and the role sits under it, and from `md` the three
               * parts become the ruled row they are on every other page. */}
              <span className="font-display text-[22px] font-extrabold uppercase leading-none tracking-[-0.02em] text-text transition-transform duration-300 group-hover:translate-x-2 md:text-[28px]">
                {m.name}
              </span>

              <span className="t-label text-acid-type md:pt-1">{m.role}</span>

              {m.note ? (
                <span className="font-ui text-[14px] leading-[1.5] text-mute md:col-start-2 md:row-start-2 md:max-w-[52ch]">
                  {m.note}
                </span>
              ) : null}

              {m.since ? (
                <span className="tnum t-label text-mute md:col-start-3 md:row-start-1 md:text-right">
                  Since {m.since}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </RiseIn>
    </Section>
  );
}
