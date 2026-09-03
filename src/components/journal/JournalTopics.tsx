import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { posts } from "@/data/journal";

/**
 * The beats, still inverted. Counts come from the entries themselves so the
 * page cannot claim a column it has not written.
 */
const BEATS: { category: string; blurb: string }[] = [
  {
    category: "Gear",
    blurb: "What is actually on the desk, why it is there, and what we stopped using.",
  },
  {
    category: "Label",
    blurb: "Splits, statements, and the arithmetic behind releasing a record ourselves.",
  },
  {
    category: "City",
    blurb: "Recording in Kolkata — the noise floor, the power cuts, the 3am rates.",
  },
  {
    category: "Merch",
    blurb: "Print runs, screens, and why a hundred and fifty is the honest number.",
  },
];

export function JournalTopics() {
  const countFor = (c: string) =>
    String(posts.filter((p) => p.category === c).length).padStart(2, "0");

  return (
    <section className="relative w-full bg-alt-surface-deep py-[120px]">
      <GridRules tone="light" />
      <BoundaryRule tone="light" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="light" surface="bg-alt-surface-deep">
              The beats
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-alt-text">Four things we keep returning to</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-alt-mute">
              No opinion pieces and no industry commentary. Only things we did here.
            </p>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-1 border-t border-alt-line sm:grid-cols-2 lg:grid-cols-4 lg:border-b">
          {BEATS.map((b, i) => (
            <div
              key={b.category}
              className={`border-b border-alt-line py-10 lg:border-b-0 ${
                i > 0 ? "lg:border-l lg:pl-8" : "lg:pr-8"
              } ${i < 3 ? "lg:pr-8" : ""}`}
            >
              <dt className="flex items-baseline gap-3">
                <span className="font-display text-[20px] font-extrabold uppercase tracking-[-0.02em] text-alt-text">
                  {b.category}
                </span>
                <span className="tnum t-label text-alt-acid-type">{countFor(b.category)}</span>
              </dt>
              <dd className="mt-4 max-w-[32ch] font-ui text-[15px] leading-[1.5] text-alt-mute">
                {b.blurb}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
