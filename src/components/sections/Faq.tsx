import { ArrowRight } from "lucide-react";
import { Section } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { Accordion } from "@/components/lb/Accordion";
import { Picture } from "@/components/lb/Picture";
import { useFaq, useSection } from "@/cms/hooks";

/**
 * The landing-page FAQ.
 *
 * This used to carry its own inline accordion — the same one already
 * extracted into `@/components/lb/Accordion` and used by /rooms and /label —
 * which meant a fix to one had to be remembered in the other. It now uses
 * the shared component, on the alt pole because this section is one of the
 * two dark chapters in light mode.
 */
export function Faq() {
  const copy = useSection("home", "faq");
  const faq = useFaq();
  return (
    /* 160px top: this is where the page changes chapter, dark to light. */
    <Section tone="light" className="pt-[120px] pb-[96px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-alt-acid-type" />
            <span className="t-eyebrow text-alt-text">{copy.eyebrow}</span>
          </div>

          {/* Desktop only. In the stacked phone layout this card came
           * before the heading and every question — offering "still stuck?"
           * to someone who had not yet read one answer — and spent 120px on
           * a mascot at 25% opacity. On a phone the same way out is a line
           * after the questions, below. */}
          <div className="mt-10 hidden border border-alt-line p-8 md:block">
            <Picture
              src="limon-mascot"
              sizes="120px"
              alt=""
              className="h-[120px] w-auto opacity-25"
            />
            <div className="mt-6 font-display text-[18px] font-bold uppercase tracking-[-0.02em] text-alt-text">
              Still stuck?
            </div>
            <a
              href="/contact"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-alt-text font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-alt-surface"
            >
              Message us <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <div className="md:col-span-3">
          <WordReveal as="h2" className="t-h2 text-alt-text" text={copy.heading} />

          <div className="mt-12">
            {/* Five on a phone, the rest behind "Show all": ten rows at
             * 110–140px each was most of this section's 1,929px. Every
             * question also appears on the page its topic belongs to. */}
            <Accordion items={faq} pole="alt" mobileCap={5} />
          </div>

          <a
            href="/contact"
            className="mt-10 flex h-12 w-full items-center justify-center gap-2 bg-alt-text font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-alt-surface md:hidden"
          >
            Still stuck? Message us <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </Section>
  );
}
