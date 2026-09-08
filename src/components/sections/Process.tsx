import { Section, Eyebrow } from "@/components/lb/Section";
import { PushIn, WordReveal } from "@/components/lb/Reveal";
import { CmsImage } from "@/components/lb/CmsImage";
import { useProcess, useSection } from "@/cms/hooks";

export function Process() {
  const copy = useSection("home", "process");
  const processSteps = useProcess();
  return (
    /* bg-surface: --mute at 16px measures 4.39:1 on --surface-deep in light
     * mode, just under AA. Same one-step-lighter fix as Rates. The token
     * pairing itself is the real issue — see the note in AUDIT. */
    <Section tone="dark" surface="bg-surface" className="py-[96px]">
      <div className="section-head">
        <div className="md:col-span-1">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </div>
        <div className="md:col-span-3">
          <WordReveal as="h2" className="t-h2 text-text" text={copy.heading} />
        </div>
      </div>

      <div className="mt-12">
        {processSteps.map((s, i) => (
          <PushIn key={s.index} delay={i * 0.1}>
            <div className="group grid grid-cols-1 items-center gap-6 border-b border-line py-12 transition-colors duration-300 hover:bg-surface-raised md:grid-cols-4">
              <span className="font-display text-[14px] font-bold text-acid-type transition-transform duration-300 group-hover:scale-110">
                {s.index}
              </span>
              <h3 className="font-display text-[28px] font-bold uppercase leading-[1.05] tracking-[-0.03em] text-text">
                {s.title}
              </h3>
              <p className="font-ui text-[16px] leading-[1.5] text-mute">{s.description}</p>
              <div className="flex md:justify-end">
                <CmsImage
                  src={s.thumb}
                  sizes="120px"
                  alt={s.alt}
                  className="h-[120px] w-[120px] scale-90 border border-line object-cover opacity-0 chroma transition-all duration-[400ms] group-hover:scale-100 group-hover:opacity-100"
                />
              </div>
            </div>
          </PushIn>
        ))}
      </div>
    </Section>
  );
}
