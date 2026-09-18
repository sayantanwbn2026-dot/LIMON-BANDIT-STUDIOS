import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { Eyebrow } from "@/components/lb/Section";
import { disciplines, type Discipline } from "@/data/crew";
import { useCrew, useSection } from "@/cms/hooks";

/**
 * The directory.
 *
 * Deliberately not portrait cards: there are no real photographs of these
 * people in the asset set, and inventing them would be the one dishonest
 * thing on a page whose whole claim is that the roster is vetted. A hiring
 * list wants names, rates and availability anyway — so it is set as a ledger,
 * the same instrument the Rooms hero uses to price a room.
 */
const statusTint: Record<string, string> = {
  Open: "text-acid-type",
  Limited: "text-text",
  Booked: "text-mute",
};

type Filter = Discipline | "All";

export function CrewDirectory() {
  const copy = useSection("crew", "directory");
  const crew = useCrew();
  const [filter, setFilter] = useState<Filter>("All");
  const filters: Filter[] = ["All", ...disciplines];
  const shown = filter === "All" ? crew : crew.filter((c) => c.discipline === filter);

  return (
    <section id="directory" className="relative w-full bg-surface-deep py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <div className="section-head">
          <div className="md:col-span-1">
            <Eyebrow tone="dark" surface="bg-surface-deep">
              {copy.eyebrow}
            </Eyebrow>
          </div>
          <div className="md:col-span-2">
            <h2 className="t-h2 text-text">{copy.heading}</h2>
          </div>
          <div className="flex items-end md:col-span-1">
            <p className="font-ui text-[16px] leading-[1.5] text-mute">{copy.standfirst}</p>
          </div>
        </div>

        {/* discipline filter */}
        <div className="mt-12 flex flex-wrap gap-3" role="group" aria-label="Filter by discipline">
          {filters.map((f) => {
            const on = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={on}
                className={`px-3 py-2 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 ${
                  on
                    ? "bg-acid text-accent-text"
                    : "border border-line text-mute hover:border-acid-type hover:text-text"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="t-label mt-6 text-mute">
          <span className="tnum">{String(shown.length).padStart(2, "0")}</span> available
          {filter === "All" ? " across four disciplines" : ` — ${filter}`}
        </p>

        <ul className="mt-8 border-t border-line">
          {shown.map((m) => (
            <li key={m.id} className="border-b border-line">
              <article className="group grid grid-cols-1 gap-x-6 gap-y-4 py-8 md:grid-cols-12 md:items-baseline">
                <div className="md:col-span-4">
                  <h3 className="font-display text-[20px] font-bold leading-[1.1] tracking-[-0.02em] text-text">
                    {m.name}
                  </h3>
                  <p className="t-label mt-2 text-acid-type">{m.discipline}</p>
                </div>

                <div className="md:col-span-5">
                  <p className="max-w-[46ch] font-ui text-[15px] leading-[1.5] text-mute">
                    {m.focus}
                  </p>
                  {/* No opacity on these: --mute at 70% drops 11px type to
                   * 4.27:1 on ink and 2.6:1 on bone, both under AA. */}
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {m.credits.map((c) => (
                      <li key={c} className="t-label text-mute">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-3 md:text-right">
                  <span className="tnum block font-ui text-[15px] font-semibold text-text">
                    {m.rate}
                  </span>
                  <span className={`t-label mt-2 block ${statusTint[m.status]}`}>{m.status}</span>
                  {m.status !== "Booked" ? (
                    <a
                      href={`/contact?intent=crew&who=${m.id}`}
                      className="mt-4 inline-flex items-center gap-2 t-action text-text"
                    >
                      <span className="wipe-underline">Hire</span>
                      <ArrowUpRight size={14} className="text-acid-type" />
                    </a>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
