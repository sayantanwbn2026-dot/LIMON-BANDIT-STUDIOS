import { useEffect, useRef } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * MaskReveal — plotter-style left-to-right clip reveal for images.
 * Wrapper clips inset(0 100% 0 0) -> inset(0 0% 0 0); child scales 1.12 -> 1.
 */
export function MaskReveal({
  src,
  alt,
  className,
  imgClassName,
  style,
  delay = 0,
  loading = "lazy",
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
  delay?: number;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const img = el.querySelector("img");
    const ctx = gsap.context(() => {
      gsap.set(el, { clipPath: "inset(0 100% 0 0)" });
      gsap.set(img, { scale: 1.12 });
      const tl = gsap.timeline({
        delay,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
      tl.to(el, { clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "power4.inOut" }, 0);
      tl.to(img, { scale: 1, duration: 0.9, ease: "power4.inOut" }, 0);
    }, el);
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={wrap} className={`overflow-hidden ${className ?? ""}`} style={style}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={imgClassName ?? "h-full w-full object-cover"}
      />
    </div>
  );
}
