import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Save, ExternalLink } from "lucide-react";
import { FieldRenderer, ListEditor } from "./Fields";
import { blankRecord, type Collection } from "@/cms/schema";
import { seeds } from "@/cms/seeds";
import { resetToSeed, saveDocument } from "@/cms/admin";

/**
 * One editable section.
 *
 * Holds a draft, compares it against what was loaded to know whether anything
 * is dirty, and refuses to let the tab close on unsaved work. The draft is
 * seeded from the stored document, or from the committed default when the
 * database has no row — so an editor opening a never-touched section finds
 * the live site's content in it, not an empty form they have to guess at.
 *
 * Saving writes the whole document. These are small JSON blobs edited by one
 * person at a time; a field-level patch protocol would buy nothing but a
 * merge algorithm nobody asked for.
 */
export function DocEditor({
  collection,
  stored,
  onSaved,
}: {
  collection: Collection;
  stored: unknown;
  onSaved: () => void;
}) {
  const initial = useMemo(() => {
    const base = stored ?? seeds[collection.key];
    if (base !== undefined && base !== null) return structuredClone(base);
    return collection.shape === "list" ? [] : blankRecord(collection.fields);
  }, [stored, collection]);

  const [draft, setDraft] = useState<unknown>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const savedRef = useRef(JSON.stringify(initial));

  useEffect(() => {
    setDraft(initial);
    savedRef.current = JSON.stringify(initial);
    setMessage(null);
  }, [initial]);

  const dirty = JSON.stringify(draft) !== savedRef.current;

  /* Losing twenty minutes of copy edits to a stray Cmd-W is the single most
   * annoying thing a CMS can do. */
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const err = await saveDocument(collection.key, draft);
    setBusy(false);
    if (err) {
      setMessage({ tone: "bad", text: err });
      return;
    }
    savedRef.current = JSON.stringify(draft);
    setMessage({ tone: "ok", text: "Saved. The live site is updated." });
    onSaved();
  }, [collection.key, draft, onSaved]);

  const revert = useCallback(async () => {
    if (
      !window.confirm(
        `Put "${collection.title}" back to the original content? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    const err = await resetToSeed(collection.key);
    setBusy(false);
    if (err) {
      setMessage({ tone: "bad", text: err });
      return;
    }
    const seed = structuredClone(seeds[collection.key]);
    setDraft(seed);
    savedRef.current = JSON.stringify(seed);
    setMessage({ tone: "ok", text: "Reset to the original content." });
    onSaved();
  }, [collection.key, collection.title, onSaved]);

  /* Cmd/Ctrl-S. Anyone who edits text all day will try it. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !busy) void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, busy, save]);

  return (
    <section className="border border-line bg-surface-deep">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-6">
        <div className="min-w-0">
          <h2 className="font-display text-[20px] font-bold leading-[1.1] tracking-[-0.02em] text-text">
            {collection.title}
          </h2>
          <p className="mt-2 max-w-[64ch] font-ui text-[13px] leading-[1.5] text-mute">
            {collection.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void revert()}
            disabled={busy}
            title="Put this section back to the content the site shipped with"
            className="flex h-10 items-center gap-2 border border-line px-3 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-mute transition-colors duration-300 hover:border-acid-type hover:text-text disabled:opacity-50"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || !dirty}
            className="flex h-10 items-center gap-2 bg-acid px-5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-text transition-colors duration-300 hover:bg-acid-dim disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-mute"
          >
            <Save size={13} />
            {busy ? "Saving…" : dirty ? "Save" : "Saved"}
          </button>
        </div>
      </header>

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className={`border-b border-line px-6 py-3 font-ui text-[13px] ${
            message.tone === "ok" ? "text-acid-type" : "text-acid-type"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="p-6">
        {collection.shape === "list" ? (
          <ListEditor
            field={{
              kind: "list",
              name: collection.key,
              label: collection.title,
              fields: collection.fields,
              titleField: collection.titleField,
              itemNoun: collection.itemNoun,
            }}
            value={Array.isArray(draft) ? (draft as Record<string, unknown>[]) : []}
            onChange={(v) => setDraft(v)}
          />
        ) : (
          <div className="max-w-[720px] space-y-8">
            {collection.fields.map((f) => (
              <FieldRenderer
                key={f.name}
                field={f}
                value={(draft as Record<string, unknown>)?.[f.name]}
                onChange={(v) =>
                  setDraft({ ...((draft as Record<string, unknown>) ?? {}), [f.name]: v })
                }
              />
            ))}
          </div>
        )}
      </div>

      {dirty ? (
        <footer className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-line bg-surface px-6 py-4">
          <span className="font-ui text-[12px] text-mute">Unsaved changes</span>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="flex h-10 items-center gap-2 bg-acid px-5 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-text transition-colors duration-300 hover:bg-acid-dim disabled:opacity-50"
          >
            <Save size={13} />
            {busy ? "Saving…" : "Save"}
          </button>
        </footer>
      ) : null}
    </section>
  );
}

/** Small link out to the live page a section appears on. */
export function ViewLive({ path }: { path: string }) {
  return (
    <a
      href={path}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-mute transition-colors duration-300 hover:text-acid-type"
    >
      View live
      <ExternalLink size={12} />
    </a>
  );
}
