import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { GridRules, BoundaryRule } from "@/components/lb/GridRules";
import { MarginNotes } from "@/components/lb/Section";
import { afterPreloader, ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { HeroMascot } from "@/components/lb/HeroMascot";
import { useHomeHero, useWords, useChapter } from "@/cms/hooks";

/* outside-in stagger order for the entrance: B,T then A,I then N,D */
const fromEdge = (i: number, n: number) => Math.min(i, n - 1 - i);

/**
 * Hero v4 — "The Scrubbed Poster".
 *
 * At rest it is a still poster: nothing moves but the backlight's 7s
 * breathing. Limon moves exactly as every chapter hero's mascot does (see
 * HeroFrame): he steps up once the preloader lifts, leaves the stage a
 * little faster than the page as you scroll while the wordmark behind
 * him lags and dims, and leans against the pointer on a desktop.
 *
 * Layering matters here. The arrival, the scroll and the lean all want to
 * transform Limon, so they are given separate elements — arrival and
 * scroll on the outer wrapper, lean on the inner layer. Likewise the
 * backlight's infinite breathing sits on a child of the element the
 * entrance fades, so the two never write the same property.
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
  const stationsRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(220);
  /* The poster reads the home row of Page titles & SEO — "LIMON" spread
   * across the measure, "BANDIT" fitted under it — the same fields every
   * chapter hero's lockup reads, so renaming the house is a CMS edit. */
  const chapter = useChapter("home");
  const spread = chapter.poster.spread.toUpperCase().split("");
  const letters = chapter.poster.word.toUpperCase().split("");

  /* ---- fitting routine: the word spans the measure exactly ---- */
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
  }, [chapter.poster.word]);

  /* ---- entrance (one-shot) + the breathing light ----
   * A layout effect, so the start states land before the first paint: on a
   * client-side arrival there is no preloader over the page, and an effect
   * that ran after paint showed the poster for a frame, then hid it. */
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    let stop = () => {};
    const ctx = gsap.context(() => {
      gsap.set(glowWrapRef.current, { xPercent: -50, yPercent: -50, opacity: 0.84 });
      gsap.set(medallionRef.current, { xPercent: -50, yPercent: -50 });

      /* Built paused and played once the preloader lifts — the chapter
       * heroes' rule (see afterPreloader). It used to start on mount, under
       * a preloader that stays up for several seconds, so the whole
       * entrance — the letters, and Limon stepping up — had finished
       * before anyone could see it. The start states apply as the timeline
       * is built, while the preloader still covers the page, so nothing is
       * shown and then taken away. */
      const tl = gsap.timeline({ paused: true });
      stop = afterPreloader(() => tl.play());

      tl.from(
        "[data-col-rule]",
        {
          scaleY: 0,
          transformOrigin: "top",
          duration: 0.8,
          stagger: 0.05,
          ease: "power4.out",
        },
        0.1,
      );

      tl.from(
        "[data-hero-letter]",
        {
          yPercent: 105,
          duration: 0.9,
          ease: "expo.out",
          stagger: { each: 0.055, from: "edges" },
        },
        0.2,
      );

      tl.from("[data-hero-measure]", { opacity: 0, duration: 0.5, ease: "power2.out" }, 0.75);
      tl.from(glowWrapRef.current, { opacity: 0, duration: 1.2, ease: "power2.out" }, 0.45);
      /* Limon and the button on the chapter heroes' beats exactly: he rises
       * 50px over a second from 0.25, the button follows at 0.6. */
      tl.from(limonWrapRef.current, { y: 50, opacity: 0, duration: 1.0, ease: "expo.out" }, 0.25);
      tl.from("[data-hero-station]", { y: 16, opacity: 0, duration: 0.6, ease: "expo.out" }, 0.6);
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
    return () => {
      stop();
      ctx.revert();
    };
  }, []);

  /* ---- depth: the stage comes apart as you leave it ----
   * The chapter heroes' scroll, on every screen size (see HeroFrame). He is
   * in front of the wordmark, so he leaves faster than the page does; the
   * wordmark is behind him, so it lags and dims; the button fades as the
   * poster goes. Scrubbed, nothing held.
   *
   * This replaces the pinned scene that used to run here on desktop — the
   * wall of letters parting, Limon dropping and tilting, then blurring out
   * while the page was held still for a screen. Every other chapter's
   * mascot does the two-speed exit above, and the house's own hero now
   * does the same thing rather than a different one. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap) return;

    const mm = gsap.matchMedia(el);
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.4 },
      });
      if (limonWrapRef.current) tl.to(limonWrapRef.current, { yPercent: -14 }, 0);
      if (lockupRef.current) {
        tl.to(lockupRef.current, { y: () => el.offsetHeight * 0.22, opacity: 0.2 }, 0);
      }
      if (stationsRef.current) tl.to(stationsRef.current, { opacity: 0, duration: 0.25 }, 0);
    });

    /* Trigger positions depend on final layout: fonts swap, the mascot
     * decodes, and the preloader releases scroll — refresh after each. */
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

  /* ---- two-layer pointer parallax ---- */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const opts = { duration: 0.8, ease: "power3.out" };
    const lx = lockupRef.current ? gsap.quickTo(lockupRef.current, "x", opts) : null;
    /* On the inner layer, as on the chapter heroes, so the lean never
     * fights the arrival or the scroll for the same property. */
    const mx = limonRef.current ? gsap.quickTo(limonRef.current, "x", opts) : null;
    const my = limonRef.current ? gsap.quickTo(limonRef.current, "y", opts) : null;

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
                    className="neon block h-[8px] w-[8px] shrink-0 bg-acid"
                  />
                  <span className="flex flex-1 justify-between px-3 font-ui text-[14px] font-bold uppercase text-mute">
                    {spread.map((c, i) => (
                      <span
                        key={i}
                        data-measure-side={
                          i < (spread.length - 1) / 2
                            ? "left"
                            : i > (spread.length - 1) / 2
                              ? "right"
                              : "centre"
                        }
                      >
                        {c}
                      </span>
                    ))}
                  </span>
                  <span
                    data-measure-side="right"
                    className="neon block h-[8px] w-[8px] shrink-0 bg-acid"
                  />
                </span>
                <span className="sr-only">{chapter.heading}</span>

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
                    {letters.map((c, i) => (
                      <span
                        key={i}
                        data-hero-letter-box
                        className="inline-block overflow-hidden align-bottom"
                        style={{ lineHeight: 0.82 }}
                      >
                        <span
                          data-hero-letter
                          data-order={fromEdge(i, letters.length)}
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
          <HeroMascot chapter="home" />
        </div>
      </div>

      {/* ---------------- corner stations ---------------- */}
      <div
        ref={stationsRef}
        className="absolute inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom,0px))] z-[7]"
      >
        <div className="shell">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-end">
            {/* bottom-right */}
            <div data-hero-station className="md:text-right">
              {/* Full-bleed on a phone. A 240px box pinned to one corner left
               * the bottom of the frame unresolved and the eye with nowhere
               * to land; run to the measure it becomes the base the poster
               * stands on, and the touch target doubles for free. */}
              <HeroCta />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- bottom rule ---------------- */}
      <div data-hero-rule className="absolute inset-x-0 bottom-0 z-[8]">
        <BoundaryRule tone="dark" ticks className="bottom-0" />
      </div>
    </section>
  );
}

