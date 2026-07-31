import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { tracks, type Track } from "@/data/tracks";

type PlayerState = {
  track: Track | null;
  playing: boolean;
  time: number;
  duration: number;
  /** the audio failed to load — the UI says so rather than pretending */
  failed: boolean;
  play: (id: string) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  step: (delta: number) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
};

const Ctx = createContext<PlayerState | null>(null);

/**
 * One <audio> element for the whole site, owned above the router.
 *
 * That placement is the entire point: playing a track on /label and then
 * navigating to /shop must not stop the music, and it cannot survive if the
 * element is unmounted with the route.
 *
 * Never autoplays — playback only ever starts from a user gesture.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  const play = useCallback(
    (id: string) => {
      const t = tracks.find((x) => x.id === id);
      if (!t) return;
      const el = ref.current;
      if (!el) return;

      if (track?.id === id) {
        if (el.paused) void el.play().catch(() => setFailed(true));
        else el.pause();
        return;
      }
      setFailed(false);
      setTrack(t);
      setTime(0);
      setDuration(0);
      el.src = t.src;
      void el.play().catch(() => setFailed(true));
    },
    [track],
  );

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el || !track) return;
    if (el.paused) void el.play().catch(() => setFailed(true));
    else el.pause();
  }, [track]);

  const seek = useCallback((s: number) => {
    const el = ref.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = Math.max(0, Math.min(el.duration, s));
    setTime(el.currentTime);
  }, []);

  const step = useCallback(
    (delta: number) => {
      const el = ref.current;
      if (!el) return;
      seek(el.currentTime + delta);
    },
    [seek],
  );

  const jump = useCallback(
    (dir: 1 | -1) => {
      if (!track) return;
      const i = tracks.findIndex((t) => t.id === track.id);
      const nextTrack = tracks[(i + dir + tracks.length) % tracks.length];
      play(nextTrack.id);
    },
    [track, play],
  );

  const stop = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setTrack(null);
    setPlaying(false);
    setTime(0);
    setDuration(0);
  }, []);

  const value = useMemo<PlayerState>(
    () => ({
      track,
      playing,
      time,
      duration,
      failed,
      play,
      toggle,
      seek,
      step,
      next: () => jump(1),
      prev: () => jump(-1),
      stop,
    }),
    [track, playing, time, duration, failed, play, toggle, seek, step, jump, stop],
  );

  return (
    <Ctx.Provider value={value}>
      <audio
        ref={ref}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
      />
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer must be used inside PlayerProvider");
  return c;
}

/** mm:ss, always two digits, for tabular-nums readouts */
export function clock(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/* Keyboard transport is bound on the player's own focusable group in
 * LabelPlayer rather than on window — a global space-bar handler would
 * hijack the key for the whole page. */
