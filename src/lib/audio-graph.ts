/**
 * The room the track is playing in.
 *
 * Every label site has a play button and a waveform. This one can put a
 * record back into the building it was cut in: the same audio, convolved
 * against an impulse response shaped like The Booth, Room A, or the whole
 * house with the doors open. It is the one thing a studio's label site can
 * do that Bandcamp cannot, and it is the reason to sit on this page rather
 * than to skim it.
 *
 * HONESTY, WHICH MATTERS MORE THAN THE EFFECT
 * The impulses below are MODELLED, not measured. Nobody fired a starter
 * pistol in Room A and recorded the tail. They are built from decaying
 * noise with early reflections placed at plausible distances, and they are
 * labelled in the UI as models. If a real impulse response ever lands at
 * one of the IR_FILES paths, it is used instead and the model is dropped —
 * that is the whole upgrade, no other change. Until then nothing is fetched
 * and nothing 404s.
 *
 * SAFETY, WHICH MATTERS MORE THAN EITHER
 * Routing a media element through Web Audio is a one-way door: once
 * `createMediaElementSource` is called, the element's sound ONLY comes out
 * of the graph, so a broken graph is a silent site. Every path here is
 * wrapped, the source is created at most once per element, and if anything
 * at all throws, `attach` gives up permanently and leaves the element
 * playing to the speakers by itself. Losing the rooms is a disappointment;
 * losing the audio is a bug.
 */

export type RoomId = "dry" | "booth" | "room-a" | "lockout";

export type Room = {
  id: RoomId;
  label: string;
  /** what it is, in one line, for the control's caption */
  note: string;
  /** seconds of tail; 0 means no convolution at all */
  decay: number;
  /** how much of the wet path to mix in, 0–1 */
  wet: number;
  /** pre-delay in seconds — how far the first wall is */
  predelay: number;
};

export const ROOMS: Room[] = [
  { id: "dry", label: "Dry", note: "Straight off the master.", decay: 0, wet: 0, predelay: 0 },
  {
    id: "booth",
    label: "The Booth",
    note: "One voice, close walls, nothing to hide behind.",
    decay: 0.38,
    wet: 0.22,
    predelay: 0.006,
  },
  {
    id: "room-a",
    label: "Room A",
    note: "The live room — wood, six players, a real tail.",
    decay: 1.35,
    wet: 0.34,
    predelay: 0.018,
  },
  {
    id: "lockout",
    label: "The Lockout",
    note: "The whole house with the doors open.",
    decay: 2.6,
    wet: 0.42,
    predelay: 0.034,
  },
];

/**
 * Real impulse responses, if they ever exist. Leave a path empty and the
 * model is used; nothing is requested, so there is no 404 on load.
 *
 *   public/audio/ir-room-a.wav  →  "/audio/ir-room-a.wav"
 */
const IR_FILES: Partial<Record<RoomId, string>> = {
  // "room-a": "/audio/ir-room-a.wav",
};

type Graph = {
  ctx: AudioContext;
  analyser: AnalyserNode;
  master: GainNode;
  dry: GainNode;
  wet: GainNode;
  convolver: ConvolverNode;
  predelay: DelayNode;
};

let graph: Graph | null = null;
let boundTo: HTMLAudioElement | null = null;
/** Once true, we never touch Web Audio again for the life of the page. */
let dead = false;

const irCache = new Map<RoomId, AudioBuffer>();

/**
 * A modelled room: noise under an exponential decay, with a handful of
 * early reflections in front of it.
 *
 * The early reflections are what stop it sounding like a reverb plugin on
 * its default preset — a real room answers with a few distinct slaps before
 * it smears, and the ear reads those slaps as size.
 */
function modelIR(ctx: AudioContext, room: Room): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * room.decay));
  const buf = ctx.createBuffer(2, length, rate);

  /* Deterministic, so the same room sounds the same every visit. */
  let seed = 0x9e3779b9 ^ Math.floor(room.decay * 1000);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 4294967296) * 2 - 1;
  };

  /* Distances in seconds — first wall, far wall, ceiling. Scaled by the
   * room's size so a booth slaps early and the house takes its time. */
  const taps = [0.011, 0.019, 0.031, 0.047].map((t) => t * (0.5 + room.decay));

  for (let c = 0; c < 2; c++) {
    const out = buf.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      /* Exponential decay, steeper in a small room. */
      out[i] = rand() * Math.pow(1 - t, 2.2 + room.decay * 0.6);
    }
    for (let k = 0; k < taps.length; k++) {
      /* Offset one channel so the room has a width rather than a centre. */
      const at = Math.floor((taps[k] + (c === 1 ? 0.0021 : 0)) * rate);
      if (at < length) out[at] += (k % 2 ? -1 : 1) * (0.55 / (k + 1));
    }
  }
  return buf;
}

