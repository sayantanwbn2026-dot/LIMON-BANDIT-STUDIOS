import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BoundaryRule, GridRules } from "@/components/lb/GridRules";
import { useLegal, type LegalDoc } from "@/cms/hooks";

/**
 * Terms, privacy, shipping & returns.
 *
 * Built for reading, like a journal entry, but kept on the primary pole: a
 * policy is reference material, not a chapter of the house, so it wears the
 * site's default ground rather than the Journal's bone panel. One column at
 * a readable measure, headings in the house display face, and the other
 * policies linked at the foot so nobody has to go back to the footer to
 * find the returns page from the privacy page.
 */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const all = useLegal();
  const others = all.filter((d) => d.slug !== doc.slug);
  const updated = formatDate(doc.updated);

  return (
    <main id="main" className="relative w-full bg-surface-deep pt-[var(--nav-h)]">
      <article className="relative w-full overflow-hidden">
        <GridRules tone="dark" />

        <header className="shell relative z-[2] pb-14 pt-[72px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
              <li>
                <Link to="/" className="tap transition-colors duration-300 hover:text-text">
                  LMN&middot;BNDT
                </Link>
              </li>
              <li aria-hidden="true" className="opacity-50">
                /
              </li>
              <li>Legal</li>
              <li aria-hidden="true" className="opacity-50">
                /
              </li>
              <li aria-current="page" className="text-text">
                {doc.title}
              </li>
            </ol>
          </nav>

          <h1
            data-page-h1
            tabIndex={-1}
            className="mt-10 max-w-[20ch] font-display text-[34px] font-extrabold uppercase leading-[1.02] tracking-[-0.03em] text-text outline-none md:text-[52px]"
          >
            {doc.title}
          </h1>

          {doc.standfirst ? (
            <p className="mt-6 max-w-[56ch] font-ui text-[17px] leading-[1.55] text-mute">
              {doc.standfirst}
            </p>
          ) : null}

          {updated ? (
            <p className="t-label tnum mt-8 border-t border-line pt-4 text-mute">
              Last updated <time dateTime={doc.updated}>{updated}</time>
            </p>
          ) : null}
        </header>

        <div className="shell relative z-[2] pb-[96px]">
          <div className="max-w-[68ch] lg:ml-[calc(25%+var(--grid-gutter))]">
            {doc.body.map((b, i) => (
              <Block key={i} kind={b.kind} text={b.text} />
            ))}
          </div>
        </div>

        <BoundaryRule tone="dark" className="bottom-0" />
      </article>

      {others.length ? (
        <nav
          aria-label="Other policies"
          className="relative w-full border-t border-line bg-surface"
        >
          <ul className="shell grid grid-cols-1 md:grid-cols-2">
            {others.map((o, i) => (
              <li key={o.slug}>
                <Link
                  to="/legal/$slug"
                  params={{ slug: o.slug }}
                  className={`group flex items-center justify-between gap-6 py-10 transition-colors duration-300 hover:text-acid-type ${
                    i % 2 ? "md:border-l md:border-line md:pl-10" : "md:pr-10"
                  } ${i ? "border-t border-line md:border-t-0" : ""}`}
                >
                  <span className="font-display text-[22px] font-extrabold uppercase tracking-[-0.02em] text-text md:text-[28px]">
                    {o.title}
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-acid-type lb-arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}

function Block({ kind, text }: { kind: string; text: string }) {
  switch (kind) {
    case "h2":
      return (
        <h2 className="mt-14 font-display text-[20px] font-extrabold uppercase leading-[1.1] tracking-[-0.02em] text-text first:mt-0 md:text-[24px]">
          {text}
        </h2>
      );
    case "list":
      return (
        <ul className="mt-6 border-t border-line">
          {text
            .split("\n")
            .map((it) => it.trim())
            .filter(Boolean)
            .map((it) => (
              <li
                key={it}
                className="flex gap-4 border-b border-line py-4 font-ui text-[16px] leading-[1.55] text-mute"
              >
                <span aria-hidden="true" className="mt-[10px] h-[6px] w-[6px] shrink-0 bg-acid" />
                <span>{it}</span>
              </li>
            ))}
        </ul>
      );
    default:
      return <p className="mt-5 font-ui text-[16px] leading-[1.7] text-mute">{text}</p>;
  }
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
