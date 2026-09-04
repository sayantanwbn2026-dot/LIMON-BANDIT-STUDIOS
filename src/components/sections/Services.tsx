import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { CmsImage } from "@/components/lb/CmsImage";
import { ensureGsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { useServices } from "@/cms/hooks";

/**
 * What we run — the four operations, as a projection room.
 *
 * This was four flat text cards in a 2x2 grid: no photograph, no motion,
 * and — the part that actually cost something — no links, so the section
 * that says "pick your door below" was itself a dead end.
 *
 * It is now a held frame. One large image stays fixed at the centre of the
 * screen while the four operations pass through it; scrolling changes which
 * operation the frame is showing, and the type changes with it. The image
 * does the work photography should do on a studio site, and nothing has to
 * be clicked to see it.
 *
 * WHY IT IS NOT WRAPPED IN ScrollDepth
 * The stage is `position: sticky`, and a transformed ancestor re-bases
 * sticky against the transform instead of the viewport — the same reason
 * Hero, ThreeWaysIn, DropRail and Rooms sit bare in the route. See the note
 * in index.tsx.
 *
 * WHY THE ACTIVE INDEX IS NOT DRIVEN BY GSAP
 * The crossfade is React state, so the same value drives the image, the
 * type weight, the tags and the rail from one source. A GSAP timeline
 * writing opacity on four stacked images would have to be reversed by hand
 * on scroll-up and would fight React on rerender. ScrollTrigger is used
 * only to report which step we are on.
 */
export function Services() {
  const services = useServices();
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* Desktop only. Below 1024 the section is a stack of full-bleed cards
       * that needs no scroll machinery — one operation fills a phone screen
       * on its own, which is the same effect this buys on a wide one. */
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            /* Split the scrubbed range into one band per operation. The
             * clamp matters at exactly progress === 1, which would
             * otherwise index one past the end for a single frame. */
            const i = Math.min(services.length - 1, Math.floor(self.progress * services.length));
            setActive((prev) => (prev === i ? prev : i));
          },
        });
        return () => st.kill();
      });

      return () => mm.revert();
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <Section surface="bg-surface" className="pt-[120px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <Eyebrow>What we run</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal
            as="h2"
            className="t-h2 text-text"
            text={"Turning a room, a roster,\nand a print run\ninto one house"}
          />
        </div>
        <div className="flex items-end md:col-span-1">
          <p className="font-ui text-[16px] leading-[1.5] text-mute">
            Four operations, one building. Each one exists because the last one needed it.
          </p>
        </div>
      </div>

      {/* ---------------- desktop: the held frame ----------------
       * 70vh of travel per operation, plus half a screen so the last one is
       * readable before the section lets go. A full screen each felt like
       * being held; 70vh is still comfortably longer than the crossfade, so
       * nothing is missed by scrolling at a normal pace. */}
      <div
        ref={root}
        className="relative mt-20 hidden lg:block"
        style={{ height: `${services.length * 70 + 50}vh` }}
      >
        <div className="sticky top-0 flex h-[100svh] items-center pt-[var(--nav-h)]">
          <div className="grid w-full grid-cols-12 items-center gap-x-[var(--grid-gutter)]">
            {/* the list */}
            <ol className="col-span-5">
              {services.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.index} className="border-b border-line first:border-t">
                    <Link
                      to={s.to}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className="group flex items-baseline gap-5 py-6 outline-none"
                    >
                      <span
                        className="tnum font-display text-[13px] font-bold transition-colors duration-500"
                        style={{ color: on ? "var(--accent-type)" : "var(--mute)" }}
                      >
                        {s.index}
                      </span>
                      <span
                        /* The active row steps forward rather than lighting
                         * up: colour alone at this size reads as a hover
                         * state, and this is a position in a sequence. */
                        className="font-display text-[34px] font-extrabold uppercase leading-[1.02] tracking-[-0.03em] transition-all duration-500 group-focus-visible:underline xl:text-[44px]"
                        style={{
                          color: on ? "var(--text)" : "var(--mute)",
                          transform: on ? "translateX(14px)" : "translateX(0)",
                          opacity: on ? 1 : 0.45,
                        }}
                      >
                        {s.title}
                      </span>
                      <ArrowUpRight
                        size={18}
                        className="ml-auto shrink-0 text-acid-type transition-opacity duration-500"
                        style={{ opacity: on ? 1 : 0 }}
                      />
                    </Link>
                  </li>
                );
              })}

              {/* What the active operation actually is.
               *
               * This was four stacked divs toggled with `display` and a
               * `transition-opacity` that never fired: display is not an
               * animatable property, so block and opacity:1 landed in the
               * same commit and the copy popped. AnimatePresence is the tool
               * for it — only the active panel is mounted, and the outgoing
               * one is held in the tree long enough to actually leave.
               *
               * `mode="wait"` so the two never overlap in a min-height box
               * that would otherwise jump between copy of different lengths. */}
              <div className="mt-10 min-h-[132px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={services[active].index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="max-w-[46ch] font-ui text-[16px] leading-[1.55] text-mute">
                      {services[active].description}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {services[active].tags.map((t) => (
                        <span key={t} className="t-label border border-line px-3 py-2 text-mute">
                          {t}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </ol>

            {/* the frame */}
            <div className="col-span-7 col-start-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-line">
                {services.map((s, i) => (
                  <div
                    key={s.index}
                    aria-hidden="true"
                    className="absolute inset-0 transition-opacity duration-[700ms]"
                    style={{ opacity: i === active ? 1 : 0 }}
                  >
                    <CmsImage
                      src={s.image}
                      alt=""
                      sizes="58vw"
                      className="h-full w-full object-cover chroma"
                      /* The inactive frames sit at a slightly wider scale so
                       * the change reads as the camera settling rather than
                       * as a slideshow cut. */
                      style={{
                        transform: i === active ? "scale(1)" : "scale(1.06)",
                        transition: "transform 900ms var(--ease-out-expo)",
                      }}
                    />
                  </div>
                ))}

                {/* A scrim, then the verb. It was set in mix-blend-difference
                 * with nothing under it, which is only legible over an image
                 * that happens to be dark and even — over the tram shot, all
                 * blue streaks and headlights, the word turned to grey mud.
                 * A gradient base makes it read the same over any of the four
                 * photographs, which is the only way a device like this can
                 * survive the next image being swapped in. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%]"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--surface-deep) 62%, transparent) 58%, color-mix(in srgb, var(--surface-deep) 90%, transparent) 100%)",
                  }}
                />
                {/* The verb changes with the frame, so it should arrive with
                 * it rather than cutting. Clipped by the frame's own
                 * overflow-hidden, so it rises in from under the edge. */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={services[active].word}
                    aria-hidden="true"
                    initial={{ opacity: 0, y: 34 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -22 }}
                    transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
                    className="pointer-events-none absolute bottom-5 left-6 block font-display text-[64px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text xl:text-[88px]"
                  >
                    {services[active].word}
                  </motion.span>
                </AnimatePresence>

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 block h-[26px] w-[26px] border-l-2 border-t-2 border-acid"
                />
              </div>

              {/* which of four */}
              <div className="mt-6 grid grid-cols-4 gap-3" aria-hidden="true">
                {services.map((s, i) => (
                  <span key={s.index} className="relative block h-px w-full bg-line">
                    <span
                      className="absolute inset-0 block origin-left bg-acid transition-transform duration-500"
                      style={{ transform: `scaleX(${i <= active ? 1 : 0})` }}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- mobile: four numbered plates ----------------
       * These were a photograph with a dark gradient and the copy laid over
       * it — the single most common card on the web, and it made four
       * distinct operations look like four stock images.
       *
       * The plate inverts it. The photograph is framed rather than written
       * on, the numeral is stamped into its corner in acid the way a plate
       * is numbered, and everything that can be read is set on the card's
       * own ground below, on ruled rows, in the same ledger language the
       * rooms spec sheet already uses.
       *
       * The 16:9 crop is doing work too: at 4:5 the image was tall enough
       * to be the whole card and the copy had nowhere to live except on top
       * of it. Letterboxed, the picture is a window in a document. */}
      <ul className="mt-14 flex flex-col gap-5 pb-[120px] lg:hidden">
        {services.map((s) => (
          <li key={s.index}>
            <Link
              to={s.to}
              className="group relative block border border-line bg-surface-raised active:border-line-strong"
            >
              {/* the frame */}
              <div className="relative overflow-hidden">
                <CmsImage
                  src={s.image}
                  alt={s.alt}
                  sizes="100vw"
                  className="aspect-[16/9] w-full object-cover chroma"
                />

                {/* The CRT ruling again, but local and a shade stronger than
                 * the page-wide one — it reads as a monitor showing the room
                 * rather than a photograph pasted onto the page. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px)",
                  }}
                />

                {/* the stamp — acid block, numerals knocked out of it */}
                <span className="neon absolute bottom-0 left-0 flex h-[38px] min-w-[54px] items-center justify-center bg-acid px-3">
                  <span className="tnum font-display text-[15px] font-extrabold text-accent-text">
                    {s.index.replace("/", "")}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 block h-[22px] w-[22px] border-r-2 border-t-2 border-acid"
                />
              </div>

              {/* the document */}
              <div className="p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-[26px] font-extrabold uppercase leading-[1] tracking-[-0.03em] text-text">
                    {s.title}
                  </h3>
                  <ArrowUpRight size={16} className="shrink-0 text-acid-type" />
                </div>

                {/* No description on a phone. The operation and what it
                 * covers are the whole decision at this size; the prose
                 * repeated what the photograph and the Covers row already
                 * said, and three lines of it per card pushed the fourth
                 * operation two screens further down. It still runs on the
                 * desktop held frame, where there is a column for it. */}

                {/* The spec row, stacked rather than label-left/value-right.
                 * Side by side the label ate ~86px of a 278px measure and
                 * "Live room · Booth · Lockout" broke with LOCKOUT orphaned
                 * on its own line. Stacked, the values get the full width
                 * and stay on one line — the ledger reading survives, the
                 * ragged break does not. */}
                <dl className="mt-5 border-t border-line pt-4">
                  <dt className="t-label text-mute">Covers</dt>
                  <dd className="mt-2 font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-text">
                    {s.tags.map((t, i) => (
                      <span key={t}>
                        {i > 0 ? (
                          <span aria-hidden="true" className="px-2 text-acid-type">
                            &middot;
                          </span>
                        ) : null}
                        {t}
                      </span>
                    ))}
                  </dd>
                </dl>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
