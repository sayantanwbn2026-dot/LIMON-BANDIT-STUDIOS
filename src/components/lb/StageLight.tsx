import { useEffect } from "react";

/**
 * Drives "the stage light" — see the block of that name at the end of
 * styles.css. Mounted once, above the router.
 *
 * One delegated listener for the whole document rather than one per card:
 * it finds the framed element under the pointer and writes the pointer's
 * position into it as --mx / --my, in the element's own pixels. Writes are
 * batched to one per frame, and only the element actually under the
 * pointer is touched, so a page with sixty framed controls costs the same
 * as a page with one.
 *
 * pointerdown as well as pointermove, so a tap on a phone — which sends no
 * move first — still lights from where the finger landed.
 */
const FRAMED = 'a[class~="border"], button[class~="border"], .lb-lit';

export function StageLight() {
  useEffect(() => {
    let raf = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;

    const flush = () => {
      raf = 0;
      if (!pending) return;
      const { el, x, y } = pending;
      pending = null;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${x - r.left}px`);
      el.style.setProperty("--my", `${y - r.top}px`);
    };

    const onPointer = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const el = t?.closest?.(FRAMED) as HTMLElement | null;
      if (!el) return;
      pending = { el, x: e.clientX, y: e.clientY };
      if (e.type === "pointerdown") flush();
      else if (!raf) raf = requestAnimationFrame(flush);
    };

    document.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerdown", onPointer, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerdown", onPointer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
