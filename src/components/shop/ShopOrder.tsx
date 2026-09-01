import { ArrowRight } from "lucide-react";
import { Accordion } from "@/components/lb/Accordion";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { faqByTopic } from "@/data/faq";
import { site } from "@/data/site";

const SHIPPING = [
  { k: "Kolkata", v: "Free", d: "Collect from the building, or we drop it if we are passing." },
  { k: "India", v: "₹120", d: "Tracked, three to six days. One flat rate whatever the order." },
  {
    k: "Outside India",
    v: "By ask",
    d: "Message us first. Vinyl abroad usually costs more than the record.",
  },
];

export function ShopOrder() {
  return (
    <section className="relative w-full bg-surface-deep py-[120px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface-deep">
              Ordering
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">How it gets to you</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">
              One form for every order. We confirm stock by hand before taking any money.
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
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
                href="/contact?intent=order"
                className="group flex h-[60px] items-center justify-between gap-6 bg-acid px-8 transition-colors duration-300 hover:bg-acid-dim"
              >
                <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
                  Place an order
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
              <Accordion items={faqByTopic("shop")} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
