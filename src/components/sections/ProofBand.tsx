import { Ticker, TickerItem } from "@/components/lb/Ticker";
import { GridRules } from "@/components/lb/GridRules";
import { partners, proofTicker } from "@/data/tickers";
import { Star } from "lucide-react";
import { Picture } from "@/components/lb/Picture";

const avatars = ["release-01", "release-02", "release-03", "release-06"] as const;

export function ProofBand() {
  return (
    <section className="relative w-full bg-surface-deep" aria-label="Studio facts and partners">
      <GridRules tone="dark" />
      <h2 className="sr-only">Studio facts and partners</h2>
      <div className="relative z-[2]">
        <div className="flex h-[56px] items-center border-y border-line">
          <Ticker duration={45}>
            {proofTicker.map((t) => (
              <TickerItem key={t} label={t} />
            ))}
          </Ticker>
        </div>
        <div className="shell flex h-[64px] flex-wrap items-center justify-center gap-5 border-b border-line">
          <div className="flex">
            {avatars.map((a, i) => (
              <Picture
                key={i}
                src={a}
                sizes="36px"
                alt=""
                className="h-9 w-9 border border-surface-deep object-cover"
                style={{
                  marginLeft: i === 0 ? 0 : -10,
                  filter: "grayscale(1) brightness(var(--img-brightness)) contrast(1.1)",
                }}
              />
            ))}
          </div>
          <span className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={13} className="fill-acid-type text-acid-type" />
            ))}
          </span>
          <span className="t-eyebrow text-mute">Trusted by 100+ artists</span>
        </div>
        <div className="shell flex h-[88px] flex-wrap items-center justify-between gap-6">
          {partners.map((p) => (
            <span
              key={p}
              className="font-ui text-[16px] font-bold uppercase text-mute opacity-60 transition-all duration-300 hover:text-text hover:opacity-100"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
