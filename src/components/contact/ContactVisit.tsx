import { Accordion } from "@/components/lb/Accordion";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { LocalTime } from "@/components/lb/LocalTime";
import { useFaqByTopic, useHours, useSite, useTravel } from "@/cms/hooks";

/**
 * Finding the building, and when it is awake. The hours are the argument —
 * a room that closes at ten is a different product to one that does not.
 */
export function ContactVisit() {
  const faqItems = useFaqByTopic("booking");
  const HOURS = useHours();
  const GETTING_THERE = useTravel();
  const site = useSite();
  return (
    <section className="relative w-full bg-surface-deep py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface-deep">
              The building
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">Come and look at it</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">
              You are welcome to see a room before you book one. Message first so someone is in.
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-12">
          {/* hours */}
          <div>
            <h3 className="t-label text-mute">Hours</h3>
            <dl className="mt-6 border-t border-line">
              {HOURS.map((h) => (
                <div
                  key={h.k}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-4"
                >
                  <dt className="font-ui text-[14px] font-semibold text-text">{h.k}</dt>
                  <dd className="tnum font-ui text-[13px] text-mute">{h.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6">
              <LocalTime className="text-acid-type" />
            </div>
          </div>

          {/* getting there */}
          <div>
            <h3 className="t-label text-mute">Getting there</h3>
            <dl className="mt-6 border-t border-line">
              {GETTING_THERE.map((g) => (
                <div key={g.k} className="border-b border-line py-4">
                  <dt className="font-ui text-[14px] font-semibold text-text">{g.k}</dt>
                  <dd className="mt-2 max-w-[36ch] font-ui text-[14px] leading-[1.5] text-mute">
                    {g.d}
                  </dd>
                </div>
              ))}
            </dl>
            <address className="mt-6 not-italic">
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(site.address.join(", "))}`}
                className="font-ui text-[13px] leading-[1.5] text-mute transition-colors duration-300 hover:text-acid-type"
              >
                {site.address.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </a>
            </address>
          </div>

          {/* the questions everyone asks first */}
          <div>
            <h3 className="t-label text-mute">Asked most</h3>
            <div className="mt-6">
              <Accordion items={faqItems} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
