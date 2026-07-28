import { useEffect, useRef } from "react";
import { Ticker } from "@/components/lb/Ticker";
import { GridRules } from "@/components/lb/GridRules";
import { metaChips } from "@/data/tickers";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

export function IdentityMarquee() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-chip]").forEach((chip, i) => {
        gsap.to(chip, {
          x: i % 2 === 0 ? 4 : -4,
          y: i % 3 === 0 ? -3 : 3,
          duration: 6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.7,
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative w-full bg-surface py-[100px]" aria-hidden="true">
      <GridRules tone="dark" />
      <div className="relative z-[2]">
        <Ticker duration={30} reverse>
          <span className="t-giant flex shrink-0 items-center gap-8 pr-8 text-[color:var(--emboss)]">
            Limon Bandit <span className="text-acid-type">✱</span>
          </span>
        </Ticker>

        <div className="shell mt-10 flex flex-wrap items-center gap-8">
          {metaChips.map((chip) => (
            <span key={chip} data-chip className="t-eyebrow text-mute">
              <span className="text-acid-type">[</span>
              {chip}
              <span className="text-acid-type">]</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
