import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { useSection, useShopRun, useShopStages } from "@/cms/hooks";

/**
 * Why the runs are small, in the same three-column form the Label uses to
 * state its split. The argument is the economics, so the numbers carry it.
 */
export function ShopPrint() {
  const copy = useSection("shop", "print");
  const RUN = useShopRun();
  const STAGES = useShopStages();
  return (
    <section className="relative w-full bg-surface py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface">
              {copy.eyebrow}
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">{copy.heading}</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">{copy.standfirst}</p>
          </div>
        </div>

        {/* Three columns only from lg. The value is 44px display type and a
         * single long word cannot wrap, so between 768 and 1023 "Kolkata"
         * ran 66px past its own cell into the neighbour — invisible to a
         * viewport-overflow check, because nothing escapes the page. */}
        <dl className="mt-12 grid grid-cols-1 border-t border-line lg:grid-cols-3 lg:border-b">
          {RUN.map((s, i) => (
            <div
              key={s.k}
              className={`border-b border-line py-10 lg:border-b-0 ${
                i > 0 ? "lg:border-l lg:pl-10" : "lg:pr-10"
              } ${i === 1 ? "lg:pr-10" : ""}`}
            >
              <dt className="t-label text-mute">{s.k}</dt>
              <dd>
                <span className="tnum mt-4 block font-display text-[42px] font-extrabold uppercase leading-[1] tracking-[-0.03em] text-acid-type">
                  {s.v}
                </span>
                <span className="mt-4 block max-w-[38ch] font-ui text-[15px] leading-[1.5] text-mute">
                  {s.d}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <ol className="mt-12 grid grid-cols-1 border-t border-line md:grid-cols-2">
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