async function irFor(ctx: AudioContext, room: Room): Promise<AudioBuffer | null> {
  if (room.decay <= 0) return null;
  const hit = irCache.get(room.id);
  if (hit) return hit;

  const url = IR_FILES[room.id];
  if (url) {
    try {
      const bytes = await fetch(url).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      });
      const decoded = await ctx.decodeAudioData(bytes);
      irCache.set(room.id, decoded);
      return decoded;
    } catch {
      /* A missing or broken file falls back to the model rather than
       * leaving the room silent. */
    }
  }

  const made = modelIR(ctx, room);
  irCache.set(room.id, made);
  return made;
}

/**
 * Route the site's one <audio> element through the graph.
 *
 * Call it from a user gesture — browsers hand out a running AudioContext
 * only in response to one. Safe to call repeatedly; it does the work once.
 */
export function attach(el: HTMLAudioElement): boolean {
  if (dead) return false;
  if (graph && boundTo === el) {
    void graph.ctx.resume().catch(() => {});
    return true;
  }
  /* A second element would need a second source node and there is only
   * ever one on this site — but if that changes, refuse rather than throw. */
  if (graph && boundTo !== el) return false;

  try {
    const AC: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) throw new Error("no AudioContext");

    const ctx = new AC();
    const source = ctx.createMediaElementSource(el);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.78;

    const master = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const convolver = ctx.createConvolver();
    const predelay = ctx.createDelay(0.2);

    dry.gain.value = 1;
    wet.gain.value = 0;

    /* The analyser sits AFTER the mix, not on the source.
     *
     * Metering the dry source would have been simpler and would have been
     * a lie: the meters would show the master while the ears hear the
     * room. Post-mix, switching to The Lockout visibly lengthens the tails
     * on the peak-hold markers — the room becomes something you can watch
     * as well as hear, which is the whole point of having both. */
    source.connect(dry).connect(master);
    source.connect(predelay).connect(convolver).connect(wet).connect(master);
    master.connect(analyser);
    master.connect(ctx.destination);

    graph = { ctx, analyser, master, dry, wet, convolver, predelay };
    boundTo = el;
    void ctx.resume().catch(() => {});
    return true;
  } catch {
    /* No graph, no rooms, no spectrum — and the element plays to the
     * speakers exactly as it did before this module existed. */
    dead = true;
    graph = null;
    return false;
  }
}

export function isAttached() {
  return graph !== null;
}

/** Nudge the context awake — Safari suspends it when a tab is hidden. */
export function resume() {
  if (!graph) return;
  if (graph.ctx.state === "suspended") void graph.ctx.resume().catch(() => {});
}

/**
 * Move to a room. Crossfades rather than cutting, because switching rooms
 * mid-bar should sound like a door opening, not like an edit.
 */
export async function setRoom(id: RoomId): Promise<void> {
  const g = graph;
  if (!g) return;
  const room = ROOMS.find((r) => r.id === id) ?? ROOMS[0];

  try {
    if (room.decay > 0) {
      const ir = await irFor(g.ctx, room);
      if (ir) g.convolver.buffer = ir;
      g.predelay.delayTime.value = room.predelay;
    }
    const now = g.ctx.currentTime;
    const ramp = 0.22;
    /* Equal-ish power: the dry side gives up only what the wet side takes,
     * so the track does not dip in the middle of the crossfade. */
    g.wet.gain.cancelScheduledValues(now);
    g.dry.gain.cancelScheduledValues(now);
    g.wet.gain.setTargetAtTime(room.wet, now, ramp / 3);
    g.dry.gain.setTargetAtTime(1 - room.wet * 0.45, now, ramp / 3);
  } catch {
    /* Leave whatever room it was in; the audio keeps playing. */
  }
}

/**
 * Fill `out` with the current spectrum. Returns false when there is no
 * graph, so a visualiser can draw its resting state instead of zeros.
 */
export function levels(out: Uint8Array): boolean {
  if (!graph) return false;
  try {
    graph.analyser.getByteFrequencyData(out as Uint8Array<ArrayBuffer>);
    return true;
  } catch {
    return false;
  }
}

/** How many bins `levels` will fill. */
export function binCount(): number {
  return graph ? graph.analyser.frequencyBinCount : 512;
}
