import type { ReactNode } from "react";
import { HeroFrame } from "@/components/lb/PageHero";
import { PosterLockup } from "@/components/lb/PosterLockup";
import { RiseIn } from "@/components/lb/Reveal";
import { LocalTime } from "@/components/lb/LocalTime";
import { useChapter } from "@/cms/hooks";
import { useSite, useSocialLink } from "@/cms/hooks";

/**
 * CONTACT — the dispatch slip, under the house lockup.
 *
 * The heading is the landing page's poster set to this page's phrase. What
 * makes it Contact is the docket beside it: a bordered slip with the house's
 * details ruled row by row, an acid corner tick, and a live clock at its own
 * address. The slip is real information rather than decoration, so every row
 * is a working link where a link makes sense.
 */
export function ContactHero() {
  const site = useSite();
  const instagram = useSocialLink("Instagram");
  const c = useChapter("contact");

  return (
    <HeroFrame chapter="contact">
      <PosterLockup
        className="mt-10"
        spread={c.poster.spread}
        word={c.poster.word}
        srText={c.heading}
      />

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-20">
        <div>
          <p className="t-lead max-w-[44ch] text-mute">{c.standfirst}</p>

          <p className="t-label mt-12 text-mute">
            Booking
            <span aria-hidden="true" className="px-3 text-acid-type">
              &middot;
            </span>
            Demos
            <span aria-hidden="true" className="px-3 text-acid-type">
              &middot;
            </span>
            Crew hire
          </p>
        </div>

        {/* the slip */}
        {/* max-w keeps it a docket below 1024, where the grid collapses and an
         * unbounded slip stretches edge to edge with mostly empty rows. */}
        <RiseIn delay={0.12} className="relative max-w-[460px] border border-line p-8">
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 block h-[22px] w-[22px] border-l-2 border-t-2 border-acid-type"
          />

          <span className="t-label block text-mute">The house</span>

          <address className="mt-6 not-italic">
            <dl>
              <SlipRow label="Address">
                {site.address.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </SlipRow>
              <SlipRow label="Phone">
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="tap tnum transition-colors duration-300 hover:text-acid-type"
                >
                  {site.phone}
                </a>
              </SlipRow>
              <SlipRow label="Email">
                <a
                  href={`mailto:${site.email}`}
                  className="tap transition-colors duration-300 hover:text-acid-type"
                >
                  {site.email}
                </a>
              </SlipRow>
              {instagram ? (
                <SlipRow label="Instagram">
                  <a
                    href={instagram.url}
                    className="tap transition-colors duration-300 hover:text-acid-type"
                  >
                    {instagram.handle || instagram.platform}
                  </a>
                </SlipRow>
              ) : null}
            </dl>
          </address>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-6">
            <LocalTime className="text-mute" />
            <span className="t-label text-acid-type">Open</span>
          </div>
        </RiseIn>
      </div>
    </HeroFrame>
  );
}

function SlipRow({ label, children }: { label: string; children: ReactNode }) {
  /* The last row drops its rule — the clock block below brings its own, and
   * the two together were reading as a doubled hairline. */
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-line py-4 first:border-t last:border-b-0">
      <dt className="t-label w-[88px] shrink-0 text-mute">{label}</dt>
      <dd className="min-w-0 font-ui text-[14px] leading-[1.5] text-text">{children}</dd>
    </div>
  );
}
