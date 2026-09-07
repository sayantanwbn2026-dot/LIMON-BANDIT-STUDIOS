import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { GridRules, BoundaryRule } from "@/components/lb/GridRules";
import { MarginNotes } from "@/components/lb/Section";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { Picture } from "@/components/lb/Picture";

const BANDIT = ["B", "A", "N", "D", "I", "T"];
/* outside-in stagger order for the entrance: B,T then A,I then N,D */
const staggerIndex = [0, 1, 2, 2, 1, 0];
/* phase 1 — the wall parts around the figure */
const LETTER_X = ["-4vw", "-2.5vw", "-1vw", "1vw", "2.5vw", "4vw"];

/**
 * Hero v4 — "The Scrubbed Poster".
 *
 * At rest it is a still poster: nothing moves but the backlight's 7s
 * breathing and the clock. Scrolling plays a four-second scene, driven
 * entirely by scroll position, that ends by handing the page to the
 * proof ticker.
 *
 * Layering matters here. The pointer parallax and the scrubbed scene both
 * want to transform Limon and the lockup, so they are given separate
 * elements — parallax on the outer wrapper, scene on the inner. Likewise
 * the backlight's infinite breathing sits on a child of the element the
 * scene scales, so the two never write the same property.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  /* wordRef must stay on the element that carries font-size — the fitting
   * routine measures its intrinsic width. The scene animates the wrapper. */
  const wordRef = useRef<HTMLSpanElement>(null);
  const wordWrapRef = useRef<HTMLSpanElement>(null);
  const glowWrapRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const medallionRef = useRef<HTMLSpanElement>(null);
  const limonWrapRef = useRef<HTMLDivElement>(null);
  const limonRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(220);

  /* ---- fitting routine: BANDIT spans the measure exactly ---- */
  useLayoutEffect(() => {
    const fit = () => {
      const word = wordRef.current;
      const box = measureRef.current;
      if (!word || !box) return;
      const target = box.clientWidth;
      if (!target) return;
      word.style.fontSize = "100px";
      const w = word.getBoundingClientRect().width;
      if (!w) return;
      const next = (target / w) * 100;
      word.style.fontSize = `${next}px`;
      setSize(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (measureRef.current) ro.observe(measureRef.current);
    window.addEventListener("resize", fit);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(fit).catch(() => {});
    }
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  /* ---- entrance (one-shot) + the breathing light ---- */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.set(glowWrapRef.current, { xPercent: -50, yPercent: -50, opacity: 0.84 });
      gsap.set(medallionRef.current, { xPercent: -50, yPercent: -50 });

      const tl = gsap.timeline({ delay: 0.1 });

      tl.from(
        "[data-col-rule]",
        {
          scaleY: 0,
          transformOrigin: "top",
          duration: 0.8,
          stagger: 0.05,
          ease: "power4.out",
          immediateRender: false,
        },
        0.1,
      );

      tl.from(
        "[data-hero-letter]",
        {
          yPercent: 105,
          duration: 0.9,
          ease: "expo.out",
          immediateRender: false,
          stagger: { each: 0.055, from: "edges" },
        },
        0.2,
      );

      tl.from(
        "[data-hero-measure]",
        { opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false },
        0.75,
      );
      tl.from(
        glowWrapRef.current,
        { opacity: 0, duration: 1.2, ease: "power2.out", immediateRender: false },
        0.45,
      );
      tl.from(
        limonWrapRef.current,
        { y: 50, opacity: 0, duration: 1.0, ease: "expo.out", immediateRender: false },
        0.6,
      );
      tl.from(
        "[data-hero-station]",
        { y: 16, opacity: 0, duration: 0.6, ease: "expo.out", immediateRender: false },
        0.95,
      );
      /* The [data-hero-micro] tween that used to sit here is gone with the
       * elements it drove — the scroll cue and the clock/coordinates line
       * were removed from the bottom rule. GSAP does not fail on a selector
       * that matches nothing, it warns, so this survived as console noise on
       * every load of the landing page rather than as a broken animation. */

      /* Atmosphere, not action — the one thing that moves at rest.
       * Lives on a child of the element the scene scales. */
      gsap.to(glowRef.current, {
        opacity: 0.82,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.8,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  /* ---- the scrubbed scene (desktop, motion-allowed only) ---- */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap) return;

    const mm = gsap.matchMedia(el);

    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const letterBoxes = gsap.utils.toArray<HTMLElement>("[data-hero-letter-box]", el);
      const willChange = [limonRef.current, ...letterBoxes].filter(Boolean) as HTMLElement[];

      const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.inOut" } });

      /* ---- phase 1 — the wall opens (0.0 → 1.1) ---- */
      tl.to(letterBoxes, { x: (i: number) => LETTER_X[i], duration: 1.1 }, 0);
      tl.to(wordWrapRef.current, { opacity: 0.35, duration: 1.1 }, 0);
      tl.to("[data-measure-side='left']", { x: "-6vw", opacity: 0, duration: 1.0 }, 0);
      tl.to("[data-measure-side='right']", { x: "6vw", opacity: 0, duration: 1.0 }, 0);
      tl.to("[data-measure-side='centre']", { opacity: 0, duration: 0.7 }, 0);

      /* ---- phase 2 — the figure settles (0.9 → 2.4) ----
       * He drops and tilts but never scales: the growth read as the image
       * inflating rather than approaching, so it is gone. The light still
       * collapses, which is what carries the depth now. */
      tl.to(limonRef.current, { y: "4vh", rotate: -1.6, duration: 1.5 }, 0.9);
      /* the light collapses onto him as he approaches camera */
      tl.to(glowWrapRef.current, { scale: 0.57, opacity: 1, duration: 1.5 }, 0.9);
      /* the scene's only acid event */
      tl.to(medallionRef.current, { scale: 2, duration: 0.2, ease: "power2.out" }, 2.0);
      tl.to(medallionRef.current, { scale: 1, duration: 0.2, ease: "power2.in" }, 2.2);

      /* ---- phase 3 — the poster concedes (2.2 → 3.2) ---- */
      tl.to("[data-hero-station]", { y: -24, opacity: 0, duration: 0.7, stagger: 0.08 }, 2.2);
      tl.to(wordWrapRef.current, { opacity: 0.12, y: "6vh", duration: 1.0 }, 2.2);
      /* he leaves without growing — the exit is blur and fade only */
      tl.to(limonRef.current, { filter: "blur(6px)", opacity: 0, duration: 0.8 }, 2.8);
      /* the rule drops with the rest of the poster so phase 4 can raise it */
      tl.to(ruleRef.current, { y: "8vh", duration: 0.8 }, 2.4);

      /* ---- phase 4 — the handover (3.2 → 4.0) ---- */
      tl.to(glowWrapRef.current, { opacity: 0, duration: 0.6 }, 3.2);
      tl.to(ruleRef.current, { y: 0, duration: 0.8, ease: "power4.out" }, 3.2);
      /* five crosshairs tick to acid in sequence, then revert as the pin
       * releases — opacity on a dedicated acid layer, so it scrubs and
       * reverses cleanly and stays theme-agnostic */
      /* Timed so the last crosshair reverts exactly on 4.0 — the revert
       * must finish as the pin releases, not after it:
       * 3.68 + (4 x 0.06 stagger) + 0.08 = 4.00 */
      tl.to(
        "[data-hero-rule] [data-crosshair-tick]",
        { opacity: 1, duration: 0.08, stagger: 0.06 },
        3.32,
      );
      tl.to(
        "[data-hero-rule] [data-crosshair-tick]",
        { opacity: 0, duration: 0.08, stagger: 0.06 },
        3.68,
      );

      const st = ScrollTrigger.create({
        animation: tl,
        trigger: el,
        start: "top top",
        /* Function form, in px: ScrollTrigger does not parse `vh` inside an
         * end string — "+=280vh" silently resolves to 280 *pixels*, which
         * runs the whole scene in a third of a screen. Functions are
         * re-evaluated on refresh, so this survives resize.
         *
         * 1.3 viewports, down from 2.8. At 2.8 the hero held the page for
         * ~2500px — four or five trackpad gestures before the site would
         * let you past the first screen, which reads as the site being
         * slow rather than as a scene being played. The scene itself did
         * not need the room: every phase is a fraction of the timeline, so
         * halving the distance plays the same choreography twice as fast
         * rather than truncating it.
         *
         * scrub is tighter for the same reason. Lenis already adds its own
         * lerp, and 0.75 on top of that meant the scene visibly trailed
         * the finger; 0.4 tracks closely enough to feel direct while still
         * smoothing the wheel's steps. */
        end: () => "+=" + window.innerHeight * 1.3,
        scrub: 0.4,
        pin: true,
        anticipatePin: 1,
        /* re-resolve the vw/vh distances in the tweens on resize */
        invalidateOnRefresh: true,
        onToggle: (self) => {
          gsap.set(willChange, { willChange: self.isActive ? "transform" : "auto" });
        },
      });

      /* Dev-only handle: the scene is scroll-driven, so this is the only way
       * to step it deterministically (and it is stripped from prod builds). */
      if (import.meta.env.DEV) Object.assign(window, { __heroScene: { st, tl } });

      return () => {
        st.kill();
        tl.kill();
        gsap.set(willChange, { willChange: "auto" });
        if (import.meta.env.DEV) Reflect.deleteProperty(window, "__heroScene");
      };
    });

    /* Pin geometry depends on final layout: fonts swap, the mascot decodes,
     * and the preloader releases scroll — refresh after each. */
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    window.addEventListener("lb:loaded", refresh);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(refresh).catch(() => {});
    }

    return () => {
      window.removeEventListener("load", refresh);
      window.removeEventListener("lb:loaded", refresh);
      mm.revert();
    };
  }, []);

  /* ---- two-layer pointer parallax (outer wrappers only) ---- */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const opts = { duration: 0.8, ease: "power3.out" };
    const lx = lockupRef.current ? gsap.quickTo(lockupRef.current, "x", opts) : null;
    const mx = limonWrapRef.current ? gsap.quickTo(limonWrapRef.current, "x", opts) : null;
    const my = limonWrapRef.current ? gsap.quickTo(limonWrapRef.current, "y", opts) : null;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      lx?.(nx * 5);
      mx?.(nx * -8);
      my?.(ny * -4);
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <section
      ref={root}
      data-hero
      className="relative w-full overflow-hidden bg-surface-deep"
      style={{ height: "100svh", minHeight: 680 }}
    >
      {/* soft lit centre */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 46%, var(--hero-vignette) 0%, var(--surface-deep) 70%)",
        }}
      />
      <GridRules tone="dark" />
      <MarginNotes index="01" name="Hero" />

      {/* backlight — sized element so the scene can scale it (transform only).
       * The phone values are not the desktop ones scaled down: 46vw is 179px
       * on a 390 screen, which lit a band narrower than the figure standing
       * in front of it and read as a spotlight on his chest. It tracks the
       * mascot's own box (~90vw) and sits lower to match his new centre. */}
      <span
        ref={glowWrapRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[52%] z-[4] h-[46svh] w-[92vw] md:top-[46%] md:h-[52vh] md:w-[46vw]"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <span
          ref={glowRef}
          className="block h-full w-full"
          style={{
            background: "radial-gradient(ellipse at center, var(--backlight), transparent 62%)",
          }}
        />
      </span>

      {/* acid medallion glow */}
      <span
        ref={medallionRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[52%] z-[4] h-[320px] w-[320px]"
        style={{
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(233,255,0,0.06), transparent 70%)",
        }}
      />

      {/* ---------------- the giant lockup ----------------
       * The phone anchor is higher than the desktop one for two reasons at
       * once: it spends the empty band under the navbar, and it lifts the
       * wordmark clear of the mascot's head. At the old 34vh his crown
       * landed mid-letter and swallowed the N whole; the type now rides
       * above him and he overlaps its baseline, which is the desktop
       * relationship rather than an accident of the phone's proportions. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[28vh] z-[3] md:top-[46vh]"
        style={{ transform: "translateY(-50%)" }}
      >
        <div ref={lockupRef} className="flex flex-col items-center">
          <div className="shell w-full">
            <div ref={measureRef} className="w-full">
              <h1 className="m-0 w-full">
                <span
                  data-hero-measure
                  aria-hidden="true"
                  className="flex w-full items-center justify-between"
                >
                  <span
                    data-measure-side="left"
                    className="block h-[8px] w-[8px] shrink-0 bg-acid"
                  />
                  <span className="flex flex-1 justify-between px-3 font-ui text-[14px] font-bold uppercase text-mute">
                    {"LIMON".split("").map((c, i) => (
                      <span key={i} data-measure-side={i < 2 ? "left" : i > 2 ? "right" : "centre"}>
                        {c}
                      </span>
                    ))}
                  </span>
                  <span
                    data-measure-side="right"
                    className="block h-[8px] w-[8px] shrink-0 bg-acid"
                  />
                </span>
                <span className="sr-only">Limon Bandit</span>

                <span
                  ref={wordWrapRef}
                  aria-hidden="true"
                  className="mt-3 block w-full"
                  style={{ lineHeight: 0.82 }}
                >
                  <span
                    ref={wordRef}
                    className="inline-block whitespace-nowrap font-display font-extrabold uppercase"
                    style={{
                      fontSize: size,
                      letterSpacing: "-0.045em",
                      marginRight: "-0.045em",
                      lineHeight: 0.82,
                    }}
                  >
                    {BANDIT.map((c, i) => (
                      <span
                        key={i}
                        data-hero-letter-box
                        className="inline-block overflow-hidden align-bottom"
                        style={{ lineHeight: 0.82 }}
                      >
                        <span
                          data-hero-letter
                          data-order={staggerIndex[i]}
                          className="hero-wall inline-block"
                        >
                          {c}
                        </span>
                      </span>
                    ))}
                  </span>
                </span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Limon ----------------
       * Phone sizing is svh throughout, never vh: `vh` is the *large*
       * viewport, so a figure sized in vh and anchored in svh grows and
       * slides apart from its own footing as the URL bar retracts.
       *
       * He is the poster on a phone, not a prop in it — 52svh, roughly
       * double what he was, which puts his head just over the top of the
       * wordmark exactly as it reads on desktop. Anchored in svh rather
       * than px so the composition holds from a 667pt SE to a 932pt Max.
       *
       * The box is bounded on BOTH axes and the artwork is object-contain
       * inside it. Height alone used to drive the size, with `max-w-none`
       * explicitly removing any cap — fine for the 4:5 portrait that was
       * here, and an overflow the moment the art changes shape: a square
       * mascot at 52svh is 439px wide on a 390px screen. Bounding the width
       * too means any replacement letterboxes inside the frame instead of
       * pushing the page sideways. */}
      <div
        ref={limonWrapRef}
        data-limon
        className="pointer-events-none absolute bottom-[18svh] left-1/2 z-[5] h-[52svh] w-[92vw] max-w-[560px] -translate-x-1/2 md:bottom-[8svh] md:h-[54vh] md:w-[54vw] lg:h-[62vh] lg:w-[48vw] lg:max-w-[720px] 2xl:h-[68vh]"
      >
        {/* scene layer — the tilt pivots on his stance, not his centre */}
        <div ref={limonRef} className="h-full w-full" style={{ transformOrigin: "50% 85%" }}>
          {/* The one priority image on the site — it is the LCP.
           * `sizes` has to track the box: at 52svh his frame is ~90vw on a
           * phone, and the old 45vw hint picked a source half the width it
           * now needs, which reads as a soft mascot at exactly the moment
           * he became the largest thing on the screen. */}
          <Picture
            src="limon-mascot"
            alt="Limon, the Limon Bandit mascot: a lemon in a bandana and leather jacket"
            sizes="(max-width: 767px) 90vw, (max-width: 1023px) 360px, 660px"
            priority
            className="block h-full w-full object-contain"
            style={{ filter: "saturate(0.92) drop-shadow(0 40px 80px var(--limon-shadow))" }}
          />
        </div>
      </div>

      {/* ---------------- corner stations ---------------- */}
      <div className="absolute inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom,0px))] z-[7]">
        <div className="shell">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-end">
            {/* bottom-right */}
            <div data-hero-station className="md:text-right">
              {/* Full-bleed on a phone. A 240px box pinned to one corner left
               * the bottom of the frame unresolved and the eye with nowhere
               * to land; run to the measure it becomes the base the poster
               * stands on, and the touch target doubles for free. */}
              <a
                href="/contact"
                className="group fill-acid inline-flex h-[56px] w-full items-center justify-between border border-line bg-transparent transition-colors duration-300 md:h-[54px] md:w-[240px]"
              >
                <span className="pl-6 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text">
                  Book the room
                </span>
                <ArrowRight
                  size={16}
                  className="mr-6 text-text transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- bottom rule ---------------- */}
      <div ref={ruleRef} data-hero-rule className="absolute inset-x-0 bottom-0 z-[8]">
        <BoundaryRule tone="dark" ticks className="bottom-0" />
      </div>
    </section>
  );
}
