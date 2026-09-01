import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

/**
 * Fires the RGB split once, when the element first scrolls into view.
 *
 * The split itself is CSS (`.glitch` in styles.css, driven by `data-on`);
 * this only decides *when*. Keeping the animation in CSS and the trigger in
 * JS means the effect still exists with JS disabled — it simply never
 * fires — rather than leaving a half-styled element behind.
 *
 * `once: true` is the whole point. A glitch that re-fires every time a
 * heading re-enters the viewport stops reading as a signal and starts
 * reading as a fault, and on a page this long you cross most headings
 * several times.
 *
 * The split is a drop-shadow pair on the element itself, so anything can
 * wear it — plain text, a background-clipped wordmark, an image. There is
 * no duplicated copy to keep in sync and nothing extra for a screen reader
 * to find.
 */
export function GlitchIn({
  as: Tag = "span",
  className,
  delay = 0,
  children,
}: {
  as?: ElementType;
  className?: string;
  /** seconds after the element enters before the split fires */
  delay?: number;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    const gsap = ensureGsap();
    if (!gsap) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        timer = setTimeout(() => {
          el.setAttribute("data-on", "");
          /* Strip the flag once the keyframes have run so the element is
           * back to a clean state — otherwise a later class change would
           * restart a finished animation. */
          timer = setTimeout(() => el.removeAttribute("data-on"), 700);
        }, delay * 1000);
      },
    });

    return () => {
      if (timer) clearTimeout(timer);
      st.kill();
      el.removeAttribute("data-on");
    };
  }, [delay]);

  return (
    <Tag ref={ref} className={`glitch ${className ?? ""}`}>
      {children}
    </Tag>
  );
}
