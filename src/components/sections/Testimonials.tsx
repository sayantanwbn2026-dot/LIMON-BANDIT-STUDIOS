import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { GridRules } from "@/components/lb/GridRules";
import { CmsImage } from "@/components/lb/CmsImage";
import { WordReveal } from "@/components/lb/Reveal";
import { Ticker } from "@/components/lb/Ticker";
import { useSection, useTestimonials, useTickers } from "@/cms/hooks";

/**
 * The roster talks — one voice at a time.
 *
 * It was five quotes stacked down the page at display scale: about 900px on
 * a desktop and two and a half screens on a phone, to say five versions of
 * the same thing. Nobody reads the fifth. Stacking testimonials is the
 * default because it is the easiest thing to build, not because anyone
 * wants it — past the second one it is a wall the eye slides off.
 *
 * So: a switchboard. The speakers are a row of faces, the quote is the
 * section, and picking a face swaps it. Five quotes now cost the height of
 * one, the portraits from the CMS finally do a job instead of decorating,
 * and there is something to press — which is the difference between a page
 * you read and a page you use.
 *
 * IT DOES NOT ADVANCE BY ITSELF
 * An auto-rotating carousel takes the quote away mid-sentence and gives the
 * reader no way to predict it. It is one of the few interface patterns that
 * is reliably worse than the thing it replaced. This one moves when someone
 * moves it, and it says how many there are so nobody has to guess whether
 * they have seen them all.
 *
 * ON THE ACID SURFACE, NOTHING IS DIMMED
 * There is no muted token for the acid pole, and dropping --accent-text to
 * 60% would land it under AA on #E9FF00. Hierarchy comes from size and
 * weight only — every piece of type is full-strength ink. The unselected
 * faces carry a border rather than a fade, for the same reason.
 */
const RULE = "rgba(0,0,0,0.22)";

export function Testimonials() {
  const copy = useSection("home", "testimonials");
  const { testimonialTicker } = useTickers();
  const testimonials = useTestimonials();

  const [at, setAt] = useState(0);
  const quoteRef = useRef<HTMLElement>(null);

  const count = testimonials.length;
  /* The CMS can shrink the list under a running page. */
  useEffect(() => {
    if (at > count - 1) setAt(0);
  }, [at, count]);

  if (count === 0) return null;
  const t = testimonials[Math.min(at, count - 1)];
  const go = (n: number) => setAt(((n % count) + count) % count);

  return (
    <section className="relative w-full bg-acid pt-[120px]">
      <GridRules tone="acid" />

      <div className="shell relative z-[2] pb-[120px]">
        <div className="section-head">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-accent-text" />
              <span className="t-eyebrow text-accent-text">{copy.eyebrow}</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <WordReveal as="h2" className="t-h2 text-accent-text" text={copy.heading} />
          </div>
          <div className="flex items-end md:col-span-1">
            <a
              href="/label"
              className="group inline-flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.14em] text-accent-text"
            >
              <span className="wipe-underline">See the roster</span>
              <ArrowRight size={14} className="lb-arrow" />
            </a>
          </div>
        </div>

        {/* ---- the switchboard ---- */}
        <div
          className="mt-8 border-t pt-6 md:mt-14 md:pt-10"
          style={{ ["--rule" as string]: RULE, borderColor: RULE }}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
            {/* who is talking. A horizontal strip on a phone, a column once
             * there is width — the same control either way. */}
            <ul
              aria-label="The people quoted"
              className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6 lg:mx-0 lg:flex-col lg:gap-2 lg:overflow-visible lg:px-0"
            >
              {testimonials.map((p, i) => {
                const on = i === Math.min(at, count - 1);
                return (
                  <li key={p.name} className="shrink-0">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setAt(i);
                        /* Move the reader to what they just asked for,
                         * without stealing the page's scroll position. */
                        quoteRef.current?.focus({ preventScroll: true });
                      }}
                      className={`flex w-full items-center gap-3 border p-2 text-left transition-colors duration-300 ${
                        on
                          ? "border-accent-text bg-accent-text/10"
                          : "border-transparent hover:border-accent-text/40"
                      }`}
                    >
                      <span className="h-11 w-11 shrink-0 overflow-hidden border border-[color:var(--rule)]">
                        <CmsImage
                          src={p.photo}
                          alt=""
                          sizes="44px"
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <span className="min-w-0 lg:flex-1">
                        <span className="block truncate font-ui text-[13px] font-bold uppercase tracking-[0.06em] text-accent-text">
                          {p.name}
                        </span>
                        <span className="hidden truncate font-ui text-[12px] text-accent-text lg:block">
                          {p.role}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* what they said */}
            <div>
              <article
                ref={quoteRef}
                tabIndex={-1}
                aria-live="polite"
                className="outline-none"
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    go(at + 1);
                  }
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    go(at - 1);
                  }
                }}
              >
                <blockquote>
                  <p className="max-w-[24ch] font-display text-[24px] font-extrabold uppercase leading-[1.08] tracking-[-0.03em] text-accent-text md:text-[38px]">
                    {t.quote}
                  </p>
                </blockquote>

                <div
                  className="mt-6 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-4 border-t pt-4 md:mt-8 md:pt-5"
                  style={{ borderColor: RULE }}
                >
                  <div>
                    <span className="block font-ui text-[14px] font-bold uppercase tracking-[0.06em] text-accent-text">
                      {t.name}
                    </span>
                    <span className="mt-1 block font-ui text-[13px] text-accent-text">
                      {t.role}
                      {t.rooms?.length ? ` · ${t.rooms.join(", ")}` : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="tnum block font-display text-[22px] font-extrabold tracking-[-0.03em] text-accent-text">
                      {t.resultValue}
                    </span>
                    <span className="t-label mt-1 block text-accent-text">
                      {t.resultLabel.replace("#", "")}
                    </span>
                  </div>
                </div>
              </article>

              {/* Where you are, and the two ways out of it. A count, because
               * "is there more?" is the question a one-at-a-time layout
               * creates and has to answer. */}
              {count > 1 ? (
                <div className="mt-4 flex items-center gap-4 lg:mt-6">
                  <div className="hidden items-center gap-4 lg:flex">
                    <Step onClick={() => go(at - 1)} label="The previous quote">
                      <ChevronLeft size={16} />
                    </Step>
                    <Step onClick={() => go(at + 1)} label="The next quote">
                      <ChevronRight size={16} />
                    </Step>
                  </div>
                  <span className="tnum font-ui text-[13px] font-semibold text-accent-text">
                    {Math.min(at, count - 1) + 1} / {count}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[2] flex h-12 items-center bg-surface-deep">
        <Ticker duration={38} reverse>
          {testimonialTicker.map((t2) => (
            <span key={t2} className="flex shrink-0 items-center gap-6 pr-6">
              <span className="t-label whitespace-nowrap text-mute">{t2}</span>
              <span className="h-[9px] w-[9px] shrink-0 bg-acid" />
            </span>
          ))}
        </Ticker>
      </div>
    </section>
  );
}

function Step({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center border text-accent-text transition-colors duration-300 hover:bg-accent-text/10"
      style={{ borderColor: RULE }}
    >
      {children}
    </button>
  );
}
