import { useEffect, useRef, useState } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/smooth";
import { useSite } from "@/cms/hooks";

/**
 * The preloader: a room coming up.
 *
 * The old one was a number and a rule that filled. This is the same idea
 * said in the house's own language — you are waiting for a recording
 * studio to open, so the wait is a channel strip powering on: the
 * drafting grid strikes in, a room mic comes up as a spectrum, two
 * segmented meters ride it with peak-hold dots that fall back the way
 * real ones do, and a tape counter runs to 100. Then the signal cuts,
 * everything collapses into a single line, and that line is exactly
 * where the hero's own bottom rule sits — so the last frame of the
 * loader is the first frame of the page rather than a curtain over it.
 *
 * **Why canvas and not DOM.** Sixty-four spectrum bars, two meter
 * ladders and their peak dots is ~150 elements repainting every frame;
 * as DOM that is layout thrash, and as SVG it is 150 nodes of attribute
 * churn. On a canvas it is one draw call per frame and it stays at
 * frame rate on a phone. It is also the only one of the three that is
 * genuinely resolution-independent: the backing store is sized in
 * device pixels, so on a 4K or Retina display the bars and hairlines
 * are drawn at the panel's real resolution rather than upscaled from
 * CSS pixels.
 *
 * `dpr` is capped at 2, matching Waveform — the site's other canvas.
 * The cap matters far more here than it does there: that one is a
 * 311x72 strip, this is the whole viewport, so on a phone reporting
 * dpr 3 an uncapped backing store would be ~25 million pixels redrawn
 * sixty times a second. Two is already the panel's real resolution on
 * every 4K display at the scaling people actually use, and the third
 * step buys nothing an eye can resolve at arm's length.
 *
 * **It cannot strand the page.** Three separate things can end it —
 * the timeline completing, a safety timer, and unmount — so the scroll
 * lock is released exactly once behind a flag, and the timer exists
 * because requestAnimationFrame is throttled in a background tab, which
 * would otherwise stall the timeline with the page still locked.
 *
 * Reduced motion skips the whole thing rather than showing a static
 * version of it: this is decoration in front of content, and the
 * courteous response to "I do not want animation" is to not be there.
 */

/** How many bars the spectrum is drawn with. */
const BARS = 64;
/** Segments in each meter ladder. */
const SEGMENTS = 28;

type Palette = {
  surface: string;
  line: string;
  mute: string;
  text: string;
  acid: string;
  /** true when the current pole's ground is bone rather than near-black */
  onBone: boolean;
};

/** Relative luminance of a `#rgb`/`#rrggbb` colour, 0–1. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const v = (i: number) => parseInt(full.slice(i, i + 2), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(v(0)) + 0.7152 * lin(v(2)) + 0.0722 * lin(v(4));
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const get = (n: string, fallback: string) => cs.getPropertyValue(n).trim() || fallback;
  /* The loader sits on the deep surface in whichever pole is current, so
   * it inverts with the theme like everything else. Acid does not — and
   * that is the whole reason `onBone` has to exist. #E9FF00 is a very
   * light yellow: on near-black it carries at 14% alpha, and on bone the
   * same alpha is invisible, because the bars are barely lighter than
   * what they are drawn on. So the alphas are read off the ground rather
   * than tuned for the dark pole and left to fail in the other one. */
  const surface = get("--surface-deep", "#050505");
  return {
    surface,
    line: get("--line", "#2e2e2e"),
    mute: get("--mute", "#b4b4b0"),
    text: get("--text", "#f4f4f0"),
    acid: get("--accent", "#e9ff00"),
    onBone: luminance(surface) > 0.35,
  };
}

/**
 * A bar's height at time t.
 *
 * Three sines at incommensurable rates, so the band never visibly loops
 * inside the two seconds it is on screen, plus a fixed envelope that
 * rolls off at both ends — a real room has less energy at the extremes
 * of the band, and a flat-topped spectrum reads as a graphic rather
 * than as something being heard.
 */
function barLevel(i: number, t: number) {
  const n = i / (BARS - 1);
  const envelope = Math.sin(Math.PI * Math.pow(n, 0.72));
  const a = Math.sin(t * 2.1 + i * 0.55) * 0.5 + 0.5;
  const b = Math.sin(t * 3.7 - i * 0.31 + 1.7) * 0.5 + 0.5;
  const c = Math.sin(t * 1.3 + i * 0.13 + 4.2) * 0.5 + 0.5;
  return envelope * (a * 0.5 + b * 0.32 + c * 0.18);
}

