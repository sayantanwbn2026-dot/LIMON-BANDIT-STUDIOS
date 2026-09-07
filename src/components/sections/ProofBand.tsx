import { Ticker, TickerItem } from "@/components/lb/Ticker";
import { GridRules } from "@/components/lb/GridRules";
import { Star } from "lucide-react";
import { Picture } from "@/components/lb/Picture";
import { useTickers } from "@/cms/hooks";

const avatars = ["release-01", "release-02", "release-03", "release-06"] as const;

export function ProofBand() {
  const { partners, proofTicker } = useTickers();
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
        {/* A fixed height around wrapping content is a collision waiting for
         * a narrow screen. Both rows below used to be h-[56px] / h-[88px]
         * with flex-wrap: on a 390px phone the partner row needed 168px and
         * got 88, so three of the five partners were clipped out of the
         * section entirely and "Trusted by 100+ artists" printed on top of
         * "Radio Misfit". The heights are now the desktop case only, and
         * the phone gets padding and whatever height the content asks for. */}
        <div className="shell flex flex-col items-center justify-center gap-4 border-b border-line py-6 sm:h-[56px] sm:flex-row sm:gap-5 sm:py-0">
          <div className="flex items-center gap-4">
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
                    filter: "brightness(var(--img-brightness)) contrast(1.03) saturate(1.06)",
                  }}
                />
              ))}
            </div>
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={13} className="fill-acid-type text-acid-type" />
              ))}
            </span>
          </div>
          <span className="t-eyebrow text-mute">Trusted by 100+ artists</span>
        </div>
        {/* justify-between is right for one row and wrong for a wrapped one —
         * it strands the last line against the left edge with a hole beside
         * it. Centred while wrapping, spread once it fits on a single line. */}
        <div className="shell flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-7 sm:h-[88px] sm:justify-between sm:gap-6 sm:py-0">
          {partners.map((p) => (
            <span
              key={p}
              className="font-ui text-[13px] font-bold uppercase text-mute opacity-60 transition-all duration-300 hover:text-text hover:opacity-100 sm:text-[16px]"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
