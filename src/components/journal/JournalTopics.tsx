import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { useBeats, usePosts, useSection } from "@/cms/hooks";

/**
 * The beats, still inverted. Counts come from the entries themselves so the
 * page cannot claim a column it has not written.
 */
export function JournalTopics() {
  const posts = usePosts();
  const BEATS = useBeats();
  const copy = useSection("journal", "topics");
  const countFor = (c: string) =>
    String(posts.filter((p) => p.category === c).length).padStart(2, "0");

  return (
    <section className="relative w-full bg-alt-surface-deep py-[96px]">
      <GridRules tone="light" />
      <BoundaryRule tone="light" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="light" surface="bg-alt-surface-deep">
              {copy.eyebrow}
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-alt-text">{copy.heading}</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-alt-mute">{copy.standfirst}</p>
          </div>
        </div>

        <dl className="mt-12 grid grid-cols-1 border-t border-alt-line sm:grid-cols-2 lg:grid-cols-4 lg:border-b">
          {BEATS.map((b, i) => (
            <div
              key={b.category}
              className={`border-b border-alt-line py-10 lg:border-b-0 ${
                i > 0 ? "lg:border-l lg:pl-8" : "lg:pr-8"
              } ${i < 3 ? "lg:pr-8" : ""}`}
            >
              <dt className="flex items-baseline gap-3">
                <span className="font-display text-[20px] font-bold tracking-[-0.02em] text-alt-text">
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
