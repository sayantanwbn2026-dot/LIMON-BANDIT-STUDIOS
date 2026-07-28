import { useEffect, useRef, type ReactNode } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Magnetic — gravitates its child toward the pointer within a radius.
 * The inner [data-mag-label] counter-translates for a layered feel.
 */
export function Magnetic({
  children,
  className,
  radius = 120,
  strength = 0.35,
  max = 10,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
  strength?: number;
  max?: number;
  as?: "div" | "span" | "li";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const label = el.querySelector<HTMLElement>("[data-mag-label]");
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "expo.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "expo.out" });
    const lx = label ? gsap.quickTo(label, "x", { duration: 0.6, ease: "expo.out" }) : null;
    const ly = label ? gsap.quickTo(label, "y", { duration: 0.6, ease: "expo.out" }) : null;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > Math.max(radius, r.width / 2 + radius * 0.4)) {
        xTo(0);
        yTo(0);
        lx?.(0);
        ly?.(0);
        return;
      }
      const x = gsap.utils.clamp(-max, max, dx * strength);
      const y = gsap.utils.clamp(-max, max, dy * strength);
      xTo(x);
      yTo(y);
      lx?.(gsap.utils.clamp(-4, 4, x * 0.4));
      ly?.(gsap.utils.clamp(-4, 4, y * 0.4));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.set(el, { x: 0, y: 0 });
      if (label) gsap.set(label, { x: 0, y: 0 });
    };
  }, [radius, strength, max]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
