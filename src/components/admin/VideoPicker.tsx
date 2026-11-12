import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Link2, Upload, X } from "lucide-react";
import {
  VIDEO_ACCEPT_ATTR,
  VIDEO_BUDGET_BYTES,
  VIDEO_MAX_SECONDS,
  fitReport,
  humanBytes,
  probeVideoUrl,
  uploadVideo,
  type VideoProbe,
} from "@/cms/media";

/**
 * Choosing the opening sequence.
 *
 * The same two ways in as a picture — the file, or a link to it — and the
 * same promise: tell the editor what the slot wants before they choose, and
 * measure what they actually supplied after.
 *
 * It measures three things rather than one, because a video can be wrong in
 * three ways and only one of them is visible in a thumbnail:
 *
 *   SHAPE    — a landscape file in the phone slot gets cropped to a strip.
 *   LENGTH   — anything past ten seconds is cut off mid-shot when it plays,
 *              so an editor who uploads a thirty-second film needs to be
 *              told now and not by watching the site.
 *   WEIGHT   — and this is the one nobody expects. The sequence is the
 *              first thing downloaded and the only thing between a visitor
 *              and the site. A 20 MB file is a beautiful opener that makes
 *              the site feel broken on a phone, and it looks identical to a
 *              4 MB one in every preview.
 *
 * None of the three blocks the upload. The file is already made, the editor
 * can see what is wrong with it, and a CMS that refuses the only export
 * somebody has just leaves the slot empty for ever.
 */
export function VideoPicker({
  value,
  onChange,
  width,
  height,
  seconds,
  note,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  width: number;
  height: number;
  seconds: number;
  note?: string;
  label: string;
}) {
  const [mode, setMode] = useState<"idle" | "url">("idle");
  const [urlDraft, setUrlDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [probe, setProbe] = useState<VideoProbe | null>(null);
  const [bytes, setBytes] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const src = value.trim();

  /* Measure whatever is set, including a file chosen in an earlier session,
   * so the warnings do not go quiet the moment the page is reloaded. */
  useEffect(() => {
    let alive = true;
    if (!src) {
      setProbe(null);
      setBytes(null);
      return;
    }
    void probeVideoUrl(src).then((p) => {
      if (alive) setProbe(p);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const res = await uploadVideo(file);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setBytes(file.size);
    onChange(res.row.url);
  };

  const fit = fitReport(probe && { width: probe.width, height: probe.height }, { width, height });
  const tooLong = probe ? probe.duration > seconds + 0.25 : false;
  const heavy = bytes !== null && bytes > VIDEO_BUDGET_BYTES;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="t-label text-mute">
          {width}×{height}
        </span>
        <span className="t-label text-mute">
          up to {seconds}s · MP4 (H.264) · muted · under 6 MB
        </span>
      </div>
      {note ? <p className="mt-1 font-ui text-[13px] leading-[1.5] text-mute">{note}</p> : null}

      {src ? (
        <div className="mt-3 border border-line bg-surface-deep">
          {/* Muted, looping and tiny: a preview of the sequence, not a
              screening of it. */}
          <video
            src={src}
            className="block max-h-[220px] w-full bg-black object-contain"
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2">
            <span className="t-label truncate text-mute">
              {probe
                ? `${probe.width}×${probe.height} · ${probe.duration.toFixed(1)}s`
                : "Reading the file…"}
              {bytes !== null ? ` · ${humanBytes(bytes)}` : ""}
            </span>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setBytes(null);
              }}
              className="flex h-11 items-center gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-300 hover:text-danger"
            >
              <X size={12} />
              Remove
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept={VIDEO_ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => void choose(e.target.files?.[0])}
          aria-label={`Upload ${label}`}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex h-11 items-center gap-2 border border-line-strong px-4 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-text transition-colors duration-300 hover:border-acid-type disabled:opacity-40"
        >
          <Upload size={13} />
          {busy ? "Uploading…" : src ? "Replace" : "Upload a video"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "url" ? "idle" : "url")}
          className="flex h-11 items-center gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-300 hover:text-acid-type"
        >
          <Link2 size={13} />
          Use a link
        </button>
      </div>

      {mode === "url" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://…/opening.mp4"
            className="h-11 min-w-0 flex-1 border border-line bg-surface px-3 font-ui text-[14px] text-text"
          />
          <button
            type="button"
            onClick={() => {
              const v = urlDraft.trim();
              if (!/^https?:\/\/.+/i.test(v)) {
                setError("That should start with https://");
                return;
              }
              setError(null);
              setBytes(null);
              onChange(v);
              setUrlDraft("");
              setMode("idle");
            }}
            className="h-11 shrink-0 border border-line-strong px-4 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-text transition-colors duration-300 hover:border-acid-type"
          >
            Use it
          </button>
        </div>
      ) : null}

      {error ? <Note level="bad">{error}</Note> : null}
      {tooLong && probe ? (
        <Note level="bad">
          This runs {probe.duration.toFixed(1)}s. The opening sequence stops at {seconds}s, so
          everything after that is never seen — trim it, or let it end where it ends.
        </Note>
      ) : null}
      {heavy ? (
        <Note level="bad">
          {humanBytes(bytes)} is heavy for the first thing a visitor downloads. Aim under 6 MB:
          H.264, around 4–6 Mbps, no audio track.
        </Note>
      ) : null}
      {fit.message && !tooLong ? (
        <Note level={fit.level === "ok" ? "ok" : fit.level}>{fit.message}</Note>
      ) : null}
    </div>
  );
}

function Note({ level, children }: { level: "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const tone = level === "bad" ? "text-danger" : level === "warn" ? "text-acid-type" : "text-mute";
  return (
    <p className={`mt-2 flex items-start gap-2 font-ui text-[13px] leading-[1.5] ${tone}`}>
      <span className="mt-[3px] shrink-0">
        {level === "ok" ? <Check size={13} /> : <AlertTriangle size={13} />}
      </span>
      <span>{children}</span>
    </p>
  );
}

/** What a slot is allowed to be, said once so the schema and the UI agree. */
export const VIDEO_SLOT_SECONDS = VIDEO_MAX_SECONDS;
