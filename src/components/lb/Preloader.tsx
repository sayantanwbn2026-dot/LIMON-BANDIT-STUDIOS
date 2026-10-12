import { useEffect, useRef, useState } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/smooth";

/**
 * THE CONSOLE POWERS UP.
 *
 * A progress bar is a progress bar on any site. This one is a level meter
 * coming up on a desk, because that is what this building is: the bars read
 * as a VU array, the counter is the same tabular figure the rates and the
 * specs use, and the light that follows the pointer is the stage light the
 * rooms already have. Nothing here is a new visual language — it is the
 * site's own, two seconds before the site.
 *
 * IT ANSWERS THE POINTER, which is the whole reason it holds attention. The
 * bars nearest the cursor lift; move across and the array follows you. On a
 * phone, where there is no cursor, the light drifts on its own so the thing
 * is never inert — a touch device gets a moving light rather than a dead
 * one, and a tap moves it.
 *
 * TWO SCALES PER BAR, AND THAT IS THE ARCHITECTURE. The outer span carries
 * the load wave, animated by the timeline; the inner span carries pointer
 * proximity, written every frame. Nested, they multiply. Put both on one
 * element and the per-frame write and the tween fight over `scaleY` — the
 * tween wins at 60fps and the interaction silently does nothing, which is
 * the kind of bug that looks like "the pointer thing isn't working" and is
 * actually two authors on one property.
 *
 * SKIPPABLE. Click, tap or any key ends it immediately. A visitor on their
 * sixth visit does not owe the animation two seconds, and an intro you
 * cannot dismiss is the most irritating thing a site can open with.
 *
 * It still cannot strand the page: the scroll lock releases exactly once,
 * from whichever of completion, skip, the safety timer or unmount gets
 * there first. rAF is throttled in background tabs, so a timeline left to
 * finish on its own would hold a backgrounded page locked for ever.
 */

/** Enough to read as an array, few enough to write every frame cheaply. */
const BARS = 34;

/** The fade at the row's ends: 1 in the middle, 0.25 at the edges.
 *  Pure + - * /, so server and browser compute the identical double. */
function barOpacity(i: number): number {
  const x = (2 * (i + 0.5)) / BARS - 1; // -1 … 1 across the row
  return Number((0.25 + 0.75 * (1 - x * x)).toFixed(3));
}

