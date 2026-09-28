import { useEffect, useRef, type CSSProperties } from "react";
import { binCount, levels } from "@/lib/audio-graph";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The analyser, drawn the way a console draws one.
 *
 * Not a decoration and not a CSS animation pretending to be one — these
 * bars are the actual FFT of the actual track, and if the audio stops they
 * fall to the floor because there is nothing to draw.
 *
 * WHAT MAKES IT READ AS GEAR RATHER THAN AS A WEB TOY
 * The peak-hold markers. Every bar leaves a line at its highest recent
 * value which then sinks slowly, so a snare leaves a mark that hangs for a
 * moment after the transient has gone. Every piece of studio metering ever
 * built does this, almost no website does, and it is the entire difference
 * between "audio visualiser" and "the thing on the wall of the control
 * room".
 *
 * Bins are spaced logarithmically. Linear FFT bins put nine tenths of the
 * width on the top two octaves, where music has almost nothing, and the
 * bass — which is what you actually feel — gets three pixels.
 *
 * It costs nothing when nothing is playing: the loop only runs while
 * `active`, and it stops on reduced motion, where it draws one honest
 * still frame instead.
 */
export function Spectrum({
  active,
  bars = 48,
  className,
}: {
  /** the track is playing — outside of that the loop must not run */
  active: boolean;
  bars?: number;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const peaks = useRef<Float32Array>(new Float32Array(bars));
  const values = useRef<Float32Array>(new Float32Array(bars));

  useEffect(() => {
    peaks.current = new Float32Array(bars);
    values.current = new Float32Array(bars);
  }, [bars]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const css = getComputedStyle(el);
    const ink = css.getPropertyValue("--spectrum-ink").trim() || "#e9ff00";
    const rest = css.getPropertyValue("--spectrum-rest").trim() || "rgba(255,255,255,0.14)";

    let raf = 0;
    let bins = new Uint8Array(binCount());
    const still = prefersReducedMotion();

    /* Logarithmic bin edges: bar i covers the bins between edge i and
     * i+1, so an octave gets the same width wherever it sits. */
    const edges = (n: number) => {
      const out = new Array<number>(bars + 1);
      const top = n - 1;
      for (let i = 0; i <= bars; i++) {
        out[i] = Math.min(top, Math.floor(Math.pow(top, i / bars)));
      }
      return out;
    };
    let edge = edges(bins.length);

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = el.getBoundingClientRect();
      el.width = Math.max(1, Math.round(r.width * dpr));
      el.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    const draw = () => {
      const r = el.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      ctx.clearRect(0, 0, w, h);

      if (bins.length !== binCount()) {
        bins = new Uint8Array(binCount());
        edge = edges(bins.length);
      }
      const live = active && !still && levels(bins);

      const gap = 2;
      const bw = Math.max(1, (w - gap * (bars - 1)) / bars);

      for (let i = 0; i < bars; i++) {
        let v = 0;
        if (live) {
          /* Peak of the bins this bar covers — an average smears the
           * transients that make it worth watching. */
          let m = 0;
          for (let b = edge[i]; b <= edge[i + 1]; b++) if (bins[b] > m) m = bins[b];
          /* Tilt the top end up: real programme material falls about
           * 4.5dB per octave, and without this the right half is flat. */
          v = Math.min(1, (m / 255) * (1 + (i / bars) * 0.85));
        }

        /* Fall slowly, rise instantly — the asymmetry is what a meter
         * does and what makes it readable. */
        const prev = values.current[i];
        values.current[i] = v > prev ? v : prev * 0.82 + v * 0.18;
        const val = values.current[i];

        const p = peaks.current[i];
        peaks.current[i] = val > p ? val : Math.max(val, p - 0.012);

        const x = i * (bw + gap);
        const bh = Math.max(1, val * (h - 4));

        ctx.fillStyle = live ? ink : rest;
        ctx.globalAlpha = live ? 0.55 + val * 0.45 : 1;
        ctx.fillRect(x, h - bh, bw, bh);

        /* The peak-hold mark. */
        if (live && peaks.current[i] > 0.02) {
          const py = h - Math.max(2, peaks.current[i] * (h - 4));
          ctx.globalAlpha = 1;
          ctx.fillStyle = ink;
          ctx.fillRect(x, py - 1, bw, 2);
        }
      }
      ctx.globalAlpha = 1;

      if (active && !still) raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active, bars]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className={className}
      style={
        {
          "--spectrum-ink": "var(--accent)",
          "--spectrum-rest": "var(--line)",
        } as CSSProperties
      }
    />
  );
}
