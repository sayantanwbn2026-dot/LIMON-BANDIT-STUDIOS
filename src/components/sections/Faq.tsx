import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Section } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { Accordion } from "@/components/lb/Accordion";
import { Picture } from "@/components/lb/Picture";
import { useFaq, useSection } from "@/cms/hooks";

/**
 * The landing-page FAQ.
 *
 * FOUR QUESTIONS, NOT TEN.
 *
 * Every one of the ten is already answered on the page its topic belongs
 * to — booking on /rooms and /contact, the split on /label, returns on
 * /shop, rates on /crew — so the home page was repeating the whole set in
 * full and spending about 1,900px doing it. A phone got five with the rest
 * behind "Show all"; a desktop got all ten, which is where most of the
 * length actually was.
 *
 * It shows the first four now at every width, and then says where the rest
 * are rather than hiding them behind a toggle that leads nowhere. WHICH
 * four is the CMS's business: they are the first four rows of the Questions
 * list, so reordering there changes what the front page asks.
 *
 * It uses the shared Accordion — the same one on /rooms and /label — so a
 * fix to one cannot be forgotten in the other.
 */
const HOME_QUESTIONS = 4;

/* Where the rest of them live. Each topic in the Questions list is
 * answered in full on one of these. */
const ELSEWHERE = [
  { to: "/rooms", label: "Booking a room" },
  { to: "/label", label: "The label" },
  { to: "/shop", label: "Orders & returns" },
  { to: "/crew", label: "Hiring the crew" },
] as const;
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
            <Accordion items={faq.slice(0, HOME_QUESTIONS)} pole="alt" />
          </div>

          {/* The way on, rather than a "show all" that only unfolds more of
           * the same page. */}
          {faq.length > HOME_QUESTIONS ? (
            <div className="mt-8 border-t border-alt-line pt-6">
              <p className="font-ui text-[13px] text-alt-mute">
                The rest are answered where they apply.
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                {ELSEWHERE.map((e) => (
                  <li key={e.to}>
                    <Link
                      to={e.to}
                      className="tap inline-flex items-center gap-1.5 font-ui text-[13px] font-semibold text-alt-text transition-opacity duration-300 hover:opacity-70"
                    >
                      <span className="wipe-underline">{e.label}</span>
                      <ArrowRight size={13} className="text-alt-acid-type" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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
