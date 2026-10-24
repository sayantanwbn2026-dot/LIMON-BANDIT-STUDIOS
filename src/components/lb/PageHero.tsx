import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { BoundaryRule, GridRules, type Tone } from "./GridRules";
import { HeroMascot } from "./HeroMascot";
import { MarginNotes } from "./Section";
import { type ChapterKey } from "@/data/routes";
import { useChapter } from "@/cms/hooks";
import { afterPreloader, ensureGsap, mayPlayEntrance, prefersReducedMotion } from "@/lib/motion";
import { getLenis } from "@/lib/smooth";

/**
 * The chrome every page hero shares — drafting grid, margin notes and the
 * closing boundary rule — with the middle left open.
 *
 * NO BREADCRUMB. There used to be a "LMN·BNDT / <chapter>" trail under the
 * nav on every chapter page. The nav's own logotype already goes to "/" and
 * the nav's own menu already names every chapter, so the trail repeated
 * information that was one glance away twice over, and it put a line of
 * filing-system chrome under a hero that is trying to read as one confident
 * opening rather than a breadcrumb trail.
 *
 * THE POSTER STAGE
 *
 * Pass `lockup` and the hero opens the way the landing page opens: one
 * viewport, exactly — `height: 100svh, minHeight: 680`, the same two values
 * the home hero's own <section> carries — holding the chapter's wordmark
 * and the mascot standing in front of it, and nothing else. The chapter's
 * own content starts underneath, below the fold.
 *
 * That split is the whole reason this takes a slot rather than reading the
 * first child. The mascot is 52–68vh of the band; if the ledger, the split
 * figures or the contact slip shared the band with him they would be behind
 * him, and they are the things people came to the page for. Home has the
 * same arrangement for the same reason — its hero holds a wordmark, a
 * mascot and one button, and every fact on the page is below it.
 *
 * Without `lockup` the frame stays a plain band and only takes a
 * `lg:min-h-[100svh]` floor, which is what the Journal masthead wants: it
 * is set as a newspaper front page and has no mascot.
 *
 * Two contracts the rest of the app depends on and which must survive any
 * hero design: the element is a <header> (RouteTransition rises `main >
 * header` on arrival) and the heading inside carries `data-page-h1` with
 * tabIndex -1 (RouteTransition moves focus there). Each hero supplies its own
 * <h1>; this frame supplies everything around it.
 */

