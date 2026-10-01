import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Tone } from "./GridRules";

/**
 * The landing page's lockup, as a component every page can wear.
 *
 * Two parts, and the relationship between them is the whole idea: a short
 * word letter-spread edge to edge across the measure, and underneath it a
 * single word scaled until it spans that *same* measure exactly. The two
 * share one width, so the block reads as one drawn object rather than two
 * stacked headings, and it is that shared edge — not the typeface — that
 * makes the landing hero recognisable.
 *
 * Every page therefore gets the same instrument playing its own phrase:
 * LIMON BANDIT, STUDIO ROOMS, MERCH DROP. See `poster` in data/routes.
 *
 * ACCESSIBILITY
 * Both halves are decorative duplicates of the page's real heading, so both
 * are aria-hidden and the <h1> carries the editorial heading in an sr-only
 * span. A screen reader hears "Four rooms, one building", not "S T U D I O
 * ROOMS". This mirrors the landing hero, which has always announced "Limon
 * Bandit" while showing LIMON / BANDIT.
 *
 * The <h1> keeps `data-page-h1` and tabIndex -1 because RouteTransition
 * moves focus there on arrival — the same contract HeroHeading carries.
 */

/* `fill` is the pole-correct wordmark gradient. hero-wall's own token pair
 * follows the THEME, so on an inverted panel it paints bone onto bone —
 * see hero-wall-alt in styles.css. */
const tint: Record<Tone, { spread: string; rule: string; fill: string; text: string }> = {
  dark: { spread: "text-mute", rule: "bg-acid", fill: "hero-wall", text: "text-text" },
  light: {
    spread: "text-alt-mute",
    rule: "bg-acid",
    fill: "hero-wall-alt",
    text: "text-alt-text",
  },
  acid: {
    spread: "text-accent-text",
    rule: "bg-accent-text",
    fill: "text-accent-text",
    text: "text-accent-text",
  },
};

export function PosterLockup({
  spread,
  word,
  srText,
  tone = "dark",
  className,
}: {
  /** letter-spread across the full measure, e.g. "Studio" */
  spread: string;
  /** fitted to span the measure exactly, e.g. "Rooms" */
  word: string;
  /** the real heading, announced instead of the decorative halves */
  srText: string;
  tone?: Tone;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  /* wordRef must stay on the element carrying font-size — the routine
   * measures its intrinsic width at a known size and scales from there. */
  const wordRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(120);

  /* Fit by measurement, not by a vw formula. The measure changes with the
   * page margin and the gutter, both of which step at breakpoints, and the
   * word's own width depends on which glyphs are in it — "DROP" and
   * "SOMETHING" cannot share a coefficient. Measure at 100px, scale by the
   * ratio, and the word lands flush to both rules at any width. */
  useLayoutEffect(() => {
    const fit = () => {
      const el = wordRef.current;
      const box = boxRef.current;
      if (!el || !box) return;
      const target = box.clientWidth;
      if (!target) return;
      el.style.fontSize = "100px";
      const w = el.getBoundingClientRect().width;
      if (!w) return;
      const next = (target / w) * 100;
      el.style.fontSize = `${next}px`;
      setSize(next);
    };

    fit();
    const ro = new ResizeObserver(fit);
    if (boxRef.current) ro.observe(boxRef.current);
    window.addEventListener("resize", fit);
    /* the display face is loaded, so the first fit runs against a fallback
     * whose metrics differ — re-fit once the real one lands */
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(fit).catch(() => {});
    }
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [word]);

  const t = tint[tone];
  const letters = spread.toUpperCase().split("");

  /* Fire the split shortly after mount rather than on scroll: this is the
   * page hero, so it is already in view when the route arrives and a
   * scroll trigger would never fire for the visitor who does not scroll. */
  useEffect(() => {
    const el = wordRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const on = setTimeout(() => el.setAttribute("data-on", ""), 260);
    const off = setTimeout(() => el.removeAttribute("data-on"), 1000);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
      el.removeAttribute("data-on");
    };
  }, [word]);

  return (
    <div ref={boxRef} className={`w-full ${className ?? ""}`}>
      {/* The h1 gets a pole-correct colour even though every visible child
       * overrides it. The sr-only heading inherits from here, so without it
       * that text would be bone-on-bone on the inverted pole — invisible if
       * `sr-only` is ever overridden or the class is dropped in a refactor.
       * Nothing legible should depend on a clipping utility staying applied. */}
      <h1 data-page-h1 tabIndex={-1} className={`m-0 w-full outline-none ${t.text}`}>
        <span aria-hidden="true" className="flex w-full items-center justify-between">
          <span className={`block h-[8px] w-[8px] shrink-0 ${t.rule}`} />
          <span
            className={`flex flex-1 justify-between px-3 font-ui text-[11px] font-bold uppercase md:text-[14px] ${t.spread}`}
          >
            {letters.map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </span>
          <span className={`block h-[8px] w-[8px] shrink-0 ${t.rule}`} />
        </span>

        <span className="sr-only">{srText}</span>

        {/* The word arrives with a single RGB split — the one glitch per
         * page, on the largest thing on it. It fires once from the effect
         * above and the flag is stripped afterwards; a wordmark that
         * glitches every time you scroll back up stops being a signal and
         * becomes a fault. The split is a drop-shadow pair on the word
         * itself, so it fringes the clipped letterforms rather than
         * repainting over them. */}
        <span aria-hidden="true" className="mt-3 block w-full" style={{ lineHeight: 0.82 }}>
          <span
            ref={wordRef}
            className={`glitch ${t.fill} inline-block whitespace-nowrap font-display font-extrabold uppercase`}
            style={{
              fontSize: size,
              letterSpacing: "-0.045em",
              /* the last glyph's right side bearing would otherwise push the
               * word past the rule it is supposed to sit flush against */
              marginRight: "-0.045em",
              lineHeight: 0.82,
            }}
          >
            {word.toUpperCase()}
          </span>
        </span>
      </h1>
    </div>
  );
}
