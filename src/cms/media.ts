import { getSupabase } from "@/lib/supabase";
import { images, type ImageKey } from "@/generated/images";

/**
 * Images in the CMS.
 *
 * A stored image value is one of three things, and `resolveImage` is the only
 * place that has to know which:
 *
 *   - `""`            — nothing chosen yet
 *   - `"room-a"`      — a key into the build-time manifest, which is what the
 *                       seeded content uses and what `<Picture>` renders with
 *                       AVIF/WebP variants
 *   - `"https://…"`   — an uploaded or pasted URL, rendered as a plain `<img>`
 *
 * Keeping all three valid is what lets the CMS ship without re-encoding the
 * existing artwork: the site keeps its optimised pipeline for everything
 * nobody has touched, and anything an editor replaces becomes a URL.
 */

export const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
export const ACCEPTED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];
export const ACCEPT_ATTR = ACCEPTED.join(",");

/* ---------------- video ----------------
 *
 * One slot uses video: the opening sequence. It is the first thing a
 * visitor downloads and the only thing between them and the site, so the
 * rules here are tighter than for a picture and they are tight on purpose.
 *
 * MP4 (H.264) first, because it is the one format that plays everywhere
 * without a second encode. WebM is accepted for anyone who prefers it.
 * MOV is accepted because it is what a phone and a camera produce, and
 * refusing the file an editor actually has is how a slot stays empty.
 *
 * The byte ceiling is 24 MB, but 24 MB is not the target: a 10-second
 * opener wants to be 3–6 MB or it is still arriving when it should be
 * leaving. The picker says so, loudly, above 8 MB.
 */
export const VIDEO_ACCEPTED = ["video/mp4", "video/webm", "video/quicktime"];
export const VIDEO_ACCEPT_ATTR = VIDEO_ACCEPTED.join(",");
export const VIDEO_MAX_BYTES = 24 * 1024 * 1024;
/** Over this, the file is big enough to be the reason the site feels slow. */
export const VIDEO_BUDGET_BYTES = 8 * 1024 * 1024;
/** The hard ceiling on an opening sequence, in seconds. */
export const VIDEO_MAX_SECONDS = 10;

export type VideoProbe = { width: number; height: number; duration: number };

/** Read a video's real size and length in the browser, before uploading. */
export function probeVideo(file: File): Promise<VideoProbe | null> {
  const url = URL.createObjectURL(file);
  return probeVideoElement(url).finally(() => URL.revokeObjectURL(url));
}

/** Same, for a URL someone pasted. */
export function probeVideoUrl(url: string): Promise<VideoProbe | null> {
  return probeVideoElement(url, true);
}

function probeVideoElement(src: string, crossOrigin = false): Promise<VideoProbe | null> {
  return new Promise((resolve) => {
    const el = document.createElement("video");
    if (crossOrigin) el.crossOrigin = "anonymous";
    el.preload = "metadata";
    el.muted = true;
    /* Metadata only — the whole file is not needed to learn how long it is,
     * and an editor on a phone tether should not pay for it twice. */
    el.onloadedmetadata = () =>
      resolve({
        width: el.videoWidth,
        height: el.videoHeight,
        duration: Number.isFinite(el.duration) ? el.duration : 0,
      });
    el.onerror = () => resolve(null);
    el.src = src;
  });
}

/**
 * Upload a video into the same public bucket as the pictures.
 *
 * `cms_media` has columns for width and height and none for duration, so
 * the length is measured in the picker and reported there rather than
 * stored. Nothing downstream needs it: the sequence is capped at ten
 * seconds when it plays, whatever the file turns out to be.
 */
export async function uploadVideo(file: File): Promise<UploadResult> {
  if (file.size > VIDEO_MAX_BYTES) {
    return {
      ok: false,
      message: `That file is ${humanBytes(file.size)}. The limit is 24 MB, and an opening sequence really wants to be under 6 — export it smaller.`,
    };
  }
  if (!VIDEO_ACCEPTED.includes(file.type)) {
    return {
      ok: false,
      message: `${file.type || "That file type"} is not a video the site can play. Use MP4 (H.264), WebM or MOV.`,
    };
  }

  const supabase = await getSupabase();
  if (!supabase) return { ok: false, message: "Not connected to the database." };

  const path = `cms/${safeName(file.name)}`;
  const { error: upErr } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (upErr) return { ok: false, message: upErr.message };

  const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
  const probe = await probeVideo(file);

  const { data, error } = await supabase
    .from("cms_media")
    .insert({
      url: pub.publicUrl,
      kind: "upload",
      storage_path: path,
      filename: file.name,
      mime: file.type,
      bytes: file.size,
      width: probe?.width ?? null,
      height: probe?.height ?? null,
      alt: "",
    })
    .select()
    .single();

  if (error || !data) {
    await supabase.storage.from("media").remove([path]);
    return { ok: false, message: error?.message ?? "Could not record the upload." };
  }
  return { ok: true, row: data as MediaRow };
}

export type ResolvedImage =
  | { kind: "none" }
  | { kind: "manifest"; key: ImageKey; width: number; height: number }
  | { kind: "url"; url: string };

