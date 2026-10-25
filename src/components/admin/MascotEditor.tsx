import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Save } from "lucide-react";
import { FieldRenderer } from "./Fields";
import { ViewLive } from "./DocEditor";
import { image, text, PAGES } from "@/cms/schema";
import { loadDocuments, saveDocument } from "@/cms/admin";
import { seeds } from "@/cms/seeds";
import { resolveImage } from "@/cms/media";
import { images } from "@/generated/images";
import {
  MASCOT_HEIGHT,
  MASCOT_PAGES,
  MASCOT_WIDTH,
  applyMascots,
  pickMascot,
  type MascotDraft,
  type MascotFields,
} from "@/cms/mascot";
import { chapter } from "@/data/routes";

/**
 * The Hero Mascot screen: every mascot on the site, in one place.
 *
 * The fields themselves are not new — the house mascot lives in
 * `global.site` and each page's own in its `global.pages` row, which is
 * what the heroes read (see pickMascot). They were split between Brand &
 * contact and the bottom of eight Page titles & SEO rows, so changing the
 * mascot meant knowing both places existed. This puts the house slot and a
 * slot per page side by side, each with a picture of how he will stand.
 *
 * WHY THE PREVIEW. "Exactly where he stands now" is a property of the file,
 * not of the site: every hero places the same box in the same spot and
 * fits the picture inside it without cropping. So the screen shows that
 * box, dashed, at a laptop's and a phone's proportions, with the picture
 * fitted the way the page will fit it — an empty margin in the file or a
 * different shape is visible there before it is visible on the site.
 */

const IMAGE_NOTE =
  "Transparent PNG or WebP, cropped tight to the figure, feet on the bottom edge — see Size and placement above.";

const houseImage = image(
  "mascot",
  "House mascot",
  MASCOT_WIDTH,
  MASCOT_HEIGHT,
  `${IMAGE_NOTE} Clear it to go back to the original Limon.`,
);
const pageImage = (label: string) =>
  image(
    "mascot",
    `${label} mascot`,
    MASCOT_WIDTH,
    MASCOT_HEIGHT,
    `${IMAGE_NOTE} Leave it empty to use the house mascot.`,
  );
const altField = text("mascotAlt", "Description", {
  help: "One line saying what he looks like, read out to people using a screen reader.",
});

const str = (v: unknown) => (typeof v === "string" ? v : "");

function draftFrom(docs: Record<string, unknown>): MascotDraft {
  const site = (docs["global.site"] ?? seeds["global.site"]) as Record<string, unknown> | undefined;
  const stored = docs["global.pages"];
  const rows = (Array.isArray(stored) ? stored : seeds["global.pages"]) as Record<
    string,
    unknown
  >[];
  return {
    house: { mascot: str(site?.mascot), mascotAlt: str(site?.mascotAlt) },
    pages: Object.fromEntries(
      MASCOT_PAGES.map((key) => {
        const row = rows.find((r) => r?.key === key);
        return [key, { mascot: str(row?.mascot), mascotAlt: str(row?.mascotAlt) }];
      }),
    ),
  };
}

/** What an <img> can show for a stored value: an upload's URL, or the build's own file. */
function displayable(src: string): string | null {
  const r = resolveImage(src);
  if (r.kind === "url") return r.url;
  if (r.kind === "manifest") return images[r.key].fallback;
  return null;
}

export function MascotEditor() {
  const [docs, setDocs] = useState<Record<string, unknown> | null>(null);
  const load = useCallback(() => {
    void loadDocuments().then(setDocs);
  }, []);
  useEffect(load, [load]);

  if (docs === null) return <p className="t-label text-mute">Loading the mascots…</p>;
  return <MascotForm docs={docs} onSaved={load} />;
}

