import { ArrowRight } from "lucide-react";
import { Accordion } from "@/components/lb/Accordion";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { faqByTopic } from "@/data/faq";
import { site } from "@/data/site";

const STEPS = [
  { k: "01", t: "Send the dates", d: "What you are recording and roughly how long you need." },
  { k: "02", t: "We confirm", d: "Usually within a few hours, and we hold the slot for 48 hours." },
  { k: "03", t: "You play", d: "Engineer is already in the room. Masters go home with you." },
];

/**
 * How a booking actually happens, and the three questions people ask before
 * making one. Deliberately not the landing page's FAQ set — someone on this
 * page has already decided they want a room.
 */
export function RoomsBooking() {
  return (
    <section className="relative w-full bg-surface py-[120px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface">
              Booking
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">Hold a room</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">
              No deposit to hold. No card on file. A person reads every message.
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* how it works + the CTA */}
          <div>
            <ol className="border-t border-line">
              {STEPS.map((s) => (
                <li key={s.k} className="flex gap-6 border-b border-line py-8">
                  <span className="tnum font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-acid-type">
                    {s.k}
                  </span>
                  <span>
                    <span className="block font-display text-[18px] font-bold uppercase tracking-[-0.02em] text-text">
                      {s.t}
                    </span>
                    <span className="mt-2 block max-w-[42ch] font-ui text-[15px] leading-[1.5] text-mute">
                      {s.d}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <a
                href="/contact?intent=booking"
                className="group flex h-[60px] items-center justify-between gap-6 bg-acid px-8 transition-colors duration-300 hover:bg-acid-dim"
              >
                <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
                  Check availability
                </span>
                <ArrowRight
                  size={16}
                  className="text-accent-text transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
              <a
                href={`tel:${site.phone.replace(/\s+/g, "")}`}
                className="tnum font-ui text-[13px] font-semibold text-mute transition-colors duration-300 hover:text-text"
              >
                or call {site.phone}
              </a>
            </div>

            <p className="t-label mt-8 max-w-[46ch] text-mute">
              Live availability is not wired up yet — send the dates and we confirm by hand.
            </p>
          </div>

          {/* the three booking questions */}
          <div>
            <h3 className="t-label text-mute">Before you book</h3>
            <div className="mt-6">
              <Accordion items={faqByTopic("booking")} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
