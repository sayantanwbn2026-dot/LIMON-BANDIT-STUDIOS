import { useEffect, useRef, type ReactNode } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

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

  useEffect(() => {
    const row = rowRef.current;
    const wrap = wrapRef.current;
    if (!row || !wrap) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.to(row.children, {
        xPercent: reverse ? 100 : -100,
        repeat: -1,
        duration,
        ease: "none",
        modifiers: {
          xPercent: (x: string) => {
            const v = parseFloat(x);
            return `${reverse ? gsap.utils.wrap(-100, 0, v) : gsap.utils.wrap(-100, 0, v)}%`;
          },
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
  }, [duration, reverse]);

  return (
    <div ref={wrapRef} className={`relative w-full overflow-hidden ${className ?? ""}`}>
      <div ref={rowRef} className="flex w-max will-change-transform">
        {[0, 1, 2].map((i) => (
          <div key={i} aria-hidden={i > 0} className="flex shrink-0 items-center">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TickerItem({ label, tone = "dark" }: { label: string; tone?: "dark" | "light" }) {
  return (
    <span className="flex shrink-0 items-center gap-6 pr-6">
      <span
        className={`t-label whitespace-nowrap ${tone === "dark" ? "text-mute-dark" : "text-text-light"}`}
      >
        {label}
      </span>
      <span className="h-[9px] w-[9px] shrink-0 border border-acid" />
    </span>
  );
}
