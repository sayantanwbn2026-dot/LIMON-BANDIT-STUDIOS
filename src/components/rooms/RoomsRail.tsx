import { Check } from "lucide-react";
import { Eyebrow } from "@/components/lb/Section";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { useRooms, useSection, type RoomDoc, useWords } from "@/cms/hooks";

type RoomsWords = ReturnType<typeof useWords<"rooms">>;

/* `word` names the row's heading in the rooms wording. Gear reads the
 * second spec line — guarded, because a room an editor added with one
 * spec line used to take the whole table down. */
const ROWS = [
  { id: "rate", word: "railRate", get: (r: RoomDoc) => r.rate, numeric: true },
  { id: "capacity", word: "railCapacity", get: (r: RoomDoc) => r.capacity, numeric: true },
  {
    id: "engineer",
    word: "railEngineer",
    get: (r: RoomDoc, w: RoomsWords) => (r.engineer ? w.railIncluded : "—"),
  },
  { id: "gear", word: "railGear", get: (r: RoomDoc) => r.specs?.[1]?.v ?? "—" },
  { id: "best", word: "railBestFor", get: (r: RoomDoc) => r.bestFor },
] as const;

/**
 * The decision table. Someone lands on this page to work out which room they
 * want and what it costs; that question gets answered before any photography.
 *
 * Rooms are columns and attributes are rows, so the eye compares across one
 * line. The table scrolls inside its own container below 1024px rather than
 * pushing the page sideways.
 */
export function RoomsRail() {
  const rooms = useRooms();
  const copy = useSection("rooms", "rail");
  const w = useWords("rooms");
  return (
    <section className="relative w-full bg-surface py-[96px]">
      <GridRules tone="dark" />
      <BoundaryRule tone="dark" className="top-0" />

      <div className="shell relative z-[2]">
        <Eyebrow tone="dark" surface="bg-surface">
          {copy.eyebrow}
        </Eyebrow>
        <h2 className="t-h2 mt-6 max-w-[20ch] text-text">{copy.heading}</h2>

        {/* desktop: one table, compared across */}
        <div className="mt-12 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">{w.railCaption}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="t-label w-[140px] py-6 pr-6 font-semibold text-mute">
                  Room
                </th>
                {rooms.map((r) => (
                  <th key={r.id} scope="col" className="py-6 pr-6 align-bottom">
                    <a href={`#room-${r.id}`} className="group block">
                      <span className="tnum block font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-acid-type">
                        {r.index}
                      </span>
                      <span className="mt-2 block font-display text-[20px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-text transition-transform duration-300 group-hover:translate-x-1">
                        {r.name}
                      </span>
                      <span className="t-label mt-2 block font-normal text-mute">{r.kind}</span>
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.id} data-reveal="fade" className="border-b border-line align-top">
                  <th scope="row" className="t-label py-6 pr-6 font-semibold text-mute">
                    {w[row.word]}
                  </th>
                  {rooms.map((r) => {
                    const v = row.get(r, w);
                    const isRate = row.id === "rate";
                    return (
                      <td
                        key={r.id}
                        className={`py-6 pr-6 font-ui text-[14px] leading-[1.5] ${
                          "numeric" in row && row.numeric ? "tnum" : ""
                        } ${isRate ? "font-bold uppercase tracking-[0.06em] text-acid-type" : "text-text"}`}
                      >
                        {row.id === "engineer" && r.engineer ? (
                          <span className="inline-flex items-center gap-2">
                            <Check size={14} className="text-acid-type" />
                            {w.railIncluded}
                          </span>
                        ) : (
                          v
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile: the same content, stacked */}
        <ul className="mt-12 md:hidden">
          {rooms.map((r) => (
            <li key={r.id} data-reveal className="border-t border-line py-8">
              <a href={`#room-${r.id}`} className="block">
                <span className="tnum font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-acid-type">
                  {r.index}
                </span>
                <h3 className="mt-2 font-display text-[24px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] text-text">
                  {r.name}
                </h3>
                <p className="t-label mt-1 text-mute">{r.kind}</p>
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
                  {ROWS.map((row) => (
                    <div key={row.id} className="border-b border-line pb-2">
                      <dt className="font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-mute">
                        {w[row.word]}
                      </dt>
                      <dd
                        className={`tnum mt-1 font-ui text-[13px] ${
                          row.id === "rate" ? "font-bold text-acid-type" : "text-text"
                        }`}
                      >
                        {row.get(r, w)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
