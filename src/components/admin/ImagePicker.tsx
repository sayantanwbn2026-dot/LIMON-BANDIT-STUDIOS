import { useEffect, useRef, useState } from "react";
import { Upload, Link2, X, AlertTriangle, Check } from "lucide-react";
import {
  ACCEPT_ATTR,
  MAX_BYTES,
  addExternal,
  fitReport,
  humanBytes,
  probeUrl,
  resolveImage,
  uploadFile,
} from "@/cms/media";
import { images } from "@/generated/images";

/**
 * Choosing an image.
 *
 * Two ways in, because an editor either has the file or has a link to it, and
 * forcing the second case through a download-then-reupload is the kind of
 * friction that ends with the placeholder still being there in six months.
 *
 * The slot's expected resolution is printed before anything is chosen, and
 * what was actually supplied is measured and compared after. That comparison
 * warns rather than blocks: aspect ratio is called out loudly because a
 * wrong-shaped image gets cropped and looks like a mistake, size is called
 * out softly because a small image merely looks soft, and neither refuses the
 * upload — sometimes the only photograph that exists is the wrong one, and a
 * CMS that rejects it just keeps the placeholder forever.
 */
export function ImagePicker({
  value,
  onChange,
  width,
  height,
  note,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  width: number;
  height: number;
  note?: string;
  label: string;
}) {
  const [mode, setMode] = useState<"idle" | "url">("idle");
  const [urlDraft, setUrlDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actual, setActual] = useState<{ width: number; height: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resolved = resolveImage(value);

  /* Measure whatever is currently set, so an image chosen in an earlier
   * session still reports its fit rather than going quiet. */
  useEffect(() => {
    let alive = true;
    if (resolved.kind === "manifest") {
      setActual({ width: resolved.width, height: resolved.height });
      return;
    }
    if (resolved.kind === "url") {
      void probeUrl(resolved.url).then((d) => {
        if (alive) setActual(d);
      });
      return;
    }
    setActual(null);
    return () => {
      alive = false;
    };
  }, [value, resolved.kind]);

  const preview =
    resolved.kind === "url"
      ? resolved.url
      : resolved.kind === "manifest"
        ? images[resolved.key].fallback
        : null;

  const report = actual ? fitReport(actual, { width, height }) : null;

  const onFile = async (file: File) => {
    setError(null);
    setBusy(true);
    const res = await uploadFile(file, label);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onChange(res.row.url);
  };

  const onUrl = async () => {
    setError(null);
    setBusy(true);
    const res = await addExternal(urlDraft, label);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onChange(res.row.url);
    setUrlDraft("");
    setMode("idle");
  };

  return (
    <div className="border border-line bg-surface-deep">
      <div className="flex gap-4 p-4">
        {/* preview */}
        <div
          className="flex w-[110px] shrink-0 items-center justify-center overflow-hidden border border-line bg-surface-raised"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="t-label px-2 text-center text-mute">Nothing yet</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* The requirement, stated before anything is chosen. */}
          <p className="tnum font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-acid-type">
            {width} × {height} px
          </p>
          {note ? (
            <p className="mt-1 font-ui text-[12px] leading-[1.45] text-mute">{note}</p>
          ) : null}

          {report && report.message ? (
            <p
              className={`mt-2 flex items-start gap-1.5 font-ui text-[12px] leading-[1.45] ${
                report.level === "ok" ? "text-mute" : "text-acid-type"
              }`}
            >
              {report.level === "ok" ? (
                <Check size={13} className="mt-[2px] shrink-0" />
              ) : (
                <AlertTriangle size={13} className="mt-[2px] shrink-0" />
              )}
              <span>{report.level === "ok" ? `Supplied ${report.message}` : report.message}</span>
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex h-9 items-center gap-2 border border-line px-3 font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-text transition-colors duration-300 hover:border-acid-type disabled:opacity-50"
            >
              <Upload size={13} />
              {busy ? "Working…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => setMode((m) => (m === "url" ? "idle" : "url"))}
              disabled={busy}
              className="flex h-9 items-center gap-2 border border-line px-3 font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-text transition-colors duration-300 hover:border-acid-type disabled:opacity-50"
            >
              <Link2 size={13} />
              Use a link
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setActual(null);
                }}
                className="flex h-9 items-center gap-1.5 px-2 font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-mute transition-colors duration-300 hover:text-acid-type"
              >
                <X size={13} />
                Clear
              </button>
            ) : null}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />

          {mode === "url" ? (
            <div className="mt-3 flex gap-2">
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://…"
                className="h-9 min-w-0 flex-1 border-b border-line bg-transparent font-ui text-[13px] text-text outline-none transition-colors focus:border-acid-type placeholder:text-[color:var(--placeholder)]"
              />
              <button
                type="button"
                onClick={() => void onUrl()}
                disabled={busy || !urlDraft.trim()}
                className="h-9 shrink-0 bg-acid px-4 font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-accent-text transition-colors duration-300 hover:bg-acid-dim disabled:opacity-50"
              >
                Use
              </button>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-2 font-ui text-[12px] leading-[1.45] text-acid-type">
              {error}
            </p>
          ) : null}

          <p className="t-label mt-3 text-mute">
            JPG, PNG, WebP, AVIF, GIF or SVG. Up to {humanBytes(MAX_BYTES)}.
          </p>
        </div>
      </div>
    </div>
  );
}
