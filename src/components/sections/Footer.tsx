import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight, AtSign, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { GridRules } from "@/components/lb/GridRules";
import { Logotype } from "./Nav";
import { useNavItems, useReleases, useSite, useSocialLink, useWords } from "@/cms/hooks";
import { HouseMascot } from "@/components/lb/HeroMascot";
import { mailHref, mapsHref, telHref } from "@/lib/contact";
import { ensureGsap, ScrollTrigger } from "@/lib/motion";
import { fill } from "@/cms/words";

export function Footer() {
  const releases = useReleases();
  const site = useSite();
  const w = useWords("footer");
  const navItems = useNavItems();
  const instagram = useSocialLink("Instagram");
  const tel = telHref(site.phone);
  const mail = mailHref(site.email);
  const maps = mapsHref(site.address);
  return (
    <footer className="relative w-full overflow-hidden border-t border-line bg-surface-deep">
      <GridRules tone="dark" />

      <div className="shell relative z-[2] pt-16 md:pt-24">
        {/* footer-cols: two columns on a phone, see styles.css */}
        <div className="section-head footer-cols">
          <div data-reveal>
            <div className="text-text">
              <Logotype />
            </div>
            <p className="section-lede mt-6 max-w-[28ch] font-ui text-[14px] leading-[1.5] text-mute">
              {site.description}
            </p>
            <Link
              to="/contact"
              className="group mt-8 flex w-fit items-center gap-3 whitespace-nowrap border border-line px-6 py-4 transition-colors duration-300 hover:border-acid-type"
            >
              <span className="t-eyebrow text-text">{w.cta}</span>
              <ArrowRight size={15} className="text-acid-type lb-arrow" />
            </Link>
          </div>

          {/* On a phone the links are a two-column grid ruled like the
           * menu, every row a full 44px target; from 768px they are the
           * plain stacked list they always were. */}
          <nav aria-label={w.navLabel} data-reveal>
            <h2 className="t-label text-mute">{w.navHeading}</h2>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 max-md:mt-4 md:block md:space-y-3">
              {navItems.map((n) => (
                <li key={n.to} className="max-md:border-t max-md:border-line">
                  <Link
                    to={n.to}
                    className="font-ui text-[14px] text-text transition-colors duration-300 hover:text-acid-type data-[status=active]:text-acid-type"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Six names stacked one per line were 200px of a phone footer
           * for one fact — who is on the label. Run on, they are two
           * lines, and every name still goes to the label page. */}
          <div data-reveal>
            <h2 className="t-label text-mute">{w.rosterHeading}</h2>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 max-md:mt-4 md:block md:space-y-3">
              {releases.map((r) => (
                <li key={r.artist} className="font-ui text-[14px] text-text">
                  <Link to="/label" className="transition-colors duration-300 hover:text-acid-type">
                    {r.artist}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Every line here is a way to reach the house, so every line is
           * a link: directions, a call, a mail, the profile. They were
           * printed as plain text, which on a phone meant copying a number
           * out by hand from the bottom of the page. */}
          <div data-reveal>
            <h2 className="t-label text-mute">{w.studioHeading}</h2>
            <ul className="mt-6 space-y-3 font-ui text-[14px] text-text max-md:mt-4 max-md:space-y-0">
              <li>
                <FootContact href={maps} external icon={<MapPin size={14} />}>
                  {site.address.map((l) => (
                    <span key={l} className="block text-mute">
                      {l}
                    </span>
                  ))}
                </FootContact>
              </li>
              {tel ? (
                <li>
                  <FootContact href={tel} icon={<Phone size={14} />}>
                    <span className="tnum">{site.phone}</span>
                  </FootContact>
                </li>
              ) : null}
              {mail ? (
                <li>
                  <FootContact href={mail} icon={<Mail size={14} />}>
                    <span className="break-all">{site.email}</span>
                  </FootContact>
                </li>
              ) : null}
              {instagram ? (
                <li>
                  <FootContact href={instagram.url} external icon={<AtSign size={14} />}>
                    {(instagram.handle || instagram.platform).replace(/^@/, "")}
                  </FootContact>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      {/* The mascot, on his own line. He used to be absolutely positioned
       * over the wordmark's last letter, which put a picture on top of a
       * word — two marks fighting for the same corner. */}
      <div className="relative z-[2] mt-8 flex justify-end px-[var(--page-margin)] md:mt-16">
        <HouseMascot
          sizes="120px"
          className="pointer-events-none h-[10vw] max-h-[112px] w-auto opacity-[0.14]"
        />
      </div>

      <Wordmark name={site.name} />

      <div className="relative z-[2] border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-4 py-6 font-ui text-[12px] text-mute">
          <span>{fill(w.copyright, { year: new Date().getFullYear() })}</span>
          <span className="flex flex-wrap gap-x-6 gap-y-2">
            {/* Real policy pages now (/legal, CMS-edited). These used to be
             * two links to /contact labelled Terms and Privacy. */}
            <Link
              to="/legal/$slug"
              params={{ slug: "terms" }}
              className="tap transition-colors duration-300 hover:text-text"
            >
              {w.terms}
            </Link>
            <Link
              to="/legal/$slug"
              params={{ slug: "privacy" }}
              className="tap transition-colors duration-300 hover:text-text"
            >
              {w.privacy}
            </Link>
            <Link
              to="/legal/$slug"
              params={{ slug: "shipping-returns" }}
              className="tap transition-colors duration-300 hover:text-text"
            >
              {w.shippingReturns}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

/** One line of the studio block: an icon in acid, the detail, a real link.
 * The 44px floor is for phones, where these are the targets that matter. */
function FootContact({
  href,
  icon,
  external,
  children,
}: {
  href: string;
  icon: ReactNode;
  external?: boolean;
  children: ReactNode;
}) {
  const body = (
    <>
      <span className="mt-1 shrink-0 text-acid-type">{icon}</span>
      <span className="min-w-0">{children}</span>
    </>
  );
  const cls =
    "flex items-start gap-3 transition-colors duration-300 hover:text-acid-type max-md:min-h-11 max-md:py-2.5";
  if (!href) return <div className={cls}>{body}</div>;
  return (
    <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
      {body}
    </a>
  );
}

/**
 * The name across the foot of the page, fitting the page exactly.
 *
 * It was a <span> at `clamp(90px, 15vw, 260px)` with `whitespace-nowrap`,
 * and the two halves of that disagree: the font size was derived from the
 * VIEWPORT width while the text width is a property of the STRING. At 1440
 * "Limon Bandit" came out around 1,420px against a 1,300px measure, so the
 * footer's `overflow-hidden` took the end off it — the screenshot that
 * prompted this reads "LIMON BAND" and half a D.
 *
 * Tuning the vw coefficient would fix it for these twelve characters and
 * break again the moment anybody edits the studio name, which is a CMS
 * field and therefore a thing that WILL change.
 *
 * So: SVG, with `textLength` set to the viewBox width. The renderer is
 * then obliged to make the line exactly that wide whatever the string, and
 * the box scales to the page. `lengthAdjust="spacing"` puts the difference
 * into the gaps between letters rather than stretching the glyphs — the
 * letterforms stay Sora's, and tracking is something this design already
 * does deliberately.
 *
 * The viewBox height is the cap height at this weight, so the baseline
 * lands on the rule below without the negative margin the old markup used
 * to drag it there.
 */
function Wordmark({ name }: { name: string }) {
  const text = (name || "Limon Bandit").trim();
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /* It rises out of the rule as you reach the end of the page, scrubbed to
   * the last stretch of scroll, so the name is the last thing to arrive
   * and lands flush on the line exactly when the page runs out. The box
   * clips at that line, which is what makes it read as coming up from
   * behind it rather than sliding over it. The end is capped at the
   * page's own maximum scroll: a short page that cannot scroll that far
   * would otherwise leave the name stranded half-risen. */
  useEffect(() => {
    const box = boxRef.current;
    const svg = svgRef.current;
    const gsap = ensureGsap();
    if (!box || !svg || !gsap) return;
    const mm = gsap.matchMedia(box);
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        svg,
        { yPercent: 80 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: box,
            start: "top bottom",
            end: () =>
              Math.min(
                ScrollTrigger.maxScroll(window),
                box.getBoundingClientRect().bottom + window.scrollY - window.innerHeight,
              ),
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className="relative z-[2] select-none overflow-hidden px-[var(--page-margin)] pt-6"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1000 116"
        preserveAspectRatio="xMidYMax meet"
        className="block h-auto w-full overflow-visible"
        role="presentation"
      >
        <text
          x="0"
          y="104"
          textLength="1000"
          lengthAdjust="spacing"
          fill="var(--emboss-deep)"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "128px",
            textTransform: "uppercase",
          }}
        >
          {text.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
