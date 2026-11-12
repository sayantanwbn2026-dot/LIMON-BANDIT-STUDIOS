import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, hasNavigated } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/smooth";
import { FIRST_FRAME_MS, MAX_MS, videoSources, type PreloaderDoc } from "@/lib/preloader";

/**
 * THE OPENING SEQUENCE, WHEN IT IS A FILM.
 *
 * The level meter is the house's own opener and stays the default. This is
 * the other one: a video an editor uploads, up to ten seconds, one file per
 * device, chosen by the browser rather than by JavaScript (see lib/preloader).
 *
 * WHAT MAKES IT FAST, in order of how much each is worth:
 *
 *   1. It is in the server's HTML. The preload scanner finds the <source>
 *      list in the same pass as the stylesheet and starts the download
 *      before React exists. Nothing here waits for hydration.
 *   2. `preload="auto"` and `fetchPriority="high"` — this IS the page's
 *      most important byte stream for the next two seconds, and the
 *      browser has no way to know that on its own.
 *   3. A poster frame. A still is a few KB against a few MB, so the screen
 *      is composed on the first frame it can paint rather than black until
 *      the video decodes.
 *   4. The bucket is preconnected from the head, so the TLS handshake is
 *      already done when the request goes out.
 *
 * WHAT MAKES IT SAFE. Three separate things end it, and the first one home
 * wins: the film finishing, the ten-second ceiling, and a timer that gives
 * up if no frame has arrived at all. Scroll is unlocked exactly once, from
 * whichever of those (or unmount) gets there first. A visitor must never be
 * held behind a video that is buffering, which is the failure every video
 * splash screen on the web has.
 *
 * IT IS SKIPPABLE, like the meter: click, tap or any key.
 *
 * REDUCED MOTION TAKES IT AWAY ENTIRELY. A full-screen film is the single
 * most motion-heavy thing on the site; somebody who has asked their system
 * for less of that has asked for none of this.
 */
export function PreloaderVideo({ doc }: { doc: PreloaderDoc }) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [gone, setGone] = useState(() => typeof window !== "undefined" && hasNavigated());
  const [leaving, setLeaving] = useState(false);

  const sources = videoSources(doc);
  const poster = doc.poster?.trim() || undefined;
  const fit = doc.fit === "contain" ? "contain" : "cover";

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setGone(true);
      document.documentElement.classList.remove("is-loading");
      return;
    }

    document.documentElement.classList.add("is-loading");
    lockScroll();

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      unlockScroll();
    };

    let exitTimer = 0;
    let ceiling = 0;
    let firstFrame = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(exitTimer);
      window.clearTimeout(ceiling);
      window.clearTimeout(firstFrame);
      setGone(true);
      document.documentElement.classList.remove("is-loading");
      release();
      window.dispatchEvent(new Event("lb:loaded"));
    };

    /* The curtain, then gone. Separated so the film is never cut to black:
     * the site is already painted underneath, so this lifts rather than
     * transitions. */
    const leave = () => {
      if (done || leaving) return;
      setLeaving(true);
      exitTimer = window.setTimeout(finish, 760);
    };

    ceiling = window.setTimeout(leave, MAX_MS);

    const v = video.current;
    /* Autoplay can be refused — a muted inline video is normally allowed,
     * but policies differ and a rejected promise must not leave the page
     * sitting behind a still frame for ten seconds. */
    if (v) {
      /* ONLY "playing" CALLS OFF THE GIVE-UP TIMER, and the distinction is
       * the whole safety net. "loadeddata" fires as soon as the first frame
       * is decoded — including when autoplay was refused, where the frame
       * is decoded and then sits there. Clearing the timer on that was
       * measured holding the page for the full ten seconds behind a
       * motionless still. If it is not actually playing by now, it is not
       * going to, and the site is the better answer. */
      const started = () => window.clearTimeout(firstFrame);
      v.addEventListener("playing", started, { once: true });
      v.addEventListener("ended", leave, { once: true });
      /* An error means the file is wrong, missing or unplayable on this
       * device. The site is the answer to that, immediately. */
      v.addEventListener("error", leave, { once: true });
      void v.play().catch(() => leave());
      firstFrame = window.setTimeout(leave, FIRST_FRAME_MS);
    } else {
      leave();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      leave();
    };
    window.addEventListener("pointerdown", leave);
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(ceiling);
      window.clearTimeout(firstFrame);
      window.removeEventListener("pointerdown", leave);
      window.removeEventListener("keydown", onKey);
      release();
      document.documentElement.classList.remove("is-loading");
    };
    /* `leaving` is read inside but must not re-run this: the listeners and
     * the ceiling are set up once, for the life of the sequence. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone || sources.length === 0) return null;

  return (
    <div
      ref={root}
      data-preloader
      aria-hidden="true"
      className="fixed inset-0 z-[10000] overflow-hidden bg-surface-deep"
      style={{
        clipPath: leaving ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition: "clip-path 0.72s cubic-bezier(0.87, 0, 0.13, 1)",
      }}
    >
      <video
        ref={video}
        className="h-full w-full"
        style={{ objectFit: fit }}
        poster={poster}
        autoPlay
        muted
        playsInline
        preload="auto"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({ fetchpriority: "high" } as any)}
      >
        {sources.map((s) => (
          <source key={s.src + (s.media ?? "")} src={s.src} media={s.media} type={s.type} />
        ))}
      </video>
    </div>
  );
}
