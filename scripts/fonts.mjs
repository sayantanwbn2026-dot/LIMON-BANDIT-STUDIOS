/**
 * Font pipeline — self-host and subset.
 *
 * Before this, Sora came from fonts.googleapis.com and Switzer from
 * api.fontshare.com: two extra DNS lookups, two TLS handshakes and two
 * render-blocking stylesheets before a single glyph could draw.
 *
 * Sora is taken verbatim from Google's per-range woff2 — those are already
 * optimally subset, and re-subsetting them gains nothing.
 * Switzer is served complete by Fontshare (~4 full weights), so it is subset
 * here to the glyphs this site actually sets.
 *
 * Run: bun run fonts
 */
import subsetFont from "subset-font";
import { openSync } from "fontkit";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "fonts");
const CSS_OUT = join(ROOT, "src", "generated", "fonts.css");

mkdirSync(OUT, { recursive: true });
mkdirSync(dirname(CSS_OUT), { recursive: true });

/* The faces this script is expected to produce. Declared up front so
 * `--if-missing` can decide without touching the network — dev and build run
 * this on every start, and neither should need connectivity once the fonts
 * are on disk. */
const EXPECTED = [
  "sora-700.woff2",
  "sora-800.woff2",
  "switzer-400.woff2",
  "switzer-500.woff2",
  "switzer-600.woff2",
  "switzer-700.woff2",
];

if (process.argv.includes("--if-missing")) {
  const haveAll = existsSync(CSS_OUT) && EXPECTED.every((f) => existsSync(join(OUT, f)));
  if (haveAll) {
    console.log("fonts: all faces present, skipping (run `bun run fonts` to refresh)");
    process.exit(0);
  }
}

/* A modern UA is required or Google serves ttf instead of woff2. */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * The glyph set Switzer is cut down to. ASCII, the Latin-1 letters (roster and
 * crew names carry accents), and every symbol the site actually sets. Adding
 * copy with a glyph outside this list will render in the fallback face — so
 * the list is deliberately generous, and this comment is the warning.
 */
