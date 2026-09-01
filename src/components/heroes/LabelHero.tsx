import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { RiseIn } from "@/components/lb/Reveal";
import { chapter } from "@/data/routes";

/**
 * LABEL — the split, under the house lockup.
 *
 * The heading is the landing page's poster set to this page's phrase. What
 * makes it Label is the number underneath: 70 / 30 with the acid slash
 * carrying the division. The figures step down from their old display size
 * because the poster now holds the display weight — two things at that
 * scale in one hero and neither is the headline.
 *
 * The figures are decorative repetition of the standfirst, so the pair is
 * aria-hidden and the accessible reading stays "Seventy-thirty, paid monthly".
 */
export function LabelHero() {
  const c = chapter("label");

  return (
    <HeroFrame chapter="label">
      <PosterLockup
        className="mt-10"
        spread={c.poster.spread}
        word={c.poster.word}
        srText={c.heading}
      />

      <div className="mt-14 grid grid-cols-1 gap-16 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-20">
        <div>
          <p className="t-lead max-w-[44ch] text-mute">{c.standfirst}</p>

          <dl className="mt-12 flex flex-wrap gap-x-16 gap-y-6">
            {[
              { k: "Paid", v: "Monthly" },
              { k: "Rights", v: "Artist keeps" },
              { k: "Streaming", v: "Own player" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="t-label text-mute">{s.k}</dt>
                <dd className="mt-2 font-display text-[15px] font-bold uppercase tracking-[-0.01em] text-text">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <RiseIn delay={0.12} className="shrink-0">
          <div aria-hidden="true" className="flex items-center gap-4 md:gap-6">
            <Figure value="70" caption="Artist" />
            <span
              className="font-display font-extrabold leading-none text-acid-type"
              style={{ fontSize: "clamp(44px, 6vw, 72px)" }}
            >
              /
            </span>
            <Figure value="30" caption="House" />
          </div>
        </RiseIn>
      </div>
    </HeroFrame>
  );
}

function Figure({ value, caption }: { value: string; caption: string }) {
  return (
    <span className="block">
      {/* Stepped down from clamp(76px, 12vw, 140px). At that size the split
       * and the poster word were the same weight stacked one above the
       * other, and the hero read as two headlines arguing. It is now the
       * second voice, which is what it always was in the reading order. */}
      <span
        className="tnum block font-display font-extrabold leading-[0.82] tracking-[-0.05em] text-text"
        style={{ fontSize: "clamp(56px, 8vw, 96px)" }}
      >
        {value}
      </span>
      <span className="t-label mt-3 block text-mute">{caption}</span>
    </span>
  );
}
