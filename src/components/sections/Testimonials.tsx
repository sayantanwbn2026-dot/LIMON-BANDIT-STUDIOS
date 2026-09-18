import { ArrowRight } from "lucide-react";
import { GridRules } from "@/components/lb/GridRules";
import { WordReveal, RiseIn } from "@/components/lb/Reveal";
import { Ticker } from "@/components/lb/Ticker";
import { useSection, useTestimonials, useTickers } from "@/cms/hooks";

/**
 * The roster talks — set the way the hero is set.
 *
 * Was two parallax columns of bordered cards, each carrying a display quote
 * glyph, a portrait, a name block, an "LB" mark, a row of room chips and a
 * nested result grid. Eight pieces of chrome around one sentence.
 *
 * Now the sentence is the section. One ruled column, the quote at display
 * scale, attribution and result on a single meta line beneath it. On a
 * desktop nothing is boxed; the hairline does the separating, exactly as it
 * does on the Rooms ledger and the Crew directory. On a phone each quote is
 * a boxed card in a swipe rail, because a rail needs edges to swipe between.
 *
 * ON THE ACID SURFACE, NOTHING IS DIMMED
 * There is no muted token for the acid pole, and dropping --accent-text to
 * 60% would land it under AA on #E9FF00. Hierarchy here comes from size and
 * weight only — every piece of type is full-strength ink.
 */
const RULE = "rgba(0,0,0,0.22)";

export function Testimonials() {
  const copy = useSection("home", "testimonials");
  const { testimonialTicker } = useTickers();
  const testimonials = useTestimonials();
  return (
    <section className="relative w-full bg-acid pt-[120px]">
      <GridRules tone="acid" />

      <div className="shell relative z-[2] pb-[120px]">
        <div className="section-head">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-accent-text" />
              <span className="t-eyebrow text-accent-text">{copy.eyebrow}</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <WordReveal as="h2" className="t-h2 text-accent-text" text={copy.heading} />
          </div>
          <div className="flex items-end md:col-span-1">
            <a
              href="/label"
              className="group inline-flex items-center gap-2 t-action text-accent-text"
            >
              <span className="wipe-underline">See the roster</span>
              <ArrowRight size={14} className="lb-arrow" />
            </a>
          </div>
        </div>

        {/* Rows ruled top and bottom on a desktop; on a phone, a swipe rail
         * of boxed cards (see .rail-mobile) — five full-width quotes were
         * two and a half screens. The borders moved from inline style to
         * classes because a phone card needs all four sides and a desktop
         * row only one, and an inline border cannot change at a breakpoint. */}
        <ul
          className="rail-mobile mt-16 md:border-t md:border-[color:var(--rule)]"
          style={{ ["--rule" as string]: RULE }}
        >
          {testimonials.map((t, i) => (
            <li
              key={t.name}
              className="border border-[color:var(--rule)] px-6 md:border-x-0 md:border-t-0 md:px-0"
            >
              <RiseIn delay={i * 0.05}>
                <article className="grid grid-cols-1 gap-x-10 gap-y-6 py-8 md:py-12 lg:grid-cols-12 lg:items-baseline">
                  <blockquote className="lg:col-span-8">
                    <p className="max-w-[26ch] font-display text-[24px] font-bold leading-[1.08] tracking-[-0.03em] text-accent-text md:text-[34px]">
                      {t.quote}
                    </p>
                  </blockquote>

                  <div className="lg:col-span-2">
                    <span className="block font-ui text-[14px] font-bold uppercase tracking-[0.06em] text-accent-text">
                      {t.name}
                    </span>
                    <span className="mt-1 block font-ui text-[13px] text-accent-text">
                      {t.role}
                    </span>
                  </div>

                  <div className="lg:col-span-2 lg:text-right">
                    <span className="tnum block font-display text-[20px] font-extrabold tracking-[-0.03em] text-accent-text">
                      {t.resultValue}
                    </span>
                    <span className="t-label mt-1 block text-accent-text">
                      {t.resultLabel.replace("#", "")}
                    </span>
                  </div>
                </article>
              </RiseIn>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-[2] flex h-12 items-center bg-surface-deep">
        <Ticker duration={38} reverse>
          {testimonialTicker.map((t) => (
            <span key={t} className="flex shrink-0 items-center gap-6 pr-6">
              <span className="t-label whitespace-nowrap text-mute">{t}</span>
              <span className="h-[9px] w-[9px] shrink-0 bg-acid" />
            </span>
          ))}
        </Ticker>
      </div>
    </section>
  );
}