const KEEP =
  " !\"#$%&'()*+,-./0123456789:;<=>?@" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`" +
  "abcdefghijklmnopqrstuvwxyz{|}~" +
  " ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿" +
  "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞß" +
  "àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ" +
  "ŁłŚśŠšŸŽžŒœ" +
  "–—‘’“”†…‰′″" +
  "‹›⁄⁒€₹™" +
  "←↑→↓↔−∕✱●■";

async function get(url, asText = false) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return asText ? res.text() : Buffer.from(await res.arrayBuffer());
}

/** Pull every @font-face's woff2 url + weight + unicode-range out of a CSS payload. */
function parseFaces(css) {
  const faces = [];
  for (const block of css.split("@font-face").slice(1)) {
    /* Google emits bare https urls; Fontshare emits quoted protocol-relative
     * ones. Accept both, and normalise the protocol. */
    const m = block.match(/src:[^;]*?url\(\s*['"]?((?:https:)?\/\/[^)'"\s]+\.woff2)['"]?\s*\)/);
    if (!m) continue;
    faces.push({
      url: m[1].startsWith("//") ? `https:${m[1]}` : m[1],
      weight: block.match(/font-weight:\s*(\d+)/)?.[1] ?? "400",
      range: block.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim() ?? null,
      style: /font-style:\s*italic/.test(block) ? "italic" : "normal",
    });
  }
  return faces;
}

const emitted = [];

/* ---------------- Sora: verbatim, latin range only ---------------- */
const soraCss = await get(
  "https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap",
  true,
);
const soraFaces = parseFaces(soraCss).filter(
  // the latin block is the one carrying basic ASCII (U+0000-00FF)
  (f) => f.range && f.range.includes("U+0000-00FF"),
);
if (soraFaces.length === 0) throw new Error("no latin Sora faces found — Google CSS shape changed");

for (const f of soraFaces) {
  const original = await get(f.url);
  /* Google's latin cut is already small, but it still carries glyphs this
   * site never sets. Subsetting it to the real corpus roughly halves it. */
  const subset = await subsetFont(original, KEEP, { targetFormat: "woff2" });
  const name = `sora-${f.weight}.woff2`;
  writeFileSync(join(OUT, name), subset);
  emitted.push({
    family: "Sora",
    weight: f.weight,
    file: name,
    size: subset.length,
    was: original.length,
  });
}

/* ---------------- Switzer: subset ---------------- */
const switzerCss = await get(
  "https://api.fontshare.com/v2/css?f%5B%5D=switzer@400,500,600,700&display=swap",
  true,
);
for (const f of parseFaces(switzerCss)) {
  if (f.style !== "normal") continue;
  if (!["400", "500", "600", "700"].includes(f.weight)) continue;
  const original = await get(f.url);
  const subset = await subsetFont(original, KEEP, { targetFormat: "woff2" });
  const name = `switzer-${f.weight}.woff2`;
  writeFileSync(join(OUT, name), subset);
  emitted.push({
    family: "Switzer",
    weight: f.weight,
    file: name,
    size: subset.length,
    was: original.length,
  });
}

/* ---------------- metrics for the adjusted fallback ----------------
 *
 * Ascent / descent / line-gap come straight from the font's own tables and
 * are trustworthy — they define the line box, which is what actually causes
 * layout shift on swap.
 *
 * size-adjust does NOT come from OS/2 xAvgCharWidth. That derivation was
 * tried first and produced 130.95% for Sora when the real rendered ratio
 * against Arial is 95.72% — wrong by a third, and in the wrong direction,
 * because xAvgCharWidth averages every glyph in the face (including the wide
 * ones this site never sets) and survives subsetting unchanged. A wrong
 * size-adjust is worse than none, so these are measured: each family rendered
 * against Arial on a canvas at the same size and weight, in the browser.
 * Re-measure if either family is ever replaced. */
/* Calibrated against the fallback itself, not against Arial. Measuring
 * webfont-vs-Arial is unreliable at 700/800 because Arial has no such weight
 * and the browser synthesises a wider faux-bold. These are the values at
 * which the *rendered* Fallback/webfont width ratio converges on 1.0, at the
 * weights that actually appear above the fold (Sora 800, Switzer 500). */
const SIZE_ADJUST = {
  Sora: 1.1572,
  Switzer: 1.0105,
};

function metricsFor(file, family) {
  const font = openSync(join(OUT, file));
  const upm = font.unitsPerEm;
  return {
    ascent: font.ascent / upm,
    descent: Math.abs(font.descent) / upm,
    lineGap: (font.lineGap ?? 0) / upm,
    sizeAdjust: SIZE_ADJUST[family],
  };
}

const pct = (n) => `${(n * 100).toFixed(2)}%`;
let css = `/* GENERATED by scripts/fonts.mjs — do not edit. Run \`bun run fonts\`. */\n\n`;

for (const e of emitted) {
  /* No unicode-range: both families are subset to one file per weight, so a
   * range would only risk excluding a glyph the file actually contains. */
  css += `@font-face {\n  font-family: "${e.family}";\n  font-style: normal;\n  font-weight: ${e.weight};\n  font-display: swap;\n  src: url("/fonts/${e.file}") format("woff2");\n}\n\n`;
}

/* One adjusted fallback per family: same box as the real face, so the swap
 * does not reflow. The hero measures BANDIT against document.fonts.ready and
 * a mismatched fallback makes that fit visibly jump. */
for (const family of ["Sora", "Switzer"]) {
  const first = emitted.find((e) => e.family === family);
  const m = metricsFor(first.file, family);
  css += `@font-face {\n  font-family: "${family} Fallback";\n  src: local("Arial"), local("Helvetica"), local("Liberation Sans");\n  ascent-override: ${pct(m.ascent)};\n  descent-override: ${pct(m.descent)};\n  line-gap-override: ${pct(m.lineGap)};\n  size-adjust: ${pct(m.sizeAdjust)};\n}\n\n`;
}

writeFileSync(CSS_OUT, css, "utf8");

const total = emitted.reduce((a, e) => a + e.size, 0);
console.log("family   weight   file                    size");
for (const e of emitted) {
  const was = e.was ? `  (from ${(e.was / 1024).toFixed(1)} KB)` : "";
  console.log(
    `${e.family.padEnd(9)}${e.weight.padEnd(9)}${e.file.padEnd(24)}${(e.size / 1024).toFixed(1).padStart(6)} KB${was}`,
  );
}
console.log(`\n${emitted.length} faces, total ${(total / 1024).toFixed(1)} KB (budget 90 KB)`);
if (total > 90 * 1024) console.log("!! OVER BUDGET");
