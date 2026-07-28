import { Section, Eyebrow } from "@/components/lb/Section";
import { PushIn, WordReveal } from "@/components/lb/Reveal";
import { services } from "@/data/services";

export function Services() {
  return (
    <Section surface="bg-surface" className="py-[140px]">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Eyebrow>What we run</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal
            as="h2"
            className="t-h2 text-text"
            text={"Turning a room, a roster,\nand a print run\ninto one house"}
          />
        </div>
        <div className="flex items-end md:col-span-1">
          <p className="font-ui text-[16px] leading-[1.5] text-mute">
            Four operations, one building. Each one exists because the last one needed it. Not sure
            which one you need? Pick your door below.
          </p>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-px bg-line md:grid-cols-2">
        {services.map((s, i) => (
          <PushIn key={s.index} className="h-full" delay={i * 0.12} dir={i % 2 === 0 ? "left" : "right"}>
            <article className="group relative flex h-full min-h-[340px] flex-col bg-surface-raised p-10 transition-colors duration-300 hover:border-line-strong">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 h-[18px] w-[18px] border-r border-t border-acid-type opacity-0 transition-opacity duration-[350ms] group-hover:opacity-100"
              />
              <span className="font-display text-[15px] font-bold text-acid-type transition-colors duration-300 group-hover:text-text">
                {s.index}
              </span>
              <h3 className="t-h3 mt-8 text-text">{s.title}</h3>
              <p className="mt-4 max-w-[46ch] font-ui text-[16px] leading-[1.5] text-mute">
                {s.description}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-8">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="t-label rounded-[2px] border border-line px-[14px] py-2 text-mute"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>
          </PushIn>
        ))}
      </div>
    </Section>
  );
}
