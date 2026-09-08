import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import type { Tone } from "./GridRules";

/** Copies rendered before anything has been measured, and the floor after. */
const MIN_COPIES = 3;

export function Ticker({
  children,
  duration = 45,
  reverse = false,
  className,
}: {
  children: ReactNode;
  duration?: number;
  reverse?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(MIN_COPIES);

  /* ---- enough copies to cover the track ----
   *
   * Three was hardcoded, and three is only enough when one copy is at
   * least half the container. The animation shifts the row left by
   * exactly one copy, so what has to cover the container is the copies
   * *behind* the first one: (copies - 1) x copyWidth >= containerWidth.
   *
   * Short content on a wide screen fails that badly — measured at
   * 1920px, the "Real rooms / Real records / Real payouts" strip is a
   * 443px copy in a 1905px track, so two copies behind the first leave
   * over a thousand pixels of empty rail scrolling through the middle
   * of the section. It never showed while the marquee was frozen; the
   * moment it moved, it would have been the most obvious thing on the
   * page.
   *
   * Measured rather than guessed, because copy width depends on the
   * font, the text, and the viewport — all three of which change. */
  useLayoutEffect(() => {
    const fit = () => {
      const row = rowRef.current;
      const wrap = wrapRef.current;
      const first = row?.children[0] as HTMLElement | undefined;
      if (!row || !wrap || !first) return;
      const copyW = first.offsetWidth;
      const trackW = wrap.clientWidth;
      if (!copyW || !trackW) return;
      const needed = Math.max(MIN_COPIES, Math.ceil(trackW / copyW) + 1);
      /* Only ever set on a real change: this runs inside a layout effect
       * and a ResizeObserver, and writing state unconditionally would
       * loop. */
      setCopies((c) => (c === needed ? c : needed));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    /* The strip is type, so its width moves when the webfont lands. */
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(fit).catch(() => {});
    }
    return () => ro.disconnect();
  }, [children]);

  useEffect(() => {
    const row = rowRef.current;
    const wrap = wrapRef.current;
    if (!row || !wrap) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      /* The modifier has to return a NUMBER.
       *
       * This used to build a string — `${wrap(...)}%` — and that is why
       * the marquee stood still. `xPercent` is a numeric component of the
       * transform, not a CSS length, so a "%"-suffixed string is not
       * something the CSS plugin can write: it tweened the value happily
       * (GSAP's own cache read back -62 while this was broken) and then
       * rendered no transform at all. Nothing errored, nothing warned,
       * and every ticker on the site was simply frozen.
       *
       * `gsap.utils.wrap(min, max)` with no third argument returns the
       * wrapping function itself, which is exactly the shape a modifier
       * wants. The window has to follow the direction of travel, too:
       * forwards runs 0 → -100 and wraps within [-100, 0), backwards runs
       * 0 → 100 and wraps within [0, 100). Both branches used to be the
       * same expression, so a reversed ticker was wrapping into a window
       * it never entered.
       *
       * Why it is seamless: the copies are identical and adjacent,
       * so shifting the row by exactly one copy's width puts copy two
       * where copy one was. The reset at the end of each cycle lands on a
       * pixel-identical frame, and there is no visible seam to hide. */
      const tl = gsap.to(row.children, {
        xPercent: reverse ? 100 : -100,
        repeat: -1,
        duration,
        ease: "none",
        modifiers: {
          xPercent: reverse ? gsap.utils.wrap(0, 100) : gsap.utils.wrap(-100, 0),
        },
      });

      const slow = () => gsap.to(tl, { timeScale: 0.25, duration: 0.4, overwrite: true });
      const fast = () => gsap.to(tl, { timeScale: 1, duration: 0.4, overwrite: true });
      wrap.addEventListener("pointerenter", slow);
      wrap.addEventListener("pointerleave", fast);
      return () => {
        wrap.removeEventListener("pointerenter", slow);
        wrap.removeEventListener("pointerleave", fast);
      };
    }, wrap);
    return () => ctx.revert();
  }, [duration, reverse, copies]);

  return (
    <div ref={wrapRef} className={`relative w-full overflow-hidden ${className ?? ""}`}>
      <div ref={rowRef} className="flex w-max will-change-transform">
        {Array.from({ length: copies }, (_, i) => (
          /* Only the first copy is readable; the rest are duplicates and
           * would be read out again by a screen reader. */
          <div key={i} aria-hidden={i > 0} className="flex shrink-0 items-center">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TickerItem({ label, tone = "dark" }: { label: string; tone?: Tone }) {
  const tint =
    tone === "dark" ? "text-mute" : tone === "light" ? "text-alt-text" : "text-accent-text";
  return (
    <span className="flex shrink-0 items-center gap-6 pr-6">
      <span className={`t-label whitespace-nowrap ${tint}`}>{label}</span>
      <span className="h-[9px] w-[9px] shrink-0 border border-acid-type" />
    </span>
  );
}
