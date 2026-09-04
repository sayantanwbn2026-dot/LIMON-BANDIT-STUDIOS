import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Check, Link2, Trash2, Upload } from "lucide-react";
import { AdminHeading } from "@/components/admin/AdminShell";
import {
  ACCEPT_ATTR,
  addExternal,
  deleteMedia,
  humanBytes,
  listMedia,
  uploadFile,
  type MediaRow,
} from "@/cms/media";

export const Route = createFileRoute("/admin/media")({
  component: MediaLibrary,
});

/**
 * Every image the CMS knows about.
 *
 * Mostly a browsing and housekeeping surface — images are normally chosen
 * from inside the field that uses them, where the required resolution is on
 * screen. This exists to see what has accumulated, copy a link, and delete
 * what is no longer used.
 *
 * Deleting is not checked against usage. Doing that properly means scanning
 * every document for the URL on every delete, and the honest tradeoff for a
 * site this size is a clear warning instead: a removed image leaves an empty
 * slot the section falls back out of, not a broken page.
 */
function MediaLibrary() {
  const [rows, setRows] = useState<MediaRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    void listMedia().then(setRows);
  }, []);

  useEffect(load, [load]);

  const onFiles = async (files: FileList) => {
    setError(null);
    setBusy(true);
    for (const file of Array.from(files)) {
      const res = await uploadFile(file);
      if (!res.ok) {
        setError(res.message);
        break;
      }
    }
    setBusy(false);
    load();
  };

  const onUrl = async () => {
    setError(null);
    setBusy(true);
    const res = await addExternal(urlDraft);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setUrlDraft("");
    load();
  };

  const onDelete = async (row: MediaRow) => {
    if (
      !window.confirm(
        `Delete this image?\n\nIf a page is using it, that image will disappear from the site. This cannot be undone.`,
      )
    ) {
      return;
    }
    const err = await deleteMedia(row);
    if (err) setError(err);
    load();
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked — the URL is on screen to select */
    }
  };

  return (
    <>
      <AdminHeading
        title="Media"
        standfirst="Every image uploaded to the site, and every external image link in use. You can also pick images directly inside the section that uses them, where the required size is shown."
      />

      <div className="flex flex-wrap items-center gap-3 border border-line bg-surface-deep p-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex h-11 items-center gap-2 bg-acid px-5 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-accent-text transition-colors duration-300 hover:bg-acid-dim disabled:opacity-50"
        >
          <Upload size={14} />
          {busy ? "Working…" : "Upload images"}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void onFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <span className="t-label text-mute">or</span>

        <div className="flex min-w-[280px] flex-1 gap-2">
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="Paste an image link — https://…"
            className="h-11 min-w-0 flex-1 border-b border-line bg-transparent font-ui text-[13px] text-text outline-none transition-colors focus:border-acid-type placeholder:text-[color:var(--placeholder)]"
          />
          <button
            type="button"
            onClick={() => void onUrl()}
            disabled={busy || !urlDraft.trim()}
            className="flex h-11 shrink-0 items-center gap-2 border border-line px-4 font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-text transition-colors duration-300 hover:border-acid-type disabled:opacity-50"
          >
            <Link2 size={13} />
            Add
          </button>
        </div>
      </div>

      <p className="t-label mt-3 text-mute">
        Up to 20 MB per file. JPG, PNG, WebP, AVIF, GIF, SVG.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 border-l-2 border-acid-type py-2 pl-4 font-ui text-[13px] text-mute"
        >
          {error}
        </p>
      ) : null}

      {rows === null ? (
        <p className="t-label mt-10 text-mute">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-10 max-w-[52ch] font-ui text-[14px] leading-[1.6] text-mute">
          Nothing uploaded yet. The images currently on the site are built into the code and do not
          appear here — they will show up once you replace one.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((row) => (
            <li key={row.id} className="bg-surface-deep">
              <div className="aspect-square overflow-hidden bg-surface-raised">
                <img
                  src={row.url}
                  alt={row.alt ?? ""}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="truncate font-ui text-[12px] font-semibold text-text">
                  {row.filename ?? "Untitled"}
                </p>
                <p className="tnum mt-1 font-ui text-[11px] text-mute">
                  {row.width && row.height ? `${row.width} × ${row.height}` : "Size unknown"}
                  {" · "}
                  {humanBytes(row.bytes)}
                </p>
                {row.kind === "external" ? (
                  <p className="t-label mt-1 text-mute">External link</p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void copy(row.url)}
                    className="flex h-8 flex-1 items-center justify-center gap-1.5 border border-line font-ui text-[10px] font-bold uppercase tracking-[0.1em] text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
                  >
                    {copied === row.url ? <Check size={12} /> : <Copy size={12} />}
                    {copied === row.url ? "Copied" : "Link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(row)}
                    aria-label={`Delete ${row.filename ?? "image"}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-mute transition-colors duration-300 hover:border-acid-type hover:text-acid-type"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
