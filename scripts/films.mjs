/**
 * PLACEHOLDER film generator.
 *
 * The label page features three music videos, and the theatre that plays
 * them chooses between 4K, HD and SD encodes — so it needs real files to be
 * built and checked against. There is no footage in this repo, and the
 * honest stand-in for a film nobody has delivered yet is an obvious one: a
 * slow camera move across each release's own artwork, cut to that track's
 * placeholder audio (scripts/audio.mjs), at a true 3840×2160.
 *
 * When the real films arrive, either drop them into public/video/ under the
 * same names, or set their addresses in the admin (Label → Music videos) —
 * and delete this script and its package.json entry.
 *
 * Needs ffmpeg on the PATH. Not part of dev or build: an encode of three 4K
 * films takes a minute or two, and an absent ffmpeg must never fail a
 * deploy. Run it by hand:  bun run films   (add --if-missing to skip files
 * that already exist).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "video");
const ASSETS = join(ROOT, "src", "assets");
const AUDIO = join(ROOT, "public", "audio");

/** Each film: three stills in order, and the placeholder audio under them. */
const FILMS = [
  { id: "rusted-gold", stills: ["release-01-flat", "release-01-detail", "release-01"] },
  { id: "terminus", stills: ["release-04-flat", "release-04-detail", "release-04"] },
  { id: "park-circus", stills: ["release-06-flat", "release-06-detail", "release-06"] },
];

/* Three 3.2s shots with 0.6s dissolves: 8.4s. Long enough to scrub and to
 * switch quality mid-play, short enough that three 4K files stay small. */
const SHOT = 3.2;
const DISSOLVE = 0.6;
const LENGTH = SHOT * 3 - DISSOLVE * 2;

const probe = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
if (probe.error || probe.status !== 0) {
  console.warn("films: ffmpeg not found — skipping. Install it to build the placeholder films.");
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
const ifMissing = process.argv.includes("--if-missing");

for (const film of FILMS) {
  const out = join(OUT, `${film.id}-2160.mp4`);
  if (ifMissing && existsSync(out)) {
    console.log(`films: ${film.id} present, skipping`);
    continue;
  }

  const inputs = film.stills.flatMap((s) => [
    "-loop",
    "1",
    "-t",
    String(SHOT),
    "-i",
    join(ASSETS, `${s}.jpg`),
  ]);

  /* Shot 1 drifts down the portrait still, shot 2 drifts back up the
   * detail, shot 3 pushes across the square cover. Every frame is cut at
   * 3840×2160 — the sources are upscaled, which is the placeholder part;
   * the container, the codec level and the frame size are the real thing. */
  const W = 3840;
  const H = 2160;
  const graph = [
    `[0:v]scale=${W}:-2,crop=${W}:${H}:0:'(ih-${H})*t/${SHOT}',setsar=1,fps=24,format=yuv420p[a0]`,
    `[1:v]scale=${W}:-2,crop=${W}:${H}:0:'(ih-${H})*(1-t/${SHOT})',setsar=1,fps=24,format=yuv420p[a1]`,
    `[2:v]scale=-2:${H},scale=${W}*1.12:-2,crop=${W}:${H}:'(iw-${W})*t/${SHOT}':'(ih-${H})/2',setsar=1,fps=24,format=yuv420p[a2]`,
    `[a0][a1]xfade=transition=fade:duration=${DISSOLVE}:offset=${SHOT - DISSOLVE}[x1]`,
    `[x1][a2]xfade=transition=fade:duration=${DISSOLVE}:offset=${(SHOT - DISSOLVE) * 2},` +
      `fade=t=in:st=0:d=0.5,fade=t=out:st=${LENGTH - 0.6}:d=0.6,format=yuv420p[v]`,
    `[3:a]atrim=0:${LENGTH},afade=t=in:d=0.4,afade=t=out:st=${LENGTH - 0.8}:d=0.8,aresample=48000[au]`,
  ].join(";");

  const args = [
    "-v",
    "error",
    "-y",
    ...inputs,
    "-stream_loop",
    "1",
    "-i",
    join(AUDIO, `${film.id}.wav`),
    "-filter_complex",
    graph,
    "-map",
    "[v]",
    "-map",
    "[au]",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "31",
    "-profile:v",
    "high",
    "-level",
    "5.1",
    "-tag:v",
    "avc1",
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-b:a",
    "96k",
    "-ac",
    "2",
    out,
  ];

  const run = spawnSync("ffmpeg", args, { stdio: ["ignore", "inherit", "inherit"] });
  if (run.status !== 0) {
    console.error(`films: ${film.id} failed`);
    process.exit(1);
  }
  console.log(`films: ${film.id}-2160.mp4  ${(statSync(out).size / 1024 / 1024).toFixed(2)} MB`);
}
