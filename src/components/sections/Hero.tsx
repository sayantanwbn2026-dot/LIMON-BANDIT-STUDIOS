import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { GridRules, BoundaryRule } from "@/components/lb/GridRules";
import { MarginNotes } from "@/components/lb/Section";
import { Decode } from "@/components/lb/Decode";
import { LocalTime } from "@/components/lb/LocalTime";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import mascot from "@/assets/limon-mascot.png";

const BANDIT = ["B", "A", "N", "D", "I", "T"];
/* outside-in stagger order: B,T then A,I then N,D */
const staggerIndex = [0, 1, 2, 2, 1, 0];

/**
 * Hero v3 — "The Poster".
 * One wall-sized wordmark, one backlit lemon, four small corner stations.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const limonRef = useRef<HTMLDivElement>(null);
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

  /* ---- entrance + scroll exit ---- */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      tl.from("[data-col-rule]", {
        scaleY: 0,
        transformOrigin: "top",
        duration: 0.8,
        stagger: 0.05,
        ease: "power4.out",
        immediateRender: false,
      }, 0.1);

      tl.from("[data-hero-letter]", {
        yPercent: 105,
        duration: 0.9,
        ease: "expo.out",
        immediateRender: false,
        stagger: { each: 0.055, from: "edges" },
      }, 0.2);

      tl.from("[data-hero-measure]", { opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, 0.75);
      tl.from(glowRef.current, { opacity: 0, duration: 1.2, ease: "power2.out", immediateRender: false }, 0.45);
      tl.from(limonRef.current, { y: 50, opacity: 0, duration: 1.0, ease: "expo.out", immediateRender: false }, 0.6);
      tl.from("[data-hero-station]", { y: 16, opacity: 0, duration: 0.6, ease: "expo.out", immediateRender: false }, 0.95);
      tl.from("[data-hero-micro]", { opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, 1.2);

      /* backlight breathing */
      gsap.to(glowRef.current, {
        opacity: 0.82,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.8,
      });

      /* idle float */
      gsap.to(limonRef.current, { y: 5, duration: 5.5, repeat: -1, yoyo: true, ease: "sine.inOut" });

      /* scroll exit */
      const st = { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 } as const;
      gsap.to(lockupRef.current, { y: 60, opacity: 0.25, ease: "none", scrollTrigger: st });
      gsap.to(limonRef.current, { y: -70, scale: 0.96, ease: "none", scrollTrigger: st });
      gsap.to(glowRef.current, {
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "50% top", scrub: 0.6 },
      });
      gsap.to("[data-hero-station], [data-hero-micro]", {
        y: -20,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "40% top", scrub: 0.6 },
      });
    }, el);
    return () => ctx.revert();
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
      className="relative w-full overflow-hidden bg-ink-deep"
      style={{ height: "100svh", minHeight: 680 }}
    >
      {/* soft lit centre */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "radial-gradient(circle at 50% 46%, #0D0D0D 0%, var(--ink-deep) 70%)" }}
      />
      <GridRules tone="dark" />
      <MarginNotes index="01" name="Hero" />

      {/* backlight */}
      <span
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          background:
            "radial-gradient(ellipse 46vw 52vh at 50% 46%, rgba(244,244,240,0.16), transparent 62%)",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[52%] z-[4] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(circle, rgba(233,255,0,0.06), transparent 70%)" }}
      />

      {/* ---------------- the giant lockup ---------------- */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[34vh] z-[3] md:top-[46vh]"
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
                <span className="block h-[8px] w-[8px] shrink-0 bg-acid" />
                <span className="flex flex-1 justify-between px-3 font-ui text-[14px] font-bold uppercase text-mute-dark">
                  {"LIMON".split("").map((c, i) => (
                    <span key={i}>{c}</span>
                  ))}
                </span>
                <span className="block h-[8px] w-[8px] shrink-0 bg-acid" />
              </span>
              <span className="sr-only">Limon Bandit</span>

              <span
                aria-hidden="true"
                className="mt-3 block w-full overflow-hidden"
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
                    <span key={i} className="inline-block overflow-hidden align-bottom" style={{ lineHeight: 0.82 }}>
                      <span data-hero-letter data-order={staggerIndex[i]} className="hero-wall inline-block">
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

      {/* ---------------- Limon ---------------- */}
      <div
        ref={limonRef}
        className="pointer-events-none absolute bottom-[35svh] left-1/2 z-[5] h-[26vh] -translate-x-1/2 md:bottom-[8svh] md:h-[54vh] lg:h-[62vh] 2xl:h-[68vh]"
      >
        <img
          src={mascot}
          alt="Limon, the Limon Bandit mascot: a lemon in a bandana and leather jacket"
          width={1024}
          height={1280}
          fetchPriority="high"
          className="block h-full w-auto max-w-none object-contain"
          style={{ filter: "saturate(0.92) drop-shadow(0 40px 80px rgba(0,0,0,0.55))" }}
        />
      </div>

      {/* ---------------- corner stations ---------------- */}
      <div className="absolute inset-x-0 bottom-[52px] z-[7]">
        <div className="shell">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            {/* bottom-left */}
            <div data-hero-station className="max-w-[280px]">
              <div className="flex items-center gap-3">
                <span className="h-[8px] w-[8px] shrink-0 bg-acid" />
                <Decode
                  onLoad
                  delay={1.0}
                  text="Kolkata Music House — Est. 2021"
                  className="font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-mute-dark"
                />
              </div>
              <p className="mt-3 font-ui text-[13px] leading-[1.55] text-mute-dark">
                <strong className="font-semibold text-text-dark">
                  Four rooms, one label, and a merch line
                </strong>{" "}
                — run out of one building in Kolkata. Book a night, sign a record, or print a run.
                No middlemen.
              </p>
            </div>

            {/* bottom-centre */}
            <div data-hero-station className="hidden lg:block">
              <span className="font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-mute-dark">
                <span className="mr-2 inline-block h-[7px] w-[7px] bg-acid align-middle" />
                limonbandit.com
              </span>
            </div>

            {/* bottom-right */}
            <div data-hero-station className="md:text-right">
              <p className="font-ui text-[13px] font-medium leading-[1.5] text-mute-dark">
                music studio &amp;
                <br />
                creative house
              </p>
              <a
                href="/contact"
                className="group mt-4 inline-flex h-[54px] w-full max-w-[240px] items-center justify-between border border-ink-line bg-transparent transition-colors duration-300 hover:border-[#2A2A2A] hover:bg-ink-raised md:w-[240px]"
              >
                <span className="pl-6 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text-dark">
                  Book the room
                </span>
                <ArrowRight
                  size={16}
                  className="mr-6 text-text-dark transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- micro-lines on the bottom rule ---------------- */}
      <div className="absolute inset-x-0 bottom-0 z-[8]">
        <div className="shell flex items-center justify-between pb-[14px]">
          <span
            data-hero-micro
            className="font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-mute-dark"
            style={{ opacity: 0.7 }}
          >
            Scroll ↓ — the house opens below
          </span>
          <span
            data-hero-micro
            className="hidden items-center gap-4 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] tnum text-mute-dark sm:flex"
            style={{ opacity: 0.7 }}
          >
            <LocalTime className="!text-[10px] !tracking-[0.16em]" />
            <span className="hidden lg:inline">22.5726° N / 88.3639° E</span>
          </span>
        </div>
        <BoundaryRule tone="dark" ticks className="bottom-0" />
      </div>
    </section>
  );
}
