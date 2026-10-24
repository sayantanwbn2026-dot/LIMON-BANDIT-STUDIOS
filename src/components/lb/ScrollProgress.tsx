import { useEffect, useRef } from "react";

/**
 * How far down the page you are: one acid hairline across the top edge.
 *
 * The site's rules are 1px lines and its one accent is acid, so the only
 * new thing here is that this line moves. It sits above the navbar and
 * below the menu, starts at nothing, and is not there at all until you
 * have scrolled — the top of a page has nothing to report.
 *
 * Written straight to the element's transform on a frame, not through
 * state: it changes on every scroll event, and a re-render per frame for a
 * line is the wrong trade.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
      el.style.opacity = p > 0.002 ? "1" : "0";
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    const ro = new ResizeObserver(queue);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9991] h-px origin-left bg-acid opacity-0 transition-opacity duration-300"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
