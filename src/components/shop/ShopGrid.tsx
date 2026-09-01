import { ArrowUpRight } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { Picture } from "@/components/lb/Picture";
import { drops } from "@/data/drops";

/**
 * The catalogue, standing still.
 *
 * The landing page already carries these as a pinned horizontal rail, so
 * repeating that here would be the same section twice. This is the version
 * you buy from: a static grid that shows the run size and the price, and
 * states plainly when something is gone.
 */
const statusTint: Record<string, string> = {
  "Out now": "bg-acid text-accent-text",
  "Pre-order": "bg-surface-deep text-acid-type",
  "Sold out": "bg-surface-deep text-mute",
};

export function ShopGrid() {
  return (
    <section id="catalogue" className="relative w-full bg-surface-deep py-[120px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface-deep">
              In the shop
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">Everything currently for sale</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">
              Seven runs. When a number is gone it stays gone, so the sold-out ones are left here
              with their price on.
            </p>
          </div>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {drops.map((d) => {
            const gone = d.status === "Sold out";
            return (
              <li key={d.id} className="bg-surface-deep">
                <article className="group flex h-full flex-col">
                  <div className="relative overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
                    <Picture
                      src={d.image}
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      alt={`${d.title} by ${d.artist} — cover art`}
                      className="h-full w-full object-cover transition-transform duration-[700ms] group-hover:scale-[1.04]"
                      style={{
                        filter: `brightness(var(--img-brightness)) contrast(1.03) saturate(1.06)`,
                        opacity: gone ? 0.45 : 1,
                      }}
                    />
                    <span className="tnum absolute left-0 top-0 bg-surface-deep px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-acid-type">
                      {d.index}
                    </span>
                    <span
                      className={`absolute bottom-0 right-0 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.16em] ${statusTint[d.status]}`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col border-t border-line p-6">
                    <h3 className="font-display text-[20px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-text">
                      {d.title}
                    </h3>
                    <p className="mt-2 font-ui text-[13px] text-mute">{d.artist}</p>

                    <dl className="mt-6 space-y-2">
                      <Spec k="Format" v={d.format} />
                      <Spec k="Run" v={d.run} />
                      <Spec k="Released" v={d.date} />
                    </dl>

                    <div className="mt-auto flex items-baseline justify-between gap-4 border-t border-line pt-5">
                      <span
                        className={`tnum font-display text-[20px] font-extrabold tracking-[-0.02em] ${
                          gone ? "text-mute line-through" : "text-text"
                        }`}
                      >
                        {d.price}
                      </span>
                      {gone ? (
                        <span className="t-label text-mute">Gone</span>
                      ) : (
                        <a
                          href={`/contact?intent=order&item=${d.id}`}
                          className="group/cta flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-text"
                        >
                          <span className="wipe-underline">
                            {d.status === "Pre-order" ? "Pre-order" : "Buy"}
                          </span>
                          <ArrowUpRight size={14} className="text-acid-type" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <p className="t-label mt-8 max-w-[52ch] text-mute">
          Checkout is not wired up yet — every order goes through one form and a person confirms
          stock before you pay.
        </p>
      </div>
    </section>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="t-label text-mute">{k}</dt>
      <dd className="tnum text-right font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-text">
        {v}
      </dd>
    </div>
  );
}