/** How far the pointer's influence reaches, as a fraction of the width. */
const REACH = 0.22;

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

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      unlockScroll();
    };

    let safety = 0;
    let raf = 0;
    const finish = () => {
      window.clearTimeout(safety);
      cancelAnimationFrame(raf);
      setGone(true);
      document.documentElement.classList.remove("is-loading");
      release();
      window.dispatchEvent(new Event("lb:loaded"));
    };

    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    safety = window.setTimeout(finish, 6000);

    /* ---------------- the pointer, and the light ---------------- */

    const glow = el.querySelector<HTMLElement>("[data-pre-glow]");
    const inners = gsap.utils.toArray<HTMLElement>("[data-pre-inner-bar]", el);

    /* Where the light is, 0–1 across the width. Starts centre so the first
     * frame is composed rather than hard left. */
    const pointer = { x: 0.5, target: 0.5 };
    let hasPointer = false;

    /* Previous value per bar, so an unchanged bar is not rewritten. */
    const last = new Array<number>(inners.length).fill(1);

    const moveGlow = glow
      ? gsap.quickTo(glow, "xPercent", { duration: 0.5, ease: "power3.out" })
      : null;

    const onMove = (e: PointerEvent) => {
      hasPointer = true;
      pointer.target = e.clientX / window.innerWidth;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    /* No cursor? The light paces on its own. A touch visitor should still
     * see something alive, and a dead light on a phone reads as a bug. */
    const drift = gsap.to(pointer, {
      target: 0.78,
      duration: 1.1,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      startAt: { target: 0.22 },
    });

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (hasPointer) drift.pause();
      /* Chase rather than snap: the array trails the cursor slightly, which
       * is what makes it feel like a physical row of faders. */
      pointer.x += (pointer.target - pointer.x) * 0.18;
      moveGlow?.(pointer.x * 100 - 50);
      for (let i = 0; i < inners.length; i++) {
        const at = (i + 0.5) / inners.length;
        const d = Math.abs(at - pointer.x) / REACH;
        /* Smooth falloff — 1 under the light, 0 past the reach. */
        const near = d >= 1 ? 0 : (1 - d * d) ** 2;
        const v = 1 + near * 1.9;
        /* Most bars are outside the reach on any given frame and their value
         * has not moved. Writing `transform` anyway would invalidate style
         * for all 34 every frame, during hydration, which is exactly when
         * there is no budget for it. Two decimal places is well below what
         * the eye resolves on a 130px bar. */
        if (Math.abs(v - last[i]) < 0.01) continue;
        last[i] = v;
        inners[i].style.transform = `scaleY(${v.toFixed(3)})`;
      }
    };
    raf = requestAnimationFrame(tick);

    /* ---------------- the load ---------------- */

    /* `power2.inOut`, not an `out` ease. An out-ease spends ~90% of its
     * distance in the first instant, which on a COUNTER is not punchy, it
     * is broken: measured at 60fps the digits read 000, 091, 094, 096, 099,
     * 100 — the thing sits at nothing, jumps to ninety-something, then
     * crawls. A number has to be legible across its whole range to read as
     * counting at all, so this sweeps and the ARRAY carries the punch. */
    tl.to(counter, {
      v: 100,
      duration: 1.15,
      ease: "power2.inOut",
      onUpdate: () => setN(Math.round(counter.v)),
    });

    /* The array comes up as a wave rather than together: a desk is pushed
     * up fader by fader, and a row that rises in unison reads as a loading
     * bar wearing a costume. */
    tl.fromTo(
      "[data-pre-bar]",
      { scaleY: 0.04 },
      {
        scaleY: 1,
        duration: 0.9,
        ease: "expo.out",
        stagger: { each: 0.012, from: "start" },
      },
      0.05,
    );

    /* Hit the end: everything to full, acid flash, then out. */
    tl.to("[data-pre-bar]", { scaleY: 1, duration: 0.18, ease: "power2.in" }, 1.1);
    tl.to("[data-pre-flash]", { opacity: 0.9, duration: 0.09, ease: "power2.in" }, 1.18);
    tl.to("[data-pre-flash]", { opacity: 0, duration: 0.34, ease: "power2.out" }, 1.27);
    tl.to("[data-pre-face]", { opacity: 0, duration: 0.26, ease: "power2.out" }, 1.3);

    /* Up and out. The site is already painted underneath, so this is a
     * curtain, not a transition — expo so it leaves fast and lands soft. */
    tl.to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.72, ease: "expo.inOut" }, 1.38);

    /* ---------------- skipping ---------------- */

    const skip = () => {
      /* Run the exit rather than cutting to black-to-content: a hard jump
       * on click feels like a crash. 0.28s is under the threshold where a
       * skip stops feeling instant. */
      tl.kill();
      gsap.to(el, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.28,
        ease: "expo.in",
        onComplete: finish,
      });
      detachSkip();
    };
    const onKey = (e: KeyboardEvent) => {
      /* Not modifier-only presses — someone reaching for ⌘R should not be
       * told they skipped an animation. */
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      skip();
    };
    const detachSkip = () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", onKey);
    };
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", onKey);

    return () => {
      tl.kill();
      drift.kill();
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      window.removeEventListener("pointermove", onMove);
      detachSkip();
      release();
      document.documentElement.classList.remove("is-loading");
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="fixed inset-0 z-[10000] overflow-hidden bg-surface-deep"
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      {/* The stage light. Sits under the type, over the ground, and is the
          only thing on screen that tracks you. */}
      <span
        data-pre-glow
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] block h-[90vmax] w-[90vmax] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 13%, transparent) 0%, transparent 55%)",
          /* ITS OWN LAYER, AND THIS IS NOT A MICRO-OPTIMISATION. A
           * full-viewport radial gradient moved every frame repaints the
           * whole screen at 60fps, on the one thread that is also hydrating
           * the page. Measured before this: timers asked for 110ms were
           * being served at ~1000ms, a 9x starvation, and GSAP's own lag
           * smoothing stretched a 2.1s timeline past 3.5s. Promoted, the
           * move is a composite and the paint happens once. */
          willChange: "transform",
        }}
      />

      <div data-pre-face className="relative z-[2] flex h-full flex-col justify-between">
        {/* ---- the head ---- */}
        <div className="shell flex items-start justify-between pt-[clamp(24px,6vh,64px)]">
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-mute">
            Limon Bandit
            <span aria-hidden="true" className="px-2 text-acid-type">
              /
            </span>
            Kolkata
          </span>
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-mute">
            Est. 2021
          </span>
        </div>

        {/* ---- the desk ---- */}
        <div className="shell w-full pb-[clamp(24px,8vh,80px)]">
          <div className="flex items-end justify-between gap-6">
            <span className="font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-mute">
              Levels
            </span>
            {/* The counter, in the house's tabular figure. */}
            <span
              className="tnum font-display font-extrabold leading-[0.78] text-text"
              style={{ fontSize: "clamp(64px, 11vw, 168px)", letterSpacing: "-0.045em" }}
            >
              {String(n).padStart(3, "0")}
            </span>
          </div>

          {/* The array. `items-end` so every bar grows from the floor, and
              `origin-bottom` on both scales so neither pushes down. */}
          <div className="mt-5 flex h-[clamp(56px,13vh,132px)] w-full items-end gap-[2px]">
            {Array.from({ length: BARS }, (_, i) => (
              <span
                key={i}
                data-pre-bar
                className="block h-full flex-1 origin-bottom"
                style={{ transform: "scaleY(0.04)" }}
              >
                <span
                  data-pre-inner-bar
                  className="block h-full w-full origin-bottom bg-acid"
                  style={{
                    transform: "scaleY(1)",
                    /* Faded at the ends so the row reads as a meter rather
                       than a solid block with hard edges.
                       A PARABOLA, NOT `Math.sin`, and that is a correctness
                       point rather than taste. This number is written into
                       server-rendered markup and then recomputed in the
                       browser, and the two must agree exactly or React
                       reports a hydration mismatch it "won't patch up".
                       IEEE-754 guarantees + - * / are bit-identical on every
                       engine; it does NOT guarantee that of transcendental
                       functions, and the dev server (Bun/JavaScriptCore) and
                       the browser (V8) really do differ in the last digits of
                       sin. The first version of this used sin and logged the
                       mismatch on every cold load. Rounded to three places so
                       the markup is tidy too. */
                    opacity: barOpacity(i),
                  }}
                />
              </span>
            ))}
          </div>

          <span className="mt-5 block h-px w-full bg-line" />
        </div>
      </div>

      {/* The hit, on the beat the counter lands. */}
      <span
        data-pre-flash
        className="pointer-events-none absolute inset-0 z-[3] block bg-acid"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
