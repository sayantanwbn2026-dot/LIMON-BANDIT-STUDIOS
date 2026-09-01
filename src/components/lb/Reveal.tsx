import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/* WordReveal — splits text into words that rise, unblur, and settle.  */
/* ------------------------------------------------------------------ */

export function WordReveal({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  onLoad = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  onLoad?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const words = el.querySelectorAll<HTMLElement>("[data-word]");
    const ctx = gsap.context(() => {
      gsap.set(words, { yPercent: 110, opacity: 0, filter: "blur(8px)" });
      gsap.to(words, {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        stagger: 0.035,
        duration: 0.85,
        delay,
        ease: "expo.out",
        ...(onLoad ? {} : { scrollTrigger: { trigger: el, start: "top 88%", once: true } }),
      });
    }, el);
    return () => ctx.revert();
  }, [delay, onLoad]);

  const lines = text.split("\n");

  return (
    <Tag ref={ref} className={className}>
      {/* data-line so a narrow screen can let these run together. The breaks
       * in the copy are set for a desktop measure — on a phone they stack on
       * top of the natural wrapping and turn a three-line heading into
       * seven. See the mobile section-head block in styles.css. */}
      {lines.map((line, li) => (
        <span key={li} data-line className="block">
          {line.split(" ").map((w, i) => (
            <span key={i} className="word-mask">
              <span data-word className="inline-block">
                {w}
                {"\u00A0"}
              </span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* RiseIn                                                              */
/* ------------------------------------------------------------------ */

export function RiseIn({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    });
    return () => ctx.revert();
  }, [delay]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* PushIn — horizontal system-push entrance                            */
/* ------------------------------------------------------------------ */

export function PushIn({
  children,
  className,
  delay = 0,
  dir = "left",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  dir?: "left" | "right";
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { x: dir === "left" ? -80 : 80, opacity: 0, scale: 0.97 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.75,
          delay,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    });
    return () => ctx.revert();
  }, [delay, dir]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
