import { useEffect, useRef, useState } from "react";

/** Decoded peaks per source, so switching tracks back and forth decodes once. */
const cache = new Map<string, Float32Array>();
const inflight = new Map<string, Promise<Float32Array>>();

async function peaksFor(src: string, buckets: number): Promise<Float32Array> {
  const hit = cache.get(src);
  if (hit) return hit;
  const pending = inflight.get(src);
  if (pending) return pending;

  const job = (async () => {
    const AC: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    try {
      const bytes = await fetch(src).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      });
      const buf = await ctx.decodeAudioData(bytes);
      const ch = buf.getChannelData(0);
      const block = Math.max(1, Math.floor(ch.length / buckets));
      const out = new Float32Array(buckets);
      let peak = 0;
      for (let i = 0; i < buckets; i++) {
        let m = 0;
        const start = i * block;
        for (let j = 0; j < block; j++) {
          const v = Math.abs(ch[start + j] ?? 0);
          if (v > m) m = v;
        }
        out[i] = m;
        if (m > peak) peak = m;
      }
      // normalise so a quiet master still fills the box
      if (peak > 0) for (let i = 0; i < buckets; i++) out[i] /= peak;
      cache.set(src, out);
      return out;
    } finally {
      void ctx.close();
      inflight.delete(src);
    }
  })();

  inflight.set(src, job);
  return job;
}

/**
 * The waveform, drawn from the actual audio.
 *
 * Peaks come from decoding the file through Web Audio, not from a picture of
 * a waveform and not from a fixed array of bar heights — so it is a true
 * reading of the track, and a different track looks different.
 *
 * Canvas is sized at devicePixelRatio; on a 1.25x or 2x display a CSS-pixel
 * canvas would render the 1px bars soft, which on this site reads as a bug.
 */
export function Waveform({
  src,
  progress,
  onSeek,
  className,
  height = 96,
}: {
  src: string;
  /** 0..1 */
  progress: number;
  onSeek?: (fraction: number) => void;
  className?: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [failed, setFailed] = useState(false);
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setPeaks(null);
    setFailed(false);
    peaksFor(src, 260)
      .then((p) => alive && setPeaks(p))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [src]);

  /* Colours are CSS variables; a theme flip has to force a redraw or the
   * waveform keeps the previous theme's ink until the next timeupdate. */
  useEffect(() => {
    const ob = new MutationObserver(() => setThemeTick((n) => n + 1));
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => ob.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;
    const cssW = canvas.clientWidth;
    const cssH = height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const cs = getComputedStyle(document.documentElement);
    const unplayed = cs.getPropertyValue("--line-strong").trim() || "#2a2a2a";
    const played = cs.getPropertyValue("--accent-type").trim() || "#e9ff00";

    const barW = 2;
    const gap = 1;
    const count = Math.max(1, Math.floor(cssW / (barW + gap)));
    const mid = cssH / 2;

    for (let i = 0; i < count; i++) {
      const p = peaks[Math.floor((i / count) * peaks.length)] ?? 0;
      const h = Math.max(1, p * (cssH - 4));
      const x = i * (barW + gap);
      ctx.fillStyle = i / count <= progress ? played : unplayed;
      ctx.fillRect(x, mid - h / 2, barW, h);
    }
  }, [peaks, progress, height, themeTick]);

  const handleSeek = (e: React.MouseEvent<HTMLElement>) => {
    if (!onSeek) return;
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  if (failed) {
    return (
      <div
        className={`flex items-center border border-line px-4 ${className ?? ""}`}
        style={{ height }}
      >
        <span className="t-label text-mute">Preview unavailable</span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${onSeek ? "cursor-pointer" : ""} ${className ?? ""}`}
      style={{ height }}
      onClick={handleSeek}
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
      {!peaks && (
        <span className="t-label absolute inset-0 flex items-center text-mute">Reading track…</span>
      )}
    </div>
  );
}