/**
 * The hero's one button.
 *
 * Two things were wrong with the markup this replaces, and only one of them
 * was about the CMS:
 *
 *   The label and the destination were hardcoded. This is the loudest call to
 *   action on the site and it was the single part of the front page nobody
 *   could change without a deploy. It reads `page.home.hero` now.
 *
 *   It was a plain <a href="/contact"> to an in-app route, which tears the
 *   app down and boots it again — the slowest possible way to follow the
 *   fastest link on the page. Internal destinations go through the router.
 *
 * Its own component rather than inline JSX because the hero is a long
 * GSAP-driven file and a hook belongs at the top of the thing that needs it,
 * not threaded through 200 lines of timeline setup.
 */
function HeroCta() {
  const hero = useHomeHero();
  const w = useWords("home");
  const to = hero.to || "/contact";
  const label = hero.cta || w.heroCtaFallback;
  const external = /^https?:\/\//i.test(to);

  const shell =
    "group fill-acid inline-flex h-[56px] w-full items-center justify-between border border-line bg-transparent transition-colors duration-300 md:h-[54px] md:w-[240px]";

  const body = (
    <>
      <span className="pl-6 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text">
        {label}
      </span>
      <ArrowRight size={16} className="lb-arrow mr-6 text-text" />
    </>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={shell}>
        {body}
      </a>
    );
  }

  return (
    <Link to={to} className={shell}>
      {body}
    </Link>
  );
}
