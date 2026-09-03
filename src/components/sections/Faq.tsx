import { ArrowRight } from "lucide-react";
import { Section } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { Accordion } from "@/components/lb/Accordion";
import { faq } from "@/data/faq";
import { Picture } from "@/components/lb/Picture";

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
  return (
    /* 160px top: this is where the page changes chapter, dark to light. */
    <Section tone="light" className="pt-[160px] pb-[120px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <span className="h-[10px] w-[10px] bg-alt-acid-type" />
            <span className="t-eyebrow text-alt-text">Questions</span>
          </div>

          <div className="mt-10 border border-alt-line p-8">
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
          <WordReveal
            as="h2"
            className="t-h2 text-alt-text"
            text={"The things people ask\nbefore they book."}
          />

          <div className="mt-12">
            <Accordion items={faq} pole="alt" />
          </div>
        </div>
      </div>
    </Section>
  );
}
