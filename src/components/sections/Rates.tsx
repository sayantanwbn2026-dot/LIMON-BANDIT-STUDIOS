import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { RiseIn, WordReveal } from "@/components/lb/Reveal";
import { useRates } from "@/cms/hooks";

type Mode = "hourly" | "package";

/**
 * Rates, as a rate card rather than a pricing page.
 *
 * Was three bordered cards with a "Popular" flag, a "Save 20%" flag, a
 * check glyph on every feature and a filled button each. The house does not
 * sell that way — the Rooms hero already states its prices as a ruled ledger,
 * and this is the same instrument at a larger size.
 *
 * Kept: the hourly/package toggle, every price, every feature, a booking
 * link per plan. Dropped: the boxes, both badges, fifteen check icons, and
 * the featured card's separate padding and border. The recommended plan is
 * now marked by its price being in acid — one signal, not four.
 */
export function Rates() {
  const rates = useRates();
  const [mode, setMode] = useState<Mode>("hourly");

  return (
    /* bg-surface, not the tone default bg-surface-deep. Dropping the raised
     * cards put the qualifier and note straight onto the section ground, and
     * --mute at 14px measures 4.4:1 on --surface-deep in light mode — just
     * under AA. --surface is one step lighter and clears it. */
    <Section tone="dark" surface="bg-surface" className="py-[120px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <Eyebrow>Rates</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal
            as="h2"
            className="t-h2 text-text"
            text={"Simple rates,\nno surprise invoices."}
          />
        </div>
        <div className="flex items-end md:col-span-1">
          <p className="font-ui text-[16px] leading-[1.5] text-mute">
            Need something custom?{" "}
            <a
              href="/contact"
              className="text-text underline decoration-acid-type underline-offset-4"
            >
              Let&apos;s talk →
            </a>
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <div role="radiogroup" aria-label="Rate type" className="flex border border-line">
          {(["hourly", "package"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className="t-eyebrow px-8 py-4"
              style={{
                backgroundColor: mode === m ? "var(--accent)" : "transparent",
                color: mode === m ? "var(--accent-text)" : "var(--mute)",
                transition:
                  "background-color 0.35s var(--ease-in-out-quart), color 0.35s var(--ease-in-out-quart)",
              }}
            >
              {m === "hourly" ? "Hourly" : "Package"}
            </button>
          ))}
        </div>
        <span className="t-label text-mute">Packages save twenty percent</span>
      </div>

      <ul className="mt-16 border-t border-line">
        {rates.map((r, i) => {
          const price = mode === "hourly" ? r.hourly : r.packagePrice;
          return (
            <li key={r.plan} className="border-b border-line">
              <RiseIn delay={i * 0.06}>
                <article className="grid grid-cols-1 gap-x-10 gap-y-8 py-12 lg:grid-cols-12">
                  {/* the plan */}
                  <div className="lg:col-span-3">
                    <h3 className="font-display text-[26px] font-extrabold uppercase leading-[1.05] tracking-[-0.03em] text-text md:text-[32px]">
                      {r.plan}
                    </h3>
                    <p className="mt-3 max-w-[30ch] font-ui text-[14px] leading-[1.5] text-mute">
                      {r.qualifier}
                    </p>
                    <p className="t-label mt-4 text-mute">{r.note}</p>
                  </div>

                  {/* What it includes. A sentence on a wide row, a stacked
                   * list on a narrow one — the same content, set the way the
                   * measure allows. Run inline at 390px it wrapped to three
                   * lines with the dividing dots landing mid-line, so a list
                   * of five things read as one run-on paragraph and stopped
                   * being scannable. It is a <ul> either way, which is what
                   * it always was semantically. */}
                  <div className="lg:col-span-5">
                    <ul className="flex max-w-[52ch] list-none flex-col gap-2 font-ui text-[15px] leading-[1.6] text-mute md:block">
                      {r.features.map((f, fi) => (
                        <li key={f} className="flex items-baseline gap-2 md:inline">
                          <span aria-hidden="true" className="text-acid-type md:hidden">
                            &middot;
                          </span>
                          <span>{f}</span>
                          {fi < r.features.length - 1 ? (
                            <span
                              aria-hidden="true"
                              className="hidden px-2 text-acid-type md:inline"
                            >
                              &middot;
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* the number */}
                  <div className="lg:col-span-4 lg:text-right">
                    <span
                      className={`tnum block font-display text-[38px] font-extrabold tracking-[-0.04em] md:text-[46px] ${
                        r.featured ? "text-acid-type" : "text-text"
                      }`}
                    >
                      {price.price}
                    </span>
                    <span className="mt-1 block font-ui text-[14px] text-mute">{price.unit}</span>

                    <a
                      href="/contact?intent=booking"
                      className="group mt-6 inline-flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text"
                    >
                      <span className="wipe-underline">Book {r.plan}</span>
                      <ArrowUpRight size={14} className="text-acid-type" />
                    </a>
                  </div>
                </article>
              </RiseIn>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
