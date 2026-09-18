import { ArrowRight, Check, Star } from "lucide-react";
import { GridRules } from "@/components/lb/GridRules";
import { WordReveal } from "@/components/lb/Reveal";
import { Ticker } from "@/components/lb/Ticker";
import { LiveLog } from "@/components/lb/LiveLog";
import { useSection, useSite, useTickers } from "@/cms/hooks";
import { Picture } from "@/components/lb/Picture";

export function FinalCta() {
  const { ctaChecklist } = useTickers();
  const site = useSite();
  const copy = useSection("home", "finalcta");
  return (
    <section className="relative w-full overflow-hidden bg-surface-deep">
      <Picture
        src={"room-a"}
        sizes="(max-width: 767px) 100vw, 62vw"
        alt=""
        className="pointer-events-none absolute right-0 top-0 h-full w-[62%] object-cover opacity-35 chroma"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--surface-deep) 0%, var(--surface-deep) 42%, color-mix(in srgb, var(--surface-deep) 40%, transparent) 75%, color-mix(in srgb, var(--surface-deep) 20%, transparent) 100%)",
        }}
      />
      <GridRules tone="dark" />

      <div className="shell relative z-[2] py-[120px]">
        <div className="max-w-[760px]">
          <div className="flex items-center gap-4">
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={14} className="fill-acid-type text-acid-type" />
              ))}
            </span>
            <span className="t-eyebrow text-mute">{site.rating}</span>
          </div>

          <WordReveal as="h2" className="t-hero mt-8 text-text" text={copy.heading} />

          <p className="t-lead mt-8 max-w-[520px] text-mute">{copy.standfirst}</p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <div className="flex">
              {(["release-01", "release-02", "release-06"] as const).map((a, i) => (
                <Picture
                  key={i}
                  src={a}
                  sizes="(max-width: 767px) 100vw, 62vw"
                  alt=""
                  className="h-11 w-11 border border-surface-deep object-cover chroma"
                  style={{ marginLeft: i === 0 ? 0 : -10 }}
                />
              ))}
            </div>
            <div>
              <div className="font-display text-[14px] font-bold uppercase text-text">
                Rana, Kaalo &amp; Shona
              </div>
              <div className="font-ui text-[12px] text-mute">Booked the room this month.</div>
            </div>
          </div>

          <a
            href="/contact"
            className="group mt-10 flex h-[62px] w-full max-w-[320px] items-center justify-between bg-acid transition-colors duration-300 hover:bg-acid-dim"
          >
            <span className="pl-6 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text">
              Book the room
            </span>
            <ArrowRight size={18} className="mr-6 text-accent-text lb-arrow" />
          </a>

          <div className="mt-12 flex flex-wrap items-start justify-between gap-10">
            <ul className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              {ctaChecklist.map((c) => (
                <li key={c} className="flex items-center gap-3 font-ui text-[15px] text-text">
                  <Check size={14} className="shrink-0 text-acid-type" />
                  {c}
                </li>
              ))}
            </ul>
            <LiveLog />
          </div>
        </div>
      </div>

      <div className="relative z-[2] flex h-12 items-center border-y border-line">
        <Ticker duration={40}>
          {ctaChecklist.map((c) => (
            <span key={c} className="flex shrink-0 items-center gap-6 pr-6">
              <span className="t-label whitespace-nowrap text-mute">{c}</span>
              <span className="h-[9px] w-[9px] shrink-0 border border-acid-type" />
            </span>
          ))}
        </Ticker>
      </div>
    </section>
  );
}
