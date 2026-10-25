import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { WordReveal } from "@/components/lb/Reveal";
import { CmsImage } from "@/components/lb/CmsImage";
import { useFounder, useSection, useWords } from "@/cms/hooks";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * Who's behind it — the founder, quoted rather than reported.
 *
 * This began as a portrait beside three paragraphs under a heading: a bio,
 * correct and completely formal, which on a phone read as an About page
 * dropped into the middle of a studio site. The lead line is set as a
 * statement at display scale — it is a quote, and it should look like
 * someone said it — with the supporting copy stepped down behind it and the
 * name as a sign-off rather than a job title in a box.
 *
 * It also used to be hardcoded, and imported by nothing: it sat in
 * `sections/` for weeks rendering on no page at all. It reads the CMS now
 * and lives on the page it was written for.
 */
export function Founder() {
  const copy = useSection("about", "founder");
  const w = useWords("about");
  const f = useFounder();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* A short, slow drift — the portrait moves about a sixth as far as the
       * page does. Enough that the block is alive while you read it, not so
       * much that it reads as a separate moving object.
       *
       * Desktop only. On a phone the portrait is full width and the travel
       * would be the most conspicuous thing on the screen, and mobile Safari
       * resizes the viewport mid-scroll as the URL bar retracts, which makes
       * any scroll-linked transform jump. */
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const img = el.querySelector<HTMLElement>("[data-portrait]");
        if (!img) return;
        const tween = gsap.fromTo(
          img,
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        );
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    }, el);

    return () => ctx.revert();
  }, []);

  const body = [f.body1, f.body2].filter(Boolean);

  return (
    <Section tone="dark" className="py-[96px]">
      <h2 className="sr-only">{copy.heading || w.founderFallbackHeading}</h2>

      <div ref={ref} className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-10">
        {/* the portrait */}
        <div className="lg:col-span-5">
          <div className="ui-media relative overflow-hidden border border-line">
            {/* The parallax needs somewhere to travel, so the picture is
             * taller than its window and the window does the cropping. */}
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <CmsImage
                data-portrait
                src={f.image}
                sizes="(max-width: 1023px) 100vw, 460px"
                alt={f.alt}
                className="absolute inset-x-0 top-[-8%] h-[116%] w-full object-cover"
                style={{ filter: "brightness(var(--img-brightness)) contrast(1.08)" }}
              />
            </div>

            {/* A scanline wash and one corner mark — the same control-room
             * language the room photographs use, so the portrait belongs to
             * the building rather than looking like a stock headshot. */}
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
          <Eyebrow>{copy.eyebrow}</Eyebrow>

          {/* WordReveal so it arrives a word at a time — it is someone
           * talking, not a paragraph being displayed. */}
          <WordReveal
            as="blockquote"
            className="mt-7 font-display text-[27px] font-extrabold uppercase leading-[1.06] tracking-[-0.03em] text-text md:text-[34px]"
            text={f.quote}
          />

          {body.length ? (
            <div className="mt-8 space-y-4 font-ui text-[15px] leading-[1.55] text-mute md:text-[16px]">
              {body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}

          {/* the sign-off */}
          <div className="mt-9 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6">
            <div>
              <div className="font-display text-[16px] font-extrabold uppercase tracking-[-0.02em] text-text">
                {f.name}
              </div>
              {f.role ? <div className="t-label mt-1 text-mute">{f.role}</div> : null}
            </div>

            {/* Only when there is a figure to show. An empty star row beside
             * a blank number is worse than no row. */}
            {f.statValue ? (
              <div className="flex items-center gap-3">
                <span className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={13} className="fill-acid-type text-acid-type" />
                  ))}
                </span>
                <span className="t-label tnum text-mute">
                  {f.statValue}
                  {f.statLabel ? ` / ${f.statLabel}` : ""}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}
