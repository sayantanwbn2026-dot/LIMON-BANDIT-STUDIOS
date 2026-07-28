import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      window.matchMedia("(min-width: 1024px)").matches &&
      window.matchMedia("(pointer: fine)").matches;
    setEnabled(ok);
    if (!ok) return;

    document.documentElement.style.cursor = "none";
    const reduced = prefersReducedMotion();

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { ...target };
    let raf = 0;
    let grown = false;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const dot = dotRef.current;
      if (dot) dot.style.transform = `translate3d(${e.clientX - 5}px, ${e.clientY - 5}px, 0)`;
      if (reduced && ringRef.current) {
        ringRef.current.style.transform = `translate3d(${e.clientX - 18}px, ${e.clientY - 18}px, 0) scale(${grown ? 1.9 : 1})`;
      }
    };

    const tick = () => {
      ring.x += (target.x - ring.x) * 0.12;
      ring.y += (target.y - ring.y) * 0.12;
      const el = ringRef.current;
      if (el) {
        el.style.transform = `translate3d(${ring.x - 18}px, ${ring.y - 18}px, 0) scale(${grown ? 1.9 : 1})`;
      }
      raf = requestAnimationFrame(tick);
    };
    if (!reduced) raf = requestAnimationFrame(tick);

    const setGrown = (v: boolean) => {
      grown = v;
      const el = ringRef.current;
      const dot = dotRef.current;
      if (el) {
        el.style.borderColor = v ? "var(--acid)" : "rgba(244,244,240,0.35)";
      }
      if (dot) dot.style.opacity = v ? "0" : "1";
    };

    const onOver = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest) return;
      const play = t.closest<HTMLElement>('[data-cursor="play"]');
      const grow = t.closest<HTMLElement>('a, button, [data-cursor="grow"]');
      setLabel(play ? "PLAY" : null);
      setGrown(Boolean(play || grow));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver, true);
      document.documentElement.style.cursor = "auto";
    };
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden="true">
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[10px] w-[10px] bg-acid will-change-transform"
        style={{ transition: "opacity 0.25s var(--ease-out-expo)" }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] flex h-[36px] w-[36px] items-center justify-center border will-change-transform"
        style={{
          borderColor: "rgba(244,244,240,0.35)",
          transition: "border-color 0.25s var(--ease-out-expo)",
        }}
      >
        {label ? (
          <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-acid">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
