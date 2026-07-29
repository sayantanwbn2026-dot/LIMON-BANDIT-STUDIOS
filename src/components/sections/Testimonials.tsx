import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { GridRules } from "@/components/lb/GridRules";
import { RiseIn, WordReveal } from "@/components/lb/Reveal";
import { Ticker } from "@/components/lb/Ticker";
import { testimonials } from "@/data/testimonials";
import { testimonialTicker } from "@/data/tickers";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { Picture } from "@/components/lb/Picture";

export function Testimonials() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const ctx = gsap.context(() => {
      gsap.to("[data-col='left']", {
        y: -60,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
      });
      gsap.to("[data-col='right']", {
        y: -110,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const left = testimonials.filter((_, i) => i % 2 === 0);
  const right = testimonials.filter((_, i) => i % 2 === 1);

  return (
    <section ref={ref} className="relative w-full bg-acid pt-[160px]">
      <GridRules tone="acid" />
      <div className="shell relative z-[2] pb-[160px]">
        <div className="section-head">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <span className="h-[10px] w-[10px] bg-accent-text" />
              <span className="t-eyebrow text-accent-text">What they say</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <WordReveal as="h2" className="t-h2 text-accent-text" text={"The roster talks."} />
          </div>
          <div className="flex flex-col justify-end gap-6 md:col-span-1">
            <div className="flex items-center gap-4">
              <div className="flex">
                {testimonials.slice(0, 3).map((t, i) => (
                  <Picture
                    key={t.name}
                    src={t.photo}
                    sizes="44px"
                    alt=""
                    className="h-10 w-10 border border-acid object-cover mono"
                    style={{ marginLeft: i === 0 ? 0 : -10 }}
                  />
                ))}
              </div>
              <span className="font-ui text-[12px] text-accent-text">
                Artists · Producers · Engineers
              </span>
            </div>
            <a
              href="/label"
              className="group flex w-fit items-center gap-3 border border-accent-text px-6 py-4 transition-colors duration-300 hover:bg-accent-text"
            >
              <span className="t-eyebrow text-accent-text transition-colors duration-300 group-hover:text-acid">
                See the roster
              </span>
              <ArrowRight
                size={15}
                className="text-accent-text transition-all duration-300 group-hover:translate-x-1 group-hover:text-acid"
              />
            </a>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[left, right].map((col, ci) => (
            <div key={ci} data-col={ci === 0 ? "left" : "right"} className="flex flex-col gap-6">
              {col.map((t, i) => (
                <RiseIn key={t.name} delay={i * 0.08}>
                  <article className="bg-surface-deep p-8">
                    <span
                      aria-hidden="true"
                      className="block font-display text-[40px] font-extrabold leading-none text-acid-type"
                    >
                      &ldquo;
                    </span>
                    <blockquote className="mt-4 font-display text-[22px] font-bold uppercase leading-[1.2] tracking-[-0.02em] text-text">
                      {t.quote}
                    </blockquote>
                    <div className="mt-8 h-px w-full bg-line" />
                    <div className="mt-6 flex items-center gap-4">
                      <Picture
                        src={t.photo}
                        sizes="44px"
                        alt={`Portrait of ${t.name}`}
                        className="h-11 w-11 object-cover mono"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-[14px] font-bold uppercase text-text">
                          {t.name}
                        </div>
                        <div className="font-ui text-[11px] text-mute">{t.role}</div>
                      </div>
                      <span className="t-label text-mute">LB</span>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6">
                      <div>
                        <div className="t-label text-mute">// Room</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {t.rooms.map((r) => (
                            <span
                              key={r}
                              className="t-label rounded-[2px] border border-line px-3 py-2 text-mute"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="border-l border-line pl-6">
                        <div className="t-label text-mute">// Result</div>
                        <div className="tnum mt-3 font-display text-[24px] font-extrabold tracking-[-0.03em] text-acid-type">
                          {t.resultValue}
                        </div>
                        <div className="t-label mt-1 text-mute">{t.resultLabel}</div>
                      </div>
                    </div>
                  </article>
                </RiseIn>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-[2] flex h-[52px] items-center bg-surface-deep">
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
