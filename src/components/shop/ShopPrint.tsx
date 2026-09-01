import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";

/**
 * Why the runs are small, in the same three-column form the Label uses to
 * state its split. The argument is the economics, so the numbers carry it.
 */
const RUN = [
  {
    k: "Run size",
    v: "150",
    d: "Priced to break even at the number printed. Nothing is made on the assumption it sells out.",
  },
  {
    k: "Printed",
    v: "Kolkata",
    d: "Cut, screened and cured within a few streets of the building. We collect it ourselves.",
  },
  {
    k: "Restocks",
    v: "None",
    d: "A sold-out size stays sold out. The money goes into the next record instead of more stock.",
  },
];

const STAGES = [
  {
    k: "01",
    t: "Artwork locks",
    d: "One colour, one screen. The sleeve artist sets the separation.",
  },
  {
    k: "02",
    t: "Screen and cure",
    d: "Pulled by hand in batches of twenty-five, cured the same day.",
  },
  {
    k: "03",
    t: "Counted in",
    d: "Numbered as they come off, so the run size on the page is the real one.",
  },
  {
    k: "04",
    t: "Sold direct",
    d: "No wholesale, no marketplace. It ships from the room it was made in.",
  },
];

export function ShopPrint() {
  return (
    <section className="relative w-full bg-surface py-[120px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface">
              The run
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">Small, local, and finished</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">
              Everything here is made in a quantity we can carry. That is a constraint, not a
              marketing position.
            </p>
          </div>
        </div>

        {/* Three columns only from lg. The value is 44px display type and a
         * single long word cannot wrap, so between 768 and 1023 "Kolkata"
         * ran 66px past its own cell into the neighbour — invisible to a
         * viewport-overflow check, because nothing escapes the page. */}
        <dl className="mt-16 grid grid-cols-1 border-t border-line lg:grid-cols-3">
          {RUN.map((s, i) => (
            <div
              key={s.k}
              className={`border-b border-line py-10 lg:border-b-0 ${
                i > 0 ? "lg:border-l lg:pl-10" : "lg:pr-10"
              } ${i === 1 ? "lg:pr-10" : ""}`}
            >
              <dt className="t-label text-mute">{s.k}</dt>
              <dd>
                <span className="tnum mt-4 block font-display text-[44px] font-extrabold uppercase leading-[1] tracking-[-0.03em] text-acid-type">
                  {s.v}
                </span>
                <span className="mt-4 block max-w-[38ch] font-ui text-[15px] leading-[1.5] text-mute">
                  {s.d}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <ol className="mt-16 grid grid-cols-1 border-t border-line md:grid-cols-2">
          {STAGES.map((s, i) => (
            <li
              key={s.k}
              className={`flex gap-6 border-b border-line py-8 ${
                i % 2 === 0 ? "md:pr-10" : "md:border-l md:pl-10"
              }`}
            >
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
      </div>
    </section>
  );
}
