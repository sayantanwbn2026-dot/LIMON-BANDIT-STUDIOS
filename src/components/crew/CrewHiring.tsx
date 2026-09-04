import { ArrowRight } from "lucide-react";
import { Accordion } from "@/components/lb/Accordion";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { useFaqByTopic } from "@/cms/hooks";

const STEPS = [
  { k: "01", t: "Say what it is", d: "The project, the date, and the budget you actually have." },
  {
    k: "02",
    t: "We introduce",
    d: "Usually two names, so you are choosing rather than accepting.",
  },
  {
    k: "03",
    t: "You deal direct",
    d: "Contract and payment are between you and them. We step out.",
  },
];

const TERMS = [
  {
    k: "House cut",
    v: "0%",
    d: "We do not take a commission. The list exists so the roster keeps working.",
  },
  {
    k: "Vetting",
    v: "One job",
    d: "Everyone here has finished a project through this building and would be booked again.",
  },
  {
    k: "Turnaround",
    v: "48 hrs",
    d: "That is how long it takes us to come back with names and their availability.",
  },
];

export function CrewHiring() {
  const faqItems = useFaqByTopic("crew");
  return (
    <section className="relative w-full bg-surface py-[120px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface">
              Hiring
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">We introduce, then step out</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">
              A marketplace that takes a cut ends up working for itself. This one does not take one.
            </p>
          </div>
        </div>

        {/* lg, not md — see ShopPrint: the 44px value cannot wrap and the
         * three-column cell is too narrow for it below 1024. */}
        <dl className="mt-16 grid grid-cols-1 border-t border-line lg:grid-cols-3 lg:border-b">
          {TERMS.map((s, i) => (
            <div
              key={s.k}
              className={`border-b border-line py-10 lg:border-b-0 ${
                i > 0 ? "lg:border-l lg:pl-10" : "lg:pr-10"
              } ${i === 1 ? "lg:pr-10" : ""}`}
            >
              <dt className="t-label text-mute">{s.k}</dt>
              <dd>
                <span className="tnum mt-4 block font-display text-[44px] font-extrabold uppercase leading-[1] tracking-[-0.03em] text-acid-type">
                  {s.v}
                </span>
                <span className="mt-4 block max-w-[38ch] font-ui text-[15px] leading-[1.5] text-mute">
                  {s.d}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <ol className="border-t border-line">
              {STEPS.map((s) => (
                <li key={s.k} className="flex gap-6 border-b border-line py-8">
                  <span className="tnum font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-acid-type">
                    {s.k}
                  </span>
                  <span>
                    <span className="block font-display text-[18px] font-bold uppercase tracking-[-0.02em] text-text">
                      {s.t}
                    </span>
                    <span className="mt-2 block max-w-[42ch] font-ui text-[15px] leading-[1.5] text-mute">
                      {s.d}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <a
                href="/contact?intent=crew"
                className="group flex h-[60px] items-center justify-between gap-6 bg-acid px-8 transition-colors duration-300 hover:bg-acid-dim"
              >
                <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
                  Hire the crew
                </span>
                <ArrowRight
                  size={16}
                  className="text-accent-text transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
              <a
                href="/contact?intent=join-crew"
                className="font-ui text-[13px] font-semibold text-mute transition-colors duration-300 hover:text-text"
              >
                or apply to join the list
              </a>
            </div>
          </div>

          <div>
            <h3 className="t-label text-mute">Before you hire</h3>
            <div className="mt-6">
              <Accordion items={faqItems} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