export function MascotForm({
  docs,
  onSaved,
}: {
  docs: Record<string, unknown>;
  onSaved: () => void;
}) {
  const initial = useMemo(() => draftFrom(docs), [docs]);
  const [draft, setDraft] = useState<MascotDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const savedRef = useRef(JSON.stringify(initial));

  useEffect(() => {
    setDraft(initial);
    savedRef.current = JSON.stringify(initial);
  }, [initial]);

  const dirty = JSON.stringify(draft) !== savedRef.current;

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
    const before = JSON.parse(savedRef.current) as MascotDraft;
    /* Fetched again now, not reused from when the screen opened — see
     * applyMascots for why. */
    const latest = await loadDocuments();
    const { site, pages } = applyMascots(
      latest["global.site"] ?? seeds["global.site"],
      Array.isArray(latest["global.pages"]) ? latest["global.pages"] : seeds["global.pages"],
      draft,
      seeds["global.pages"],
    );
    const errors: string[] = [];
    if (JSON.stringify(draft.house) !== JSON.stringify(before.house)) {
      const err = await saveDocument("global.site", site);
      if (err) errors.push(err);
    }
    if (JSON.stringify(draft.pages) !== JSON.stringify(before.pages)) {
      const err = await saveDocument("global.pages", pages);
      if (err) errors.push(err);
    }
    setBusy(false);
    if (errors.length) {
      setMessage({ tone: "bad", text: errors.join(" ") });
      return;
    }
    savedRef.current = JSON.stringify(draft);
    setMessage({ tone: "ok", text: "Saved. The live site is updated." });
    onSaved();
  }, [draft, onSaved]);

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

  const setHouse = (next: MascotFields) => setDraft((d) => ({ ...d, house: next }));
  const setPage = (key: string, next: MascotFields) =>
    setDraft((d) => ({ ...d, pages: { ...d.pages, [key]: next } }));

  return (
    <div className="space-y-10">
      <SizeGuide />

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className={`border px-4 py-3 font-ui text-[13px] ${
            message.tone === "ok" ? "border-line text-acid-type" : "border-danger text-danger"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <Slot
        title="House mascot"
        note="Stands on every page's opening screen unless that page has its own below, and appears faintly in the menu, the footer and the “Still stuck?” card."
        field={houseImage}
        value={draft.house}
        onChange={setHouse}
        effective={pickMascot(undefined, draft.house).src}
        word={chapter("home").poster.word}
      />

      {MASCOT_PAGES.map((key) => {
        const page = PAGES.find((p) => p.key === key);
        const label = page?.label ?? key;
        const value = draft.pages[key] ?? { mascot: "", mascotAlt: "" };
        const own = resolveImage(value.mascot).kind !== "none";
        return (
          <Slot
            key={key}
            title={label}
            note={
              own
                ? "This page has its own mascot."
                : "Using the house mascot. Upload one here to give this page its own."
            }
            badge={own ? "Own mascot" : "House mascot"}
            path={page?.path}
            field={pageImage(label)}
            value={value}
            onChange={(next) => setPage(key, next)}
            effective={pickMascot(value, draft.house).src}
            word={chapter(key).poster.word}
            compact={key === "shop"}
          />
        );
      })}

      {dirty ? (
        <footer className="sticky bottom-0 flex items-center justify-between gap-4 border border-line bg-surface px-6 py-4">
          <span className="font-ui text-[12px] text-mute">Unsaved changes</span>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="flex h-10 items-center gap-2 bg-acid px-5 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-accent-text transition-colors duration-300 hover:bg-acid-dim disabled:opacity-50"
          >
            <Save size={13} />
            {busy ? "Saving…" : "Save"}
          </button>
        </footer>
      ) : null}
    </div>
  );
}

/* ---------------- the rules, stated once ---------------- */

function SizeGuide() {
  return (
    <section className="border border-line bg-surface-deep p-6">
      <h2 className="font-display text-[20px] font-extrabold uppercase leading-[1.1] tracking-[-0.02em] text-text">
        Size and placement
      </h2>
      <p className="mt-2 max-w-[70ch] font-ui text-[13px] leading-[1.55] text-mute">
        Every page puts the mascot in the same box, in the same spot, and fits the picture inside it
        without cropping. So where he stands is decided by the file: one made to these four rules
        stands exactly where Limon stands now.
      </p>

      <dl className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <Rule
          k="Size"
          v={`${MASCOT_WIDTH} × ${MASCOT_HEIGHT} px`}
          d={`A little taller than wide — the shape of the current Limon. Bigger at the same shape is fine and looks sharper on large screens, e.g. ${MASCOT_WIDTH * 2} × ${MASCOT_HEIGHT * 2} px.`}
        />
        <Rule
          k="Background"
          v="Transparent"
          d="PNG or WebP. A JPG has a solid background and would show as a box behind him."
        />
        <Rule
          k="Crop"
          v="Tight to the figure"
          d="Top of the head on the top edge, feet on the bottom edge, no empty margin. The bottom edge is the floor he stands on."
        />
        <Rule
          k="Position"
          v="Centred"
          d="He is placed by the middle of the picture, so keep the figure centred left to right."
        />
      </dl>

      <p className="mt-6 font-ui text-[13px] leading-[1.55] text-mute">
        <span className="font-bold text-text">How tall he stands:</span> about half the screen on a
        phone (40% on the Shop page, up to 330 px), 54% on a tablet, 62% on a laptop and 68% on a
        large screen. Up to 20 MB per file.
      </p>
    </section>
  );
}

function Rule({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className="bg-surface-deep p-4">
      <dt className="t-label text-mute">{k}</dt>
      <dd className="tnum mt-2 font-ui text-[13px] font-bold uppercase tracking-[0.08em] text-acid-type">
        {v}
      </dd>
      <dd className="mt-2 font-ui text-[12px] leading-[1.5] text-mute">{d}</dd>
    </div>
  );
}

/* ---------------- one mascot ---------------- */

function Slot({
  title,
  note,
  badge,
  path,
  field,
  value,
  onChange,
  effective,
  word,
  compact = false,
}: {
  title: string;
  note: string;
  badge?: string;
  path?: string;
  field: ReturnType<typeof image>;
  value: MascotFields;
  onChange: (next: MascotFields) => void;
  /** what will actually stand on the stage, after the fallbacks */
  effective: string;
  word: string;
  compact?: boolean;
}) {
  return (
    <section className="border border-line bg-surface-deep">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[20px] font-extrabold uppercase leading-[1.1] tracking-[-0.02em] text-text">
              {title}
            </h2>
            {badge ? (
              <span className="t-label border border-line px-2 py-1 text-mute">{badge}</span>
            ) : null}
          </div>
          <p className="mt-2 max-w-[64ch] font-ui text-[13px] leading-[1.5] text-mute">{note}</p>
        </div>
        {path ? <ViewLive path={path} /> : null}
      </header>

      <div className="grid gap-8 p-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <FieldRenderer
            field={field}
            value={value.mascot}
            onChange={(v) => onChange({ ...value, mascot: str(v) })}
          />
          <CutoutCheck src={value.mascot} />
          <FieldRenderer
            field={altField}
            value={value.mascotAlt}
            onChange={(v) => onChange({ ...value, mascotAlt: str(v) })}
          />
        </div>
        <StagePreview src={displayable(effective)} word={word} compact={compact} />
      </div>
    </section>
  );
}

/* ---------------- how he will stand ---------------- */

type Box = { height: number; width: number; bottom: number };

/* The hero's own numbers (PageHero / Hero), as percentages of the screen. */
const LAPTOP: Box = { height: 62, width: 48, bottom: 8 };
const PHONE: Box = { height: 52, width: 92, bottom: 18 };
/* Shop's compact phone stage: two thirds of the screen, him on its floor. */
const PHONE_COMPACT: Box = { height: 40, width: 92, bottom: 34 };

function StagePreview({
  src,
  word,
  compact,
}: {
  src: string | null;
  word: string;
  compact: boolean;
}) {
  return (
    <figure>
      <figcaption className="t-label text-mute">
        How he stands — laptop and phone. The dashed box is the space he is fitted into.
      </figcaption>
      <div className="mt-3 flex items-end gap-4">
        <Frame aspect="16 / 10" box={LAPTOP} word={word} top={13} inset={4} src={src} grow />
        <Frame
          aspect="375 / 812"
          box={compact ? PHONE_COMPACT : PHONE}
          word={word}
          top={15}
          inset={8.5}
          src={src}
          floor={compact ? 66 : undefined}
        />
      </div>
    </figure>
  );
}

function Frame({
  aspect,
  box,
  word,
  top,
  inset,
  src,
  floor,
  grow = false,
}: {
  aspect: string;
  box: Box;
  word: string;
  /** where the wordmark starts, % from the top */
  top: number;
  /** the page margin, % of the width */
  inset: number;
  src: string | null;
  /** where a compact stage ends, % from the top */
  floor?: number;
  grow?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden border border-line bg-surface ${grow ? "min-w-0 flex-1" : "w-[92px] shrink-0"}`}
      style={{ aspectRatio: aspect }}
    >
      {/* the wordmark he stands in front of, stretched to the measure */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 16"
        className="absolute text-line"
        style={{ left: `${inset}%`, width: `${100 - inset * 2}%`, top: `${top}%` }}
      >
        <text
          x="0"
          y="14.5"
          textLength="100"
          lengthAdjust="spacingAndGlyphs"
          fill="currentColor"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}
        >
          {word.toUpperCase()}
        </text>
      </svg>

      {floor !== undefined ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 border-t border-line"
          style={{ top: `${floor}%` }}
        />
      ) : null}

      <div
        className="absolute left-1/2 -translate-x-1/2 border border-dashed border-acid-type/50"
        style={{ height: `${box.height}%`, width: `${box.width}%`, bottom: `${box.bottom}%` }}
      >
        {src ? <img src={src} alt="" className="h-full w-full object-contain" /> : null}
      </div>
    </div>
  );
}

