import { useEffect, useRef, useState } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/smooth";

export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();

    if (!gsap || prefersReducedMotion()) {
      setGone(true);
      document.documentElement.classList.remove("is-loading");
      return;
    }

    document.documentElement.classList.add("is-loading");
    lockScroll();

    /* Release the scroll lock exactly once — completion, the safety timer
     * and unmount can all reach for it. */
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      unlockScroll();
    };

    let safety = 0;
    const finish = () => {
      window.clearTimeout(safety);
      setGone(true);
      document.documentElement.classList.remove("is-loading");
      release();
      window.dispatchEvent(new Event("lb:loaded"));
    };

    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: finish });

    /* requestAnimationFrame is throttled in background tabs, which stalls
     * the timeline and would strand the page scroll-locked behind it. */
    safety = window.setTimeout(finish, 6000);

    tl.to(counter, {
      v: 100,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate: () => setN(Math.round(counter.v)),
    });
    tl.to("[data-pre-bar]", { scaleX: 1, duration: 1.4, ease: "power2.inOut" }, 0);
    tl.to("[data-pre-inner]", { opacity: 0, duration: 0.3, ease: "power2.out" }, 1.45);
    tl.to(
      el,
      {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.8,
        ease: "expo.inOut",
      },
      1.55,
    );

    return () => {
      tl.kill();
      window.clearTimeout(safety);
      release();
      document.documentElement.classList.remove("is-loading");
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="fixed inset-0 z-[10000] flex items-end bg-surface-deep"
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      <div data-pre-inner className="shell w-full pb-[10vh]">
        <div className="flex items-end justify-between">
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-mute">
            Limon Bandit — Kolkata
          </span>
          <span
            className="font-display font-extrabold leading-[0.8] tnum text-text"
            style={{ fontSize: "clamp(72px, 12vw, 180px)", letterSpacing: "-0.04em" }}
          >
            {String(n).padStart(3, "0")}
          </span>
        </div>
        <span className="mt-6 block h-px w-full bg-line">
          <span
            data-pre-bar
            className="block h-px w-full origin-left bg-acid"
            style={{ transform: "scaleX(0)" }}
          />
        </span>
      </div>
    </div>
  );
}
