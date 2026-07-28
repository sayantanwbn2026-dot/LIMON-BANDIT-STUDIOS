import { ArrowRight, Check, Star } from "lucide-react";
import { GridRules } from "@/components/lb/GridRules";
import { WordReveal } from "@/components/lb/Reveal";
import { Ticker } from "@/components/lb/Ticker";
import { LiveLog } from "@/components/lb/LiveLog";
import { ctaChecklist } from "@/data/tickers";
import { site } from "@/data/site";
import roomA from "@/assets/room-a.jpg";
import a1 from "@/assets/release-01.jpg";
import a2 from "@/assets/release-02.jpg";
import a3 from "@/assets/release-06.jpg";

export function FinalCta() {
  return (
    <section className="relative w-full overflow-hidden bg-ink-deep">
      <img
        src={roomA}
        alt=""
        aria-hidden="true"
        width={1600}
        height={900}
        loading="lazy"
        className="pointer-events-none absolute right-0 top-0 h-full w-[62%] object-cover opacity-35 grayscale"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--ink-deep) 0%, var(--ink-deep) 42%, rgba(5,5,5,0.4) 75%, rgba(5,5,5,0.2) 100%)",
        }}
      />
      <GridRules tone="dark" />

      <div className="shell relative z-[2] py-[160px]">
        <div className="max-w-[760px]">
          <div className="flex items-center gap-4">
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={14} className="fill-acid text-acid" />
              ))}
            </span>
            <span className="t-eyebrow text-mute-dark">{site.rating}</span>
          </div>

          <WordReveal
            as="h2"
            className="t-hero mt-8 text-text-dark"
            text={"The room's already warm."}
          />

          <p className="t-lead mt-8 max-w-[520px] text-mute-dark">
            Bring the songs. We&apos;ll handle the room, the master, the print run, and the people
            who shoot the video.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <div className="flex">
              {[a1, a2, a3].map((a, i) => (
                <img
                  key={i}
                  src={a}
                  alt=""
                  aria-hidden="true"
                  width={44}
                  height={44}
                  loading="lazy"
                  className="h-11 w-11 border border-ink-deep object-cover grayscale"
                  style={{ marginLeft: i === 0 ? 0 : -10 }}
                />
              ))}
            </div>
            <div>
              <div className="font-display text-[14px] font-bold uppercase text-text-dark">
                Rana, Kaalo &amp; Shona
              </div>
              <div className="font-ui text-[12px] text-mute-dark">
                Booked the room this month.
              </div>
            </div>
          </div>

          <a
            href="/contact"
            className="group mt-10 flex h-[62px] w-full max-w-[320px] items-center justify-between bg-acid transition-colors duration-300 hover:bg-acid-dim"
          >
            <span className="pl-7 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text-light">
              Book the room
            </span>
            <ArrowRight size={18} className="mr-7 text-text-light transition-transform duration-300 group-hover:translate-x-1.5" />
          </a>

          <div className="mt-12 flex flex-wrap items-start justify-between gap-10">
            <ul className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              {ctaChecklist.map((c) => (
                <li key={c} className="flex items-center gap-3 font-ui text-[15px] text-text-dark">
                  <Check size={14} className="shrink-0 text-acid" />
                  {c}
                </li>
              ))}
            </ul>
            <LiveLog />
          </div>
        </div>
      </div>

      <div className="relative z-[2] flex h-[52px] items-center border-y border-ink-line">
        <Ticker duration={40}>
          {ctaChecklist.map((c) => (
            <span key={c} className="flex shrink-0 items-center gap-6 pr-6">
              <span className="t-label whitespace-nowrap text-mute-dark">{c}</span>
              <span className="h-[9px] w-[9px] shrink-0 border border-acid" />
            </span>
          ))}
        </Ticker>
      </div>
    </section>
  );
}