/* ---------------- is it a cut-out? ---------------- */

/**
 * Look at an uploaded picture the way the stage will: is the background
 * see-through, and does the figure reach the floor and the top edge? The
 * image slot already checks the shape; these are the two mistakes a shape
 * check cannot see, and both move him — a margin under the feet floats him
 * above the floor, a margin over the head makes him shorter than Limon.
 *
 * Read at 200px tall, which is plenty to find an edge. A link to a host
 * that does not allow its pictures to be read says nothing rather than
 * guessing.
 */
async function inspectCutout(url: string): Promise<string[] | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  try {
    await img.decode();
  } catch {
    return null;
  }
  const h = 200;
  const w = Math.max(1, Math.round((img.naturalWidth * h) / img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }
  const alpha = (x: number, y: number) => data[(y * w + x) * 4 + 3];

  const corners = [alpha(0, 0), alpha(w - 1, 0), alpha(0, h - 1), alpha(w - 1, h - 1)];
  if (corners.every((a) => a > 240)) {
    return [
      "No transparent background — he would stand in a solid box. Use a PNG or WebP cut-out.",
    ];
  }

  let minY = h;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha(x, y) > 16) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxY < 0) return ["The picture is completely transparent — there is nothing to show."];

  const out: string[] = [];
  const under = (h - 1 - maxY) / h;
  const over = minY / h;
  if (under > 0.02) {
    out.push(
      `There is empty space under his feet (${Math.round(under * 100)}% of the height), so he would float above the floor. Crop the picture to his feet.`,
    );
  }
  if (over > 0.04) {
    out.push(
      `There is empty space above his head (${Math.round(over * 100)}% of the height), so he would stand shorter than Limon does now. Crop to the top of the head.`,
    );
  }
  return out;
}

function CutoutCheck({ src }: { src: string }) {
  const [report, setReport] = useState<string[] | null>(null);
  const url = useMemo(() => {
    const r = resolveImage(src);
    return r.kind === "url" ? r.url : null;
  }, [src]);

  useEffect(() => {
    setReport(null);
    if (!url) return;
    let alive = true;
    void inspectCutout(url).then((r) => {
      if (alive) setReport(r);
    });
    return () => {
      alive = false;
    };
  }, [url]);

  if (!report) return null;
  if (report.length === 0) {
    return (
      <p className="flex items-start gap-1.5 font-ui text-[12px] leading-[1.45] text-mute">
        <Check size={13} className="mt-[2px] shrink-0" />
        Transparent cut-out, standing on the floor — he will stand where Limon stands now.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {report.map((line) => (
        <li
          key={line}
          className="flex items-start gap-1.5 font-ui text-[12px] leading-[1.45] text-acid-type"
        >
          <AlertTriangle size={13} className="mt-[2px] shrink-0" />
          {line}
        </li>
      ))}
    </ul>
  );
}
