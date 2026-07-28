import { useState } from "react";
import { Check } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { RiseIn, WordReveal } from "@/components/lb/Reveal";
import { rates } from "@/data/rates";

type Mode = "hourly" | "package";

export function Rates() {
  const [mode, setMode] = useState<Mode>("hourly");

  return (
    <Section tone="dark" className="py-[140px]">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
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
            <a href="/contact" className="text-text underline decoration-acid-type underline-offset-4">
              Let&apos;s talk →
            </a>
          </p>
        </div>
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-4">
        <div
          role="radiogroup"
          aria-label="Rate type"
          className="relative flex border border-line"
        >
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
                transition: "background-color 0.35s var(--ease-in-out-quart), color 0.35s var(--ease-in-out-quart)",
              }}
            >
              {m === "hourly" ? "Hourly" : "Package"}
            </button>
          ))}
        </div>
        <span className="t-label bg-acid px-3 py-2 text-accent-text">Save 20%</span>
      </div>

      <div className="mt-12 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {rates.map((r, i) => {
          const price = mode === "hourly" ? r.hourly : r.packagePrice;
          return (
            <RiseIn key={r.plan} delay={i * 0.1}>
              <article
                className={`relative flex flex-col border p-10 ${
                  r.featured ? "border-acid-type bg-surface-raised py-[64px]" : "border-line bg-surface"
                }`}
              >
                {r.featured && (
                  <span className="t-label absolute right-0 top-0 bg-acid px-3 py-2 text-accent-text">
                    Popular
                  </span>
                )}
                <h3 className="font-display text-[16px] font-bold uppercase tracking-[-0.02em] text-text">
                  {r.plan}
                </h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="tnum font-display text-[44px] font-extrabold tracking-[-0.04em] text-text">
                    {price.price}
                  </span>
                  <span className="font-ui text-[14px] text-mute">{price.unit}</span>
                </div>
                <p className="mt-3 font-ui text-[14px] text-mute">{r.qualifier}</p>

                <div className="my-8 h-px w-full bg-line" />

                <div className="t-label text-mute">What&apos;s included</div>
                <ul className="mt-5 space-y-3">
                  {r.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 font-ui text-[15px] text-text">
                      <Check size={14} className="mt-[4px] shrink-0 text-acid-type" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="/contact"
                  className={`mt-10 flex h-14 items-center justify-center font-ui text-[13px] font-bold uppercase tracking-[0.14em] transition-colors duration-300 ${
                    r.featured
                      ? "bg-acid text-accent-text hover:bg-acid-dim"
                      : "border border-line text-text hover:bg-surface-raised"
                  }`}
                >
                  Book this
                </a>
                <p className="mt-4 font-ui text-[12px] text-mute">{r.note}</p>
              </article>
            </RiseIn>
          );
        })}
      </div>
    </Section>
  );
}
