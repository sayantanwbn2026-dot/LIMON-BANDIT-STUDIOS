import { useEffect, useRef } from "react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { useMetrics, useSection } from "@/cms/hooks";

/**
 * The numbers, as a meter bridge.
 *
 * This was four centred figures in a 2x4 grid with a count-up — the stats
 * bar every site has, and the one part of this page that looked bought
 * rather than built. A studio reads its numbers off a meter, so that is
 * what these are now: one ruled channel per metric, the figure at the
 * head, and a segmented meter that arrives with it.
 *
 * THE METER IS THE COUNT-UP, MADE VISIBLE
 * It is not a percentage of anything, and it is deliberately not presented
 * as one — no scale, no ceiling, no axis. It fills from nothing to full on
 * exactly the tween that drives the figure from 0 to its value, so what it
 * shows is the number arriving. Anything else would be a chart implying a
 * denominator the data does not have.
 *
 * Segments come from a repeating-linear-gradient rather than from N spans:
 * a 28-segment meter on four rows is 112 elements to light individually,
 * and a gradient behind a clip-path is one composited write per row per
 * frame instead.
 */

/* Clip rather than scale. scaleX on the fill would stretch each segment as
 * it grows — the meter would appear to change resolution. inset() reveals
 * a fixed gradient, so the segments keep their width and simply arrive. */
const clipAt = (f: number) => `inset(0 ${(1 - f) * 100}% 0 0)`;

export function Numbers() {
  const copy = useSection("home", "numbers");
  const metrics = useMetrics();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap) return;

    const rows = gsap.utils.toArray<HTMLElement>("[data-row]", el);

    /* Reduced motion still gets the numbers and a full meter — it just
     * gets them immediately. The information is never the animation. */
    if (prefersReducedMotion()) {
      rows.forEach((row) => {
        const fill = row.querySelector<HTMLElement>("[data-fill]");
        if (fill) fill.style.clipPath = clipAt(1);
      });
      return;
    }

    const ctx = gsap.context(() => {
      rows.forEach((row, i) => {
        const node = row.querySelector<HTMLElement>("[data-count]");
        const fill = row.querySelector<HTMLElement>("[data-fill]");
        if (!node || !fill) return;

        const target = parseFloat(node.dataset.count ?? "0");
        const decimals = parseInt(node.dataset.decimals ?? "0", 10);
        const obj = { v: 0 };

        gsap.set(fill, { clipPath: clipAt(0) });

        gsap.to(obj, {
          v: target,
          duration: 1.5,
          ease: "expo.out",
          /* staggered down the bridge so the four read as channels coming
           * up one after another rather than one four-part event */
          delay: i * 0.12,
          scrollTrigger: { trigger: el, start: "top 78%", toggleActions: "play none none none" },
          onUpdate: () => {
            node.textContent = obj.v.toFixed(decimals);
            fill.style.clipPath = clipAt(target === 0 ? 1 : obj.v / target);
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <Section surface="bg-surface" className="py-[96px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </div>
        <div className="md:col-span-3">
          <h2 className="t-h2 text-text">{copy.heading}</h2>
        </div>
      </div>

      {/* Two by two on a phone, a column of rows from md. Four full-width
       * rows were a screen and a third for four numbers. */}
      <div ref={ref} className="mt-14 grid grid-cols-2 border-t border-line md:block">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            data-row
            className="grid grid-cols-1 content-start items-baseline gap-x-10 gap-y-3 border-b border-line py-6 max-md:odd:border-r max-md:odd:pr-4 max-md:even:pl-4 md:grid-cols-12 md:gap-y-4 md:py-9"
          >
            {/* The channel: number, what it measures, and the line about it,
             * kept in one cell. Spanning the sentence across all twelve
             * columns put it on a grid row of its own, under the label but
             * beside nothing — it read as a caption for the row above. */}
            <div className="md:col-span-5">
              <div className="flex items-baseline gap-4">
                <span className="tnum font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-acid-type">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="t-label text-mute">{m.label}</span>
              </div>
              <p className="mt-3 max-w-[42ch] font-ui text-[13px] leading-[1.45] text-mute">
                {m.sentence}
              </p>
            </div>

            {/* the figure */}
            {/* First on a phone, where the row is a card read number-first;
             * back in its column from md. */}
            <div className="order-first flex items-baseline gap-1 md:order-none md:col-span-3">
              <span
                data-count={m.value}
                data-decimals={m.decimals}
                className="tnum font-display font-extrabold leading-[0.9] tracking-[-0.04em] text-text"
                style={{ fontSize: "clamp(44px, 4.2vw, 64px)" }}
              >
                {m.value.toFixed(m.decimals)}
              </span>
              <span
                className="font-display font-extrabold leading-[0.9] text-acid-type"
                style={{ fontSize: "clamp(22px, 2.2vw, 34px)" }}
              >
                {m.unit}
              </span>
            </div>

            {/* The meter — texture, not a chart, so it is out of the tree.
             *
             * Masked to a left-to-right intensity ramp. Four solid acid bars
             * at equal length read as four identical progress bars and put
             * more acid on one screen than the whole rest of the page; a
             * meter that builds toward its peak reads as a level, which is
             * what the shape is borrowed from. */}
            <div aria-hidden="true" className="relative h-[16px] md:col-span-4">
              <span className="absolute inset-0 block" style={{ backgroundImage: TRACK }} />
              <span
                data-fill
                className="absolute inset-0 block"
                style={{
                  backgroundImage: LIT,
                  clipPath: clipAt(0),
                  maskImage: RAMP,
                  WebkitMaskImage: RAMP,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* 6px segment, 3px gap. Two gradients rather than one with a colour swap so
 * the unlit track stays visible behind the lit fill as it advances — a meter
 * with no unlit segments reads as a solid bar. */
const SEG =
  "repeating-linear-gradient(to right, COLOR 0px, COLOR 6px, transparent 6px, transparent 9px)";
const TRACK = SEG.replaceAll("COLOR", "var(--line-strong)");
const LIT = SEG.replaceAll("COLOR", "var(--accent)");

/* The intensity ramp. The lit segments are one colour; this is what makes
 * the left of the meter sit back and the peak end carry the acid. */
const RAMP = "linear-gradient(to right, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.62) 55%, #000 100%)";
