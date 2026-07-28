import { useId, useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { Section } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { faq } from "@/data/faq";
import mascot from "@/assets/limon-mascot.png";

export function Faq() {
  const [open, setOpen] = useState(0);
  const uid = useId();

  return (
    <Section tone="light" className="py-[140px]">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <span className="h-[10px] w-[10px] bg-acid-dim" />
            <span className="t-eyebrow text-text-light">Questions</span>
          </div>

          <div className="mt-10 border border-bone-line p-8">
            <img
              src={mascot}
              alt=""
              aria-hidden="true"
              width={1024}
              height={1280}
              loading="lazy"
              className="h-[120px] w-auto opacity-25"
            />
            <div className="mt-6 font-display text-[18px] font-bold uppercase tracking-[-0.02em] text-text-light">
              Still stuck?
            </div>
            <a
              href="/contact"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-text-light font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-bone"
            >
              Message us <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <div className="md:col-span-3">
          <WordReveal
            as="h2"
            className="t-h2 text-text-light"
            text={"The things people ask\nbefore they book."}
          />

          <div className="mt-14">
            {faq.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.question} className="border-t border-bone-line">
                  <h3>
                    <button
                      type="button"
                      id={`${uid}-t-${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`${uid}-p-${i}`}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      className="flex w-full items-center gap-6 py-8 text-left"
                    >
                      <span className="tnum font-ui text-[13px] text-mute-light">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 font-display text-[18px] font-bold uppercase tracking-[-0.02em] text-text-light">
                        {item.question}
                      </span>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-text-light">
                        {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`${uid}-p-${i}`}
                    role="region"
                    aria-labelledby={`${uid}-t-${i}`}
                    className="grid"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      transition: "grid-template-rows 0.45s var(--ease-in-out-quart)",
                    }}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="max-w-[60ch] pb-8 pl-[52px] font-ui text-[16px] leading-[1.5] text-mute-light"
                        style={{
                          opacity: isOpen ? 1 : 0,
                          transition: "opacity 0.35s ease 0.08s",
                        }}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
