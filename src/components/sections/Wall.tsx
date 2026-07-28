import { Section, Eyebrow } from "@/components/lb/Section";
import { MaskReveal } from "@/components/lb/MaskReveal";
import { LocalTime } from "@/components/lb/LocalTime";
import { wall } from "@/data/wall";

export function Wall() {
  return (
    <Section id="wall" tone="dark" surface="bg-surface" index="15" name="The Wall">
      <div className="py-[120px] md:py-[160px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow tone="dark" surface="bg-surface">
              Unedited house archive
            </Eyebrow>
            <h2 className="t-h2 mt-6 max-w-[16ch] text-text">The wall</h2>
          </div>
          <LocalTime className="text-mute" />
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {wall.map((shot, i) => (
            <figure
              key={shot.src}
              className={`group relative border border-line ${shot.span ? "col-span-2" : ""}`}
            >
              <MaskReveal
                src={shot.src}
                alt={shot.alt}
                delay={(i % 4) * 0.06}
                className="w-full"
                style={{ aspectRatio: shot.span ? "16 / 10" : "4 / 5" }}
                imgClassName="h-full w-full object-cover transition-all duration-[700ms] group-hover:scale-[1.04]"
              />
              <figcaption className="pointer-events-none absolute bottom-0 left-0 bg-surface-deep px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-mute opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {shot.caption}
              </figcaption>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 border-2 border-acid-type opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </figure>
          ))}
        </div>
      </div>
    </Section>
  );
}
