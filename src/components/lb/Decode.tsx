import { useEffect, useRef, useState, type ElementType } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const GLYPHS = "#/\\<>[]-";

/**
 * Decode — scramble-decodes text once on first scroll-in (or on load).
 * Never replays.
 */
export function Decode({
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
  const [out, setOut] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    let done = false;

    const run = () => {
      if (done) return;
      done = true;
      const chars = text.split("");
      const total = 600;
      const start = performance.now();
      const budget = chars.map(() => 2 + Math.floor(Math.random() * 4));

      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / total);
        const revealed = Math.floor(p * chars.length * 1.15);
        setOut(
          chars
            .map((c, i) => {
              if (c === " " || i < revealed) return c;
              if (budget[i]-- < -40) return c;
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join(""),
        );
        if (p < 1) raf = requestAnimationFrame(tick);
        else setOut(text);
      };
      raf = requestAnimationFrame(tick);
    };

    if (onLoad) {
      timer = setTimeout(run, delay * 1000);
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            timer = setTimeout(run, delay * 1000);
            io.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      io.observe(el);
      return () => {
        io.disconnect();
        clearTimeout(timer);
        cancelAnimationFrame(raf);
      };
    }

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [text, delay, onLoad]);

  return (
    <Tag ref={ref} className={className}>
      {out}
    </Tag>
  );
}
