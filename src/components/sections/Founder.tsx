import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { Picture } from "@/components/lb/Picture";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Who's behind it — the founder, quoted rather than reported.
 *
 * This was a portrait beside three paragraphs of body copy under a
 * heading: a bio, correct and completely formal, and on a phone it read
 * as an About page dropped into the middle of a studio site.
 *
 * The lead line is now set as a statement at display scale — it is a
 * quote, and it should look like someone said it — with the supporting
 * copy stepped down behind it and the name set as a sign-off rather than
 * a job title in a box. The portrait carries a slow parallax so the block
 * is alive while you read it.
 */
export function Founder() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* A short, slow drift — the portrait moves about a sixth as far as
       * the page does. Enough that the block is not static while you read
       * it, not so much that it reads as a separate moving object. */
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const img = el.querySelector<HTMLElement>("[data-portrait]");
        if (!img) return;
        gsap.fromTo(
          img,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );
      });

      return () => mm.revert();
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <Section tone="dark" className="py-[120px]">
      <h2 className="sr-only">Who&apos;s behind it</h2>

      <div ref={ref} className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-10">
        {/* the portrait */}
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden border border-line">
            {/* The parallax needs somewhere to travel, so the picture is
             * taller than its window and the window does the cropping. */}
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <Picture
                data-portrait
                src={"founder"}
                sizes="(max-width: 1023px) 100vw, 460px"
                alt="Arko Dasgupta in the Limon Bandit control room"
                className="absolute inset-x-0 top-[-8%] h-[116%] w-full object-cover"
                style={{ filter: "brightness(var(--img-brightness)) contrast(1.08)" }}
              />
            </div>

            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, transparent 1px, transparent 3px)",
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 h-[24px] w-[24px] border-b-2 border-l-2 border-acid"
            />
          </div>
        </div>

        {/* the statement */}
        <div className="lg:col-span-7">
          <Eyebrow>Who&apos;s behind it</Eyebrow>

          {/* The quote, at display scale. WordReveal so it arrives a word at
           * a time — it is someone talking, not a paragraph. */}
          <WordReveal
            as="blockquote"
            className="mt-7 font-display text-[27px] font-extrabold uppercase leading-[1.06] tracking-[-0.03em] text-text md:text-[40px]"
            text={
              "I started Limon Bandit because the good rooms in this city were always booked by people who weren't making anything."
            }
          />

          <div className="mt-8 space-y-4 font-ui text-[15px] leading-[1.55] text-mute md:text-[16px]">
            <p>
              The idea was straightforward: keep the room open late, keep the rates readable, and
              let the artist walk out owning the record.
            </p>
            <p>
              <span className="text-text">
                Everything else — the label, the merch, the crew — grew out of that one room
              </span>{" "}
              because the people using it kept needing the next thing.
            </p>
          </div>

          {/* the sign-off */}
          <div className="mt-9 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6">
            <div>
              <div className="font-display text-[17px] font-extrabold uppercase tracking-[-0.02em] text-text">
                Arko Dasgupta
              </div>
              <div className="mt-1 t-label text-mute">Founder &amp; head engineer</div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={13} className="fill-acid-type text-acid-type" />
                ))}
              </span>
              <span className="t-label tnum text-mute">4.9 / 230+ sessions</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
