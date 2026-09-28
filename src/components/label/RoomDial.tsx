import { useEffect, useState } from "react";
import { isAttached, ROOMS, setRoom, type RoomId } from "@/lib/audio-graph";

const KEY = "lb-room";

/**
 * Audition the record through the rooms it could have been cut in.
 *
 * This is the thing the page exists for. Any label can put a play button on
 * a cover; a label that owns a building can hand you the building. Pick The
 * Booth and the track tightens up against close walls; pick The Lockout and
 * it opens into the whole house. Same master, different room — which is the
 * argument the studio is making anyway, made in the only medium where it is
 * not a claim.
 *
 * SAID PLAINLY, BECAUSE IT IS NOT A MEASUREMENT
 * The impulses are models, not recordings of these rooms, and the caption
 * says so. Overstating it would be the one thing that could make this worse
 * than not having it: a musician who books Room A on the strength of a
 * sound the room does not make has been sold something. When a real
 * impulse response is dropped in, the model gives way to it and the caption
 * is the only thing that needs rewriting.
 *
 * It remembers the room in this browser, so somebody who prefers everything
 * through The Lockout is asked once.
 */
export function RoomDial({ onWake }: { onWake?: () => void }) {
  const [at, setAt] = useState<RoomId>("dry");
  const [ready, setReady] = useState(false);

  /* The graph is only built once something has played, so until then the
   * control would be a row of buttons that do nothing. It waits. */
  useEffect(() => {
    if (ready) return;
    const id = window.setInterval(() => {
      if (isAttached()) {
        setReady(true);
        window.clearInterval(id);
      }
    }, 400);
    return () => window.clearInterval(id);
  }, [ready]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY) as RoomId | null;
      if (saved && ROOMS.some((r) => r.id === saved)) setAt(saved);
    } catch {
      /* storage disabled — it simply starts dry */
    }
  }, []);

  /* Re-apply on arrival: the graph may attach after the saved room was
   * read, and a remembered setting that is not actually in effect is worse
   * than no memory at all. */
  useEffect(() => {
    if (ready) void setRoom(at);
  }, [ready, at]);

  const choose = (id: RoomId) => {
    setAt(id);
    /* Nothing is greyed out to mean "not yet" — the rest of this site
     * stopped doing that and so does this. Picking a room before anything
     * is playing starts the track and lands you in that room, which is
     * what pressing it plainly meant. */
    if (!ready) onWake?.();
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* nothing to do — it holds for this visit */
    }
  };

  const current = ROOMS.find((r) => r.id === at) ?? ROOMS[0];

  return (
    <section aria-labelledby="room-dial" className="mt-8 border-t border-line pt-6" data-room={at}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h4 id="room-dial" className="t-label text-mute">
          Play it in the room
        </h4>
        <p className="font-ui text-[12px] text-mute">
          {ready ? current.note : "Pick one and it starts there."}
        </p>
      </div>

      <div role="group" aria-label="Which room to hear it in" className="mt-4 flex flex-wrap gap-2">
        {ROOMS.map((r) => {
          const on = r.id === at;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => choose(r.id)}
              aria-pressed={on}
              className={`flex h-11 items-center px-4 font-ui text-[11px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ${
                on
                  ? "bg-acid text-accent-text"
                  : "border border-line text-text hover:border-acid-type"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 font-ui text-[11px] leading-[1.5] text-mute">
        Modelled rooms, not measured ones — convolution built from the shape of each space rather
        than a recording of it. Book the real thing and hear the difference.
      </p>
    </section>
  );
}