export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n, setN] = useState(0);
  const [gone, setGone] = useState(false);
  const site = useSite();

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

    safety = window.setTimeout(finish, 6000);

    /* ---------------- the canvas scene ---------------- */
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    const palette = readPalette();

    /* Shared clock and progress. GSAP owns `state`, the raf loop only
     * reads it — one source of truth for where the scene is, so the
     * counter, the meters and the exit can never disagree. */
    const state = { progress: 0, cut: 0 };
    const peaks = new Float32Array(BARS);
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      /* setTransform, not scale: resize fires more than once and scale
       * would compound onto the previous frame's matrix. */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!ctx || !width || !height) return;

      const t = (performance.now() - start) / 1000;
      const p = state.progress;
      /* `cut` runs 0→1 at the end and collapses the band to a line. */
      const open = 1 - state.cut;

      ctx.clearRect(0, 0, width, height);

      const midY = height * 0.5;
      /* The band is generous on desktop and shallower on a phone, where
       * the viewport is tall and a half-height band reads as a wall. */
      const band = Math.min(height * 0.26, 200);

      /* ---- the drafting grid, struck in from the middle out ---- */
      const shell = Math.min(width - 40, 1600);
      const left = (width - shell) / 2;
      const gridIn = Math.min(1, p / 0.25);
      if (gridIn > 0) {
        ctx.save();
        ctx.strokeStyle = palette.line;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        for (let i = 0; i <= 4; i++) {
          const x = Math.round(left + (shell * i) / 4) + 0.5;
          const h = height * gridIn;
          ctx.beginPath();
          ctx.moveTo(x, midY - h / 2);
          ctx.lineTo(x, midY + h / 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      /* ---- the spectrum ---- */
      const inner = shell * 0.86;
      const x0 = (width - inner) / 2;
      const step = inner / BARS;
      const barW = Math.max(1, step * 0.52);
      /* Bars arrive left to right as the loader fills, so the band is
       * being built rather than simply fading up. */
      for (let i = 0; i < BARS; i++) {
        const arrive = Math.min(1, Math.max(0, p * 1.35 - (i / BARS) * 0.35) * 3);
        if (arrive <= 0) continue;
        const level = barLevel(i, t) * arrive * open;
        const h = Math.max(1, level * band);
        const x = x0 + i * step + (step - barW) / 2;

        ctx.fillStyle = palette.acid;
        ctx.globalAlpha = palette.onBone ? 0.5 + level * 0.5 : 0.14 + level * 0.5;
        ctx.fillRect(x, midY - h, barW, h * 2);

        /* peak hold: jumps to the peak, falls back slowly */
        peaks[i] = Math.max(peaks[i] * 0.965, level);
        const ph = peaks[i] * band;
        ctx.globalAlpha = 0.75 * open;
        ctx.fillRect(x, midY - ph - 2, barW, 1.5);
        ctx.fillRect(x, midY + ph + 1, barW, 1.5);
      }
      ctx.globalAlpha = 1;

      /* ---- the centre line: the thing that survives the cut ---- */
      const lineY = Math.round(midY) + 0.5;
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, lineY);
      ctx.lineTo(left + shell, lineY);
      ctx.stroke();

      ctx.strokeStyle = palette.acid;
      ctx.beginPath();
      ctx.moveTo(left, lineY);
      ctx.lineTo(left + shell * p, lineY);
      ctx.stroke();

      /* ---- two meter ladders, riding the band's own energy ---- */
      const rms = (barLevel(8, t) + barLevel(26, t) + barLevel(44, t)) / 3;
      const ladders = [
        { x: left, level: rms * open },
        { x: left + shell - 8, level: rms * 0.86 * open },
      ];
      for (const l of ladders) {
        const lit = Math.round(l.level * SEGMENTS * (0.35 + p * 0.65));
        for (let s = 0; s < SEGMENTS; s++) {
          const segY = midY + band - (s / SEGMENTS) * band * 2;
          const on = s < lit;
          ctx.fillStyle = on ? palette.acid : palette.line;
          ctx.globalAlpha = on ? (palette.onBone ? 1 : 0.9) : 0.5;
          ctx.fillRect(l.x, segY, 8, 2);
        }
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    /* ---------------- the timeline ---------------- */
    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: finish });

    tl.to(
      counter,
      {
        v: 100,
        duration: 1.9,
        ease: "power2.inOut",
        onUpdate: () => setN(Math.round(counter.v)),
      },
      0,
    );
    tl.to(state, { progress: 1, duration: 1.9, ease: "power2.inOut" }, 0);
    /* the signal cuts: the band collapses onto the line it was drawn around */
    tl.to(state, { cut: 1, duration: 0.34, ease: "power3.in" }, 1.95);
    tl.to("[data-pre-type]", { opacity: 0, duration: 0.25, ease: "power2.out" }, 2.06);
    tl.to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "expo.inOut" }, 2.3);

    return () => {
      tl.kill();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
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
      className="lb-scanlines fixed inset-0 z-[10000] bg-surface-deep"
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div data-pre-type className="absolute inset-0">
        {/* top: who, and what the machine says it is doing */}
        <div className="shell absolute inset-x-0 top-[max(28px,env(safe-area-inset-top,0px))] flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="neon h-[8px] w-[8px] shrink-0 bg-acid" />
            <span className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute">
              {site.name} — Kolkata
            </span>
          </span>
          <span className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute">
            Room tone
          </span>
        </div>

        {/* bottom: the counter, on the tape-counter baseline */}
        <div className="shell absolute inset-x-0 bottom-[max(28px,env(safe-area-inset-bottom,0px))] flex items-end justify-between">
          <span className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-mute">
            Bringing the room up
          </span>
          <span
            className="tnum font-display font-extrabold leading-[0.8] text-text"
            style={{ fontSize: "clamp(56px, 9vw, 128px)", letterSpacing: "-0.04em" }}
          >
            {String(n).padStart(3, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
