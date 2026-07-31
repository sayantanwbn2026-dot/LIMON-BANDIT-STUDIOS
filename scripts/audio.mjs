/**
 * PLACEHOLDER audio generator.
 *
 * The label player decodes real audio to draw its waveform, so it needs real
 * files to work against. There are no masters in this repo, and inventing
 * "music" for a label's roster would be worse than an obvious placeholder —
 * so this synthesises short, clearly-synthetic clips with enough dynamics
 * that the waveform is meaningful to look at.
 *
 * Output is gitignored and regenerated on dev/build, exactly like the images
 * and the fonts. When real masters arrive: drop them into public/audio/ under
 * the same filenames, delete this script and its package.json entry.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "audio");
mkdirSync(OUT, { recursive: true });

const RATE = 16000;
const SECONDS = 6;

/** deterministic noise so a rebuild produces byte-identical files */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
}

function render({ seed, bpm, bassHz, bright }) {
  const n = RATE * SECONDS;
  const out = new Float32Array(n);
  const noise = rng(seed);
  const beat = (60 / bpm) * RATE;

  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const inBeat = i % beat;
    const phase = inBeat / beat;

    // kick: pitch-swept sine with a fast decay
    const kEnv = Math.exp(-phase * 18);
    const kick = Math.sin(2 * Math.PI * (bassHz + 60 * Math.exp(-phase * 30)) * t) * kEnv * 0.7;

    // offbeat hat: filtered noise
    const hOn = phase > 0.48 && phase < 0.6 ? 1 : 0;
    const hat = noise() * Math.exp(-(phase - 0.48) * 60) * hOn * bright * 0.25;

    // sustained bass under it all
    const bass = Math.sin(2 * Math.PI * bassHz * 0.5 * t) * 0.18;

    // whole-clip arc so the waveform is not a flat block
    const arc = 0.55 + 0.45 * Math.sin(Math.PI * (t / SECONDS));

    out[i] = Math.max(-1, Math.min(1, (kick + hat + bass) * arc));
  }
  return out;
}

/** 16-bit mono PCM WAV — no encoder dependency, every browser plays it */
function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE((samples[i] * 32767) | 0, i * 2);

  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write("WAVE", 8);
  head.write("fmt ", 12);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20); // PCM
  head.writeUInt16LE(1, 22); // mono
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

/** ids match src/data/tracks.ts, which mirrors the roster in releases.ts */
const TRACKS = [
  { id: "rusted-gold", seed: 12345, bpm: 92, bassHz: 55, bright: 1.0 },
  { id: "terminus", seed: 777, bpm: 128, bassHz: 48, bright: 1.4 },
  { id: "park-circus", seed: 2468, bpm: 74, bassHz: 62, bright: 0.6 },
];

const skip = process.argv.includes("--if-missing");
let wrote = 0;
for (const t of TRACKS) {
  const p = join(OUT, `${t.id}.wav`);
  if (skip && existsSync(p)) continue;
  const buf = wav(render(t));
  writeFileSync(p, buf);
  wrote++;
  console.log(`  ${t.id}.wav  ${(buf.length / 1024).toFixed(0)} KB`);
}
console.log(wrote ? `generated ${wrote} placeholder clips` : "audio: all clips present, skipping");
