/**
 * Placeholder product galleries, until there is real photography.
 *
 * A product page needs several shots of the same object — the whole thing,
 * then closer. There is one merch photograph in this repository, so the
 * alternative was a gallery of unrelated room pictures, which reads as a
 * mistake rather than as a product.
 *
 * So each product's own source image is cropped twice: a detail (the middle,
 * closer in) and a flat (a wider, off-centre frame). Both are genuinely
 * different views of the same picture, which is what a gallery is for, and
 * both are obviously placeholders to anyone who knows the shop.
 *
 * DELETE THIS SCRIPT when the real shoot lands: drop the photographs in
 * src/assets, run `bun run images`, and point the galleries in
 * src/data/shop.ts at them.
 *
 *   bun run scripts/product-shots.mjs
 *
 * Then `bun run images` to fold them into the manifest.
 */
import { readdir, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ASSETS = path.join(process.cwd(), "src", "assets");

/** Every source a product currently points at (see src/data/shop.ts). */
const SOURCES = [
  "merch-tee",
  "room-lockout",
  "room-booth",
  "room-b",
  "room-a",
  "wall-01",
  "wall-02",
  "wall-03",
  "wall-04",
  "wall-05",
  "split-corridor",
  "release-01",
  "release-02",
  "release-03",
  "release-04",
  "release-05",
  "release-06",
];

/* Portrait, matching the shape the catalogue and the gallery ask for. */
const OUT = { width: 1000, height: 1250 };

/** A centred box covering `scale` of the shorter side, nudged by `dx`/`dy`. */
function box(meta, scale, dx = 0, dy = 0) {
  const side = Math.round(Math.min(meta.width, meta.height) * scale);
  const left = Math.round((meta.width - side) / 2 + meta.width * dx);
  const top = Math.round((meta.height - side) / 2 + meta.height * dy);
  return {
    left: Math.max(0, Math.min(left, meta.width - side)),
    top: Math.max(0, Math.min(top, meta.height - side)),
    width: side,
    height: side,
  };
}

async function sourceFile(name) {
  for (const ext of [".jpg", ".jpeg", ".png"]) {
    const file = path.join(ASSETS, name + ext);
    try {
      await access(file);
      return file;
    } catch {
      /* try the next extension */
    }
  }
  return null;
}

let made = 0;
for (const name of SOURCES) {
  const file = await sourceFile(name);
  if (!file) {
    console.warn(`skipped ${name} — no source in src/assets`);
    continue;
  }
  const meta = await sharp(file).metadata();

  /* Closer, and high: the "detail" shot.
   *
   * Not the centre. A black tee on a grey wall has nothing in the middle of
   * it but black — the first version of this produced a rectangle of
   * nothing. The top of the frame is where the collar, the hanger and the
   * label are, and on a record sleeve it is where the print is. */
  await sharp(file)
    .extract(box(meta, 0.62, 0, -0.14))
    .resize(OUT.width, OUT.height, { fit: "cover" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(ASSETS, `${name}-detail.jpg`));

  /* Wider and off-centre: the "flat" shot. */
  await sharp(file)
    .extract(box(meta, 0.92, -0.03, 0.02))
    .resize(OUT.width, OUT.height, { fit: "cover" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(ASSETS, `${name}-flat.jpg`));

  made += 2;
}

const all = await readdir(ASSETS);
console.log(`wrote ${made} placeholder shots; src/assets now holds ${all.length} files`);