export function HeroFrame({
  chapter: key,
  tone = "dark",
  surface,
  className,
  bodyClassName,
  lockup,
  mascot = true,
  children,
}: {
  chapter: ChapterKey;
  tone?: Tone;
  /** override the background class; defaults to the page's deep surface */
  surface?: string;
  /** applied to the <header> itself — inverted heroes use it to clear the navbar */
  className?: string;
  /** override the inner padding when a hero needs a different rhythm */
  bodyClassName?: string;
  /**
   * The chapter's wordmark. Given one, the hero opens with a full-viewport
   * poster stage — wordmark plus mascot — and `children` begins below it.
   */
  lockup?: ReactNode;
  /**
   * Stand the mascot on the poster stage. Only meaningful alongside
   * `lockup`, since the stage is what he is positioned against.
   */
  mascot?: boolean;
  children: ReactNode;
}) {
  const c = useChapter(key);
  const stageRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const limonRef = useRef<HTMLDivElement>(null);
  const leanRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const footInRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const staged = Boolean(lockup);

  /* ---- arrival: he steps up onto the stage as you come to the page ----
   * On a client-side navigation only. The hidden state is set before
   * paint, so he is never shown for a frame and then snatched away; on a
   * hard load the server has already painted him, and hiding him to play
   * him back in would be a flicker (see mayPlayEntrance). The same rise,
   * ease and timing as the home hero's, so every chapter arrives the way
   * the house does. */
  useLayoutEffect(() => {
    if (!staged) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion() || !mayPlayEntrance()) return;
    const limon = limonRef.current;
    const foot = footInRef.current;
    const targets = [limon, foot].filter(Boolean);
    if (targets.length === 0) return;
    gsap.set(targets, { opacity: 0 });
    const stop = afterPreloader(() => {
      const tl = gsap.timeline();
      if (limon) {
        tl.fromTo(
          limon,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.0, ease: "expo.out" },
          0.25,
        );
      }
      if (foot) {
        tl.fromTo(
          foot,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" },
          0.6,
        );
      }
    });
    return () => {
      stop();
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "opacity,y" });
    };
  }, [staged]);

  /* ---- depth: the stage comes apart as you leave it ----
   * Scrubbed to the scroll, on every screen size. He is in front of the
   * wordmark, so he leaves faster than the page does; the wordmark is
   * behind him, so it lags and dims. That is the whole effect — two layers
   * at two speeds — and it is what makes the poster read as a stage with
   * depth rather than a flat picture of one. */
  useEffect(() => {
    if (!staged) return;
    const stage = stageRef.current;
    const gsap = ensureGsap();
    if (!stage || !gsap) return;
    const mm = gsap.matchMedia(stage);
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: stage, start: "top top", end: "bottom top", scrub: 0.4 },
      });
      if (limonRef.current) tl.to(limonRef.current, { yPercent: -14 }, 0);
      if (lockRef.current) {
        tl.to(lockRef.current, { y: () => stage.offsetHeight * 0.22, opacity: 0.2 }, 0);
      }
      if (footRef.current) tl.to(footRef.current, { opacity: 0, duration: 0.25 }, 0);
    });
    return () => mm.revert();
  }, [staged]);

  /* ---- lean: two layers against the pointer, desktop only ----
   * Home's numbers exactly. On the inner layer, so it never fights the
   * arrival or the scroll for the same property. */
  useEffect(() => {
    if (!staged) return;
    const stage = stageRef.current;
    const gsap = ensureGsap();
    if (!stage || !gsap || prefersReducedMotion()) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const opts = { duration: 0.8, ease: "power3.out" };
    const lx = lockRef.current ? gsap.quickTo(lockRef.current, "x", opts) : null;
    const mx = leanRef.current ? gsap.quickTo(leanRef.current, "x", opts) : null;
    const my = leanRef.current ? gsap.quickTo(leanRef.current, "y", opts) : null;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      lx?.(nx * 5);
      mx?.(nx * -8);
      my?.(ny * -4);
    };
    stage.addEventListener("pointermove", onMove, { passive: true });
    return () => stage.removeEventListener("pointermove", onMove);
  }, [staged]);

  const toBody = () => {
    const el = bodyRef.current;
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { duration: 1.1 });
    else el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <header
      /* Marks this page as opening with a hero — the navbar floats over one
       * transparently and only goes solid further down. A page without the
       * mark starts its content directly under the bar, so the bar has to
       * be solid from the first pixel (see Nav). */
      data-hero
      className={`relative w-full overflow-hidden ${surface ?? "bg-surface-deep"} ${
        lockup ? "" : "lg:min-h-[100svh]"
      } ${className ?? ""}`}
    >
      <GridRules tone={tone} />
      <MarginNotes index={c.index} name={c.name} tone={tone} />

      {lockup ? (
        /* One viewport, the same two values home's own hero section uses.
         * `height`, not `min-height`: the stage is a fixed stage, and
         * anything that wants to grow belongs in the band below it. */
        <div ref={stageRef} className="relative" style={{ height: "100svh", minHeight: 680 }}>
          <div ref={lockRef} className="shell relative z-[2] pt-[120px]">
            {lockup}
          </div>

          {mascot ? (
            /* Verbatim from the home hero — the same breakpoint ladder, the
             * same anchor, the same z-index above the wordmark, the same
             * saturation and the same 40/80 drop shadow. Copied rather than
             * re-derived on purpose: "like the home page" is a thing that
             * has to stay true after somebody edits one of the two, and the
             * only way to see that is for the two to read identically.
             *
             * `priority` for the same reason home sets it: at 52–68vh he is
             * the largest paint on the page, so he is the LCP, and `sizes`
             * has to track the box or the browser picks a source half the
             * width he needs and he arrives soft. */
            <div
              ref={limonRef}
              className="pointer-events-none absolute bottom-[18svh] left-1/2 z-[5] h-[52svh] w-[92vw] max-w-[560px] -translate-x-1/2 md:bottom-[8svh] md:h-[54vh] md:w-[54vw] lg:h-[62vh] lg:w-[48vw] lg:max-w-[720px] 2xl:h-[68vh]"
            >
              <div ref={leanRef} className="h-full w-full">
                <HeroMascot chapter={key} />
              </div>
            </div>
          ) : null}

          {/* The foot of the stage, phones only. Under 768px he stands
           * 18svh clear of the bottom so his feet are not under the URL
           * bar, and that band was left empty — the one screen on the page
           * with nothing to tell a thumb what happens next. Home puts its
           * button there; a chapter puts the way in: the same full-measure
           * hairline row, the chapter's name, and the scroll cue, which
           * takes you to the page underneath. The acid square is the
           * poster's own end mark rather than the chapter number, which the
           * menu counts differently. From 768px his feet are at 8svh and
           * the band is too shallow to need anything. */}
          <div
            ref={footRef}
            className="absolute inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom,0px))] z-[7] md:hidden"
          >
            <div ref={footInRef} className="shell">
              <button
                type="button"
                onClick={toBody}
                className="group fill-acid flex h-[56px] w-full items-center justify-between border border-line bg-transparent px-6 transition-colors duration-300"
              >
                <span className="flex items-baseline gap-3 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text">
                  <span aria-hidden="true" className="block h-[8px] w-[8px] self-center bg-acid" />
                  {c.name}
                </span>
                <span className="flex items-center gap-3 font-ui text-[11px] font-bold uppercase tracking-[0.16em] text-mute">
                  Scroll
                  <span
                    aria-hidden="true"
                    className="relative block h-5 w-px overflow-hidden bg-line"
                  >
                    <span className="scroll-cue absolute inset-0 block bg-acid" />
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        ref={bodyRef}
        className={`shell relative z-[2] ${
          bodyClassName ?? (lockup ? "pb-[96px] pt-[96px]" : "pb-[96px] pt-[120px]")
        }`}
      >
        {children}
      </div>

      <BoundaryRule tone={tone} ticks className="bottom-0" />
    </header>
  );
}

/**
 * Shared <h1> treatment. Size varies per hero; the contract does not.
 *
 * `ref` is taken as a plain prop (React 19) and forwarded, because the heroes
 * pass this as WordReveal's `as` target and WordReveal attaches a ref to
 * drive the split-word timeline. Swallowing it would silently disable the
 * reveal rather than break anything visibly.
 */
export function HeroHeading({
  children,
  className,
  ref,
}: {
  children?: ReactNode;
  className?: string;
  ref?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <h1 ref={ref} data-page-h1 tabIndex={-1} className={`outline-none ${className ?? ""}`}>
      {children}
    </h1>
  );
}
