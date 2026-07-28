import { Ticker, TickerItem } from "@/components/lb/Ticker";
import { GridRules } from "@/components/lb/GridRules";
import { partners, proofTicker } from "@/data/tickers";
import { Star } from "lucide-react";
import a1 from "@/assets/release-01.jpg";
import a2 from "@/assets/release-02.jpg";
import a3 from "@/assets/release-03.jpg";
import a4 from "@/assets/release-06.jpg";

const avatars = [a1, a2, a3, a4];

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
              <img
                key={i}
                src={a}
                alt=""
                aria-hidden="true"
                width={72}
                height={72}
                loading="lazy"
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
