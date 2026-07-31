import { ArrowRight } from "lucide-react";
import { Accordion } from "@/components/lb/Accordion";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { faqByTopic } from "@/data/faq";

const SPLITS = [
  {
    k: "Artist keeps",
    v: "70%",
    d: "Of net receipts, on everything — streaming, sync, physical, merch tied to the record.",
  },
  {
    k: "Label takes",
    v: "30%",
    d: "Against recording, mastering, artwork, distribution and press. No recoupable extras.",
  },
  {
    k: "Paid",
    v: "Monthly",
    d: "Statements on the 5th, payment the same week. Masters revert after five years.",
  },
];

/**
 * The deal, in three columns and no marketing language. If a split is worth
 * signing it survives being stated plainly.
 */
export function LabelSplits() {
  return (
    <section className="relative w-full bg-surface py-[120px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface">
              The deal
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">Seventy thirty, stated plainly</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">
              One page, no schedule of exceptions. If you want a lawyer to read it, it is short
              enough that they will not charge you much.
            </p>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-1 border-t border-line md:grid-cols-3">
          {SPLITS.map((s, i) => (
            <div
              key={s.k}
              className={`border-b border-line py-10 md:border-b-0 ${
                i > 0 ? "md:border-l md:pl-10" : "md:pr-10"
              } ${i === 1 ? "md:pr-10" : ""}`}
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
            <h3 className="font-display text-[24px] font-bold uppercase tracking-[-0.02em] text-text">
              Send two tracks
            </h3>
            <p className="mt-4 max-w-[46ch] font-ui text-[16px] leading-[1.5] text-mute">
              Two finished songs and a sentence about what you are building. We answer everyone,
              including the no&apos;s, and we tell you why.
            </p>
            <a
              href="/contact?intent=demo"
              className="group mt-8 flex h-[60px] w-fit items-center justify-between gap-6 bg-acid px-8 transition-colors duration-300 hover:bg-acid-dim"
            >
              <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
                Submit a demo
              </span>
              <ArrowRight
                size={16}
                className="text-accent-text transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </div>

          <div>
            <h3 className="t-label text-mute">Before you send</h3>
            <div className="mt-6">
              <Accordion items={faqByTopic("label")} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
