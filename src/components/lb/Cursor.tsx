import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Is the surface under this point light — acid, bone, a light-theme page?
 *
 * The cursor is an acid dot and a pale ring, drawn for the dark pole. Over
 * an acid section (the testimonials band, an acid button) the dot vanished
 * into the ground and the ring with it, so the pointer simply went missing.
 * Rather than keep a list of which sections are acid, it reads the first
 * solid background under the pointer and asks whether it is light: that
 * covers every acid surface, the bone panels, and the whole light theme,
 * including surfaces an editor has not invented yet.
 *
 * Photographs and film are not a surface; over them the cursor keeps its
 * own colours, which are made to sit on top of an image.
 */
function lightAt(x: number, y: number): boolean {
  let el = document.elementFromPoint(x, y) as HTMLElement | null;
  while (el && el !== document.documentElement) {
    const tag = el.tagName;
    if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "IFRAME") return false;
    const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (m && m.length >= 3) {
      const [r, g, b] = m.slice(0, 3).map(Number);
      const a = m.length > 3 ? Number(m[3]) : 1;
      if (a > 0.5) return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
    }
    el = el.parentElement;
  }
  return false;
}

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
    let light = false;

    /* The ring's colour for the ground under it: on dark, the pale ring
     * and the acid dot; on a light ground, both in the ink acid itself
     * carries type in (--accent-text), so they read as the same cursor
     * drawn for the other pole. */
    const paint = () => {
      const el = ringRef.current;
      const dot = dotRef.current;
      if (el) {
        el.style.borderColor = light
          ? grown
            ? "var(--accent-text)"
            : "color-mix(in srgb, var(--accent-text) 55%, transparent)"
          : grown
            ? "var(--accent)"
            : "color-mix(in srgb, var(--text) 35%, transparent)";
        el.style.color = light ? "var(--accent-text)" : "";
      }
      if (dot) {
        dot.style.background = light ? "var(--accent-text)" : "";
        dot.style.opacity = grown ? "0" : "1";
      }
    };

    /* Checked at most once a frame, and again on scroll — the page moves
     * under a still pointer, and the next section may be acid. */
    let probe = 0;
    const sample = () => {
      if (probe) return;
      probe = requestAnimationFrame(() => {
        probe = 0;
        const next = lightAt(target.x, target.y);
        if (next !== light) {
          light = next;
          paint();
        }
      });
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      sample();
      const dot = dotRef.current;
      if (dot) dot.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
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
      paint();
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
    window.addEventListener("scroll", sample, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(probe);
      window.removeEventListener("scroll", sample);
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
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[6px] w-[6px] rounded-full bg-acid will-change-transform"
        style={{
          transition:
            "opacity 0.25s var(--ease-out-expo), background-color 0.25s var(--ease-out-expo)",
        }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] flex h-[36px] w-[36px] items-center justify-center rounded-full border text-acid-type will-change-transform"
        style={{
          borderColor: "color-mix(in srgb, var(--text) 35%, transparent)",
          transition: "border-color 0.25s var(--ease-out-expo), color 0.25s var(--ease-out-expo)",
        }}
      >
        {label ? (
          <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em]">{label}</span>
        ) : null}
      </div>
    </div>
  );
}
