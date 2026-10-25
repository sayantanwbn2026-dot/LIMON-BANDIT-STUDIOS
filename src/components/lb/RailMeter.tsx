import { useEffect, useRef, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Where you are in a swipe rail — a count and a hairline with an acid
 * thumb, under the rail, on phones only.
 *
 * The peeking sliver of the next card says there is more to the side; it
 * does not say how much, or that you have reached the end, and a rail of
 * six release cards gives no sign of either. This does both, in the
 * house's own parts: tabular figures in a label, a 1px rule, acid for the
 * one thing that moves.
 *
 * Place it directly after the `.rail-mobile` element: it finds its rail as
 * its previous sibling, so a section adds one line and no ref. From 768px
 * the rails are grids again and this is not rendered at all; below that it
 * keeps its height before it has measured anything, so nothing under a
 * rail shifts when it appears.
 */
export function RailMeter({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const [view, setView] = useState({ on: false, i: 0, n: 0 });

  useEffect(() => {
    const me = ref.current;
    const rail = me?.previousElementSibling as HTMLElement | null;
    if (!me || !rail || !rail.classList.contains("rail-mobile")) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const max = rail.scrollWidth - rail.clientWidth;
      const n = rail.children.length;
      const on = max > 4 && n > 1 && getComputedStyle(rail).overflowX !== "visible";
      const p = max > 0 ? Math.min(1, Math.max(0, rail.scrollLeft / max)) : 0;
      const frac = rail.scrollWidth > 0 ? rail.clientWidth / rail.scrollWidth : 1;

      const thumb = thumbRef.current;
      if (thumb) {
        thumb.style.width = `${frac * 100}%`;
        thumb.style.transform = `translateX(${frac > 0 ? (p * (1 - frac) * 100) / frac : 0}%)`;
      }

      /* The card whose leading edge is nearest where a card snaps to. At
       * the far end the last cards cannot reach that line, so the end of
       * the scroll counts as the last card. */
      let i = 0;
      if (p > 0.98) i = n - 1;
      else {
        const r = rail.getBoundingClientRect();
        const start = r.left + parseFloat(getComputedStyle(rail).paddingLeft || "0");
        let best = Infinity;
        for (let k = 0; k < n; k++) {
          const d = Math.abs(rail.children[k].getBoundingClientRect().left - start);
          if (d < best) {
            best = d;
            i = k;
          }
        }
      }
      setView((v) => (v.on === on && v.i === i && v.n === n ? v : { on, i, n }));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    rail.addEventListener("scroll", queue, { passive: true });
    const ro = new ResizeObserver(queue);
    ro.observe(rail);
    const mo = new MutationObserver(queue);
    mo.observe(rail, { childList: true });
    return () => {
      cancelAnimationFrame(raf);
      rail.removeEventListener("scroll", queue);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`mt-5 flex items-center gap-4 transition-opacity duration-300 md:hidden ${
        view.on ? "opacity-100" : "opacity-0"
      } ${className ?? ""}`}
    >
      <span className="t-label tnum shrink-0 text-mute">
        <span className="text-text">{pad(view.i + 1)}</span> / {pad(Math.max(view.n, 1))}
      </span>
      <span className="relative block h-px flex-1 overflow-hidden bg-line">
        <span
          ref={thumbRef}
          className="absolute inset-y-0 left-0 block w-1/3 bg-acid will-change-transform"
        />
      </span>
    </div>
  );
}