export function resolveImage(value: unknown): ResolvedImage {
  if (typeof value !== "string" || !value.trim()) return { kind: "none" };
  const v = value.trim();
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/")) {
    return { kind: "url", url: v };
  }
  if (v in images) {
    const entry = images[v as ImageKey];
    return { kind: "manifest", key: v as ImageKey, width: entry.width, height: entry.height };
  }
  /* An unknown non-URL string is a stale manifest key — an image that was
   * removed from src/assets. Treat it as empty rather than crashing the
   * section that renders it. */
  return { kind: "none" };
}

export type MediaRow = {
  id: string;
  url: string;
  kind: "upload" | "external";
  storage_path: string | null;
  filename: string | null;
  mime: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  created_at: string;
};

export function humanBytes(n: number | null | undefined): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Read a file's real pixel dimensions in the browser before uploading.
 *
 * The CMS tells an editor what resolution a slot wants, so it has to be able
 * to say what they actually supplied. SVG has no intrinsic raster size, so it
 * returns nulls rather than a guess.
 */
export function probeDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (file.type === "image/svg+xml") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Same, for a URL someone pasted. Cross-origin images still report size. */
export function probeUrl(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : "bin";
  const stem = (dot > -1 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const stamp = Date.now().toString(36);
  return `${stem || "image"}-${stamp}.${ext}`;
}

export type UploadResult = { ok: true; row: MediaRow } | { ok: false; message: string };

/** Upload a file from the editor's device into the public `media` bucket. */
export async function uploadFile(file: File, alt = ""): Promise<UploadResult> {
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: `That file is ${humanBytes(file.size)}. The limit is 20 MB — try exporting it smaller.`,
    };
  }
  if (!ACCEPTED.includes(file.type)) {
    return {
      ok: false,
      message: `${file.type || "That file type"} is not an image the site can use.`,
    };
  }

  const supabase = await getSupabase();
  if (!supabase) return { ok: false, message: "Not connected to the database." };

  const path = `cms/${safeName(file.name)}`;
  const { error: upErr } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });

  if (upErr) return { ok: false, message: upErr.message };

  const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
  const dims = await probeDimensions(file);

  const { data, error } = await supabase
    .from("cms_media")
    .insert({
      url: pub.publicUrl,
      kind: "upload",
      storage_path: path,
      filename: file.name,
      mime: file.type,
      bytes: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      alt,
    })
    .select()
    .single();

  if (error || !data) {
    /* The bytes are in the bucket but the row failed, which would leave an
     * orphan nobody can find. Take the file back out. */
    await supabase.storage.from("media").remove([path]);
    return { ok: false, message: error?.message ?? "Could not record the upload." };
  }

  return { ok: true, row: data as MediaRow };
}

/** Register an image the site does not host. Nothing is copied. */
export async function addExternal(url: string, alt = ""): Promise<UploadResult> {
  const trimmed = url.trim();
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    return {
      ok: false,
      message: "That does not look like a web address. It should start with https://",
    };
  }

  const supabase = await getSupabase();
  if (!supabase) return { ok: false, message: "Not connected to the database." };

  const dims = await probeUrl(trimmed);

  const { data, error } = await supabase
    .from("cms_media")
    .insert({
      url: trimmed,
      kind: "external",
      filename: trimmed.split("/").pop() ?? null,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      alt,
    })
    .select()
    .single();

  if (error || !data) return { ok: false, message: error?.message ?? "Could not save that link." };
  return { ok: true, row: data as MediaRow };
}

export async function listMedia(limit = 200): Promise<MediaRow[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cms_media")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("cms: could not list media", error);
    return [];
  }
  return (data ?? []) as MediaRow[];
}

/** Remove a media row, and the stored object too when we own it. */
export async function deleteMedia(row: MediaRow): Promise<string | null> {
  const supabase = await getSupabase();
  if (!supabase) return "Not connected to the database.";
  if (row.kind === "upload" && row.storage_path) {
    const { error } = await supabase.storage.from("media").remove([row.storage_path]);
    if (error) return error.message;
  }
  const { error } = await supabase.from("cms_media").delete().eq("id", row.id);
  return error ? error.message : null;
}

/**
 * How far off the expected resolution a supplied image is.
 *
 * Aspect ratio matters more than absolute size: a 2000px-wide image in a
 * 1600px slot is fine and will simply be downscaled, but a square image in a
 * 16:9 slot will be cropped and the editor should be told before it ships.
 */
export function fitReport(
  actual: { width: number; height: number } | null,
  want: { width: number; height: number },
): { level: "ok" | "warn" | "bad"; message: string } {
  if (!actual) return { level: "ok", message: "" };

  const wantRatio = want.width / want.height;
  const gotRatio = actual.width / actual.height;
  const ratioOff = Math.abs(gotRatio - wantRatio) / wantRatio;

  if (ratioOff > 0.12) {
    return {
      level: "bad",
      message: `This is ${actual.width}×${actual.height}, a different shape to the ${want.width}×${want.height} this slot expects. It will be cropped.`,
    };
  }
  if (actual.width < want.width * 0.75) {
    return {
      level: "warn",
      message: `This is ${actual.width}×${actual.height} — smaller than the ${want.width}×${want.height} this slot expects, so it may look soft.`,
    };
  }
  return { level: "ok", message: `${actual.width}×${actual.height}` };
}
