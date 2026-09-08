import { ArrowRight } from "lucide-react";
import { Accordion } from "@/components/lb/Accordion";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { useFaqByTopic, useSection, useShipping, useSite } from "@/cms/hooks";
import { SHIPPING_SEED } from "@/cms/seeds";

export function ShopOrder() {
  const faqItems = useFaqByTopic("shop");
  const copy = useSection("shop", "order");
  /* These three rows were a duplicate hardcoded copy of commerce.shipping's
   * `notes`, which meant an editor could change the shipping table in the
   * CMS — the one checkout actually charges from — and this section would
   * go on quoting the old rates. Same document now, so the promise on this
   * page and the arithmetic at checkout cannot drift apart. */
  const shipping = useShipping();
  const SHIPPING = shipping?.notes?.length ? shipping.notes : SHIPPING_SEED.notes;
  const site = useSite();
  return (
    <section className="relative w-full bg-surface-deep py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface-deep">
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

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-12">
          <div>
            <dl className="border-t border-line">
              {SHIPPING.map((s) => (
                <div
                  key={s.k}
                  className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-line py-6"
                >
                  <dt className="font-display text-[16px] font-bold uppercase tracking-[-0.01em] text-text">
                    {s.k}
                  </dt>
                  <dd className="tnum ml-auto order-2 font-ui text-[14px] font-semibold text-acid-type sm:order-none">
                    {s.v}
                  </dd>
                  <p className="w-full max-w-[46ch] font-ui text-[14px] leading-[1.5] text-mute">
                    {s.d}
                  </p>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <a
                href="#catalogue"
                className="group flex h-[56px] items-center justify-between gap-6 bg-acid px-8 transition-colors duration-300 hover:bg-acid-dim"
              >
                <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
                  Back to the catalogue
                </span>
                <ArrowRight
                  size={16}
                  className="text-accent-text transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
              <a
                href={`mailto:${site.email}`}
                className="font-ui text-[13px] font-semibold text-mute transition-colors duration-300 hover:text-text"
              >
                or email {site.email}
              </a>
            </div>
          </div>

          <div>
            <h3 className="t-label text-mute">Before you order</h3>
            <div className="mt-6">
              <Accordion items={faqItems} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
