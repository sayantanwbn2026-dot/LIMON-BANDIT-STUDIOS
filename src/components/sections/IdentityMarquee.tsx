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
      const mm = gsap.matchMedia();

      /* Desktop only. The chips sit on a generous single row there, so a
       * few pixels of drift reads as float. On a phone they wrap to a grid
       * and the same 4px pushes each one off its column by a different
       * amount at a different moment — the row stops looking aligned and
       * starts looking broken. Stillness is the better phone behaviour. */
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const chips = gsap.utils.toArray<HTMLElement>("[data-chip]", el);
        chips.forEach((chip, i) => {
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
        return () => gsap.set(chips, { clearProps: "transform" });
      });

      return () => mm.revert();
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative w-full bg-surface py-[96px]" aria-hidden="true">
      <GridRules tone="dark" />
      <div className="relative z-[2]">
        {/* The shell wrapper is what gives the marquee its clip box. Ticker's
         * own root carries the overflow, and overflow clips at the padding
         * box — so the padding has to live on a parent, or the type would
         * still run out through it to the viewport edge. */}
        <div className="shell">
          {/* t-giant's clamp floor is 90px, which is a desktop floor: on a
           * 390px screen it fits the word "LIMON" and nothing else, so the
           * marquee stopped reading as a phrase in motion and started
           * reading as one clipped word in a colour you can barely see.
           * Smaller on a phone shows the whole lockup and the acid star. */}
          <Ticker duration={30} reverse>
            <span className="t-giant flex shrink-0 items-center gap-8 pr-8 text-[color:var(--emboss)] max-md:text-[length:44px]">
              Limon Bandit <span className="text-acid-type">✱</span>
            </span>
          </Ticker>
        </div>

        {/* Two even columns on a phone instead of a ragged 3-then-1 wrap.
         * The chips are a set of equal facts, so they should read as a
         * block, not as a line that ran out of room. */}
        <div className="shell mt-10 grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:items-center sm:gap-8">
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
