import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { GridRules } from "@/components/lb/GridRules";
import { Logotype } from "./Nav";
import { useNavItems, useReleases, useSite, useSocialLink } from "@/cms/hooks";
import { Picture } from "@/components/lb/Picture";

export function Footer() {
  const releases = useReleases();
  const site = useSite();
  const navItems = useNavItems();
  const instagram = useSocialLink("Instagram");
  return (
    <footer className="relative w-full overflow-hidden border-t border-line bg-surface-deep">
      <GridRules tone="dark" />

      <div className="shell relative z-[2] pt-24">
        {/* footer-cols: two columns on a phone, see styles.css */}
        <div className="section-head footer-cols">
          <div>
            <div className="text-text">
              <Logotype />
            </div>
            <p className="mt-6 max-w-[28ch] font-ui text-[14px] leading-[1.5] text-mute">
              {site.description}
            </p>
            <a
              href="/contact"
              className="group mt-8 flex w-fit items-center gap-3 border border-line px-6 py-4 transition-colors duration-300 hover:border-acid-type"
            >
              <span className="t-eyebrow text-text">Let&apos;s collaborate</span>
              <ArrowRight size={15} className="text-acid-type lb-arrow" />
            </a>
          </div>

          <nav aria-label="Footer navigation">
            <h2 className="t-label text-mute">Navigation</h2>
            <ul className="mt-6 space-y-3">
              {navItems.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    className="font-ui text-[14px] text-text transition-colors duration-300 hover:text-acid-type"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="t-label text-mute">The roster</h2>
            <ul className="mt-6 space-y-3">
              {releases.map((r) => (
                <li key={r.artist} className="font-ui text-[14px] text-text">
                  {r.artist}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="t-label text-mute">Studio</h2>
            <div className="mt-6 space-y-3 font-ui text-[14px] text-text">
              <div className="flex items-start gap-3">
                <MapPin size={14} className="mt-1 shrink-0 text-acid-type" />
                <span>
                  {site.address.map((l) => (
                    <span key={l} className="block text-mute">
                      {l}
                    </span>
                  ))}
                </span>
              </div>
              <div>{site.phone}</div>
              <div>{site.email}</div>
              {instagram ? <div>{instagram.handle || instagram.platform}</div> : null}
            </div>
          </div>
        </div>
      </div>

      {/* The mascot, on his own line. He used to be absolutely positioned
       * over the wordmark's last letter, which put a picture on top of a
       * word — two marks fighting for the same corner. */}
      <div className="relative z-[2] mt-16 flex justify-end px-[var(--page-margin)]">
        <Picture
          src="limon-mascot"
          sizes="120px"
          alt=""
          className="pointer-events-none h-[10vw] max-h-[112px] w-auto opacity-[0.14]"
        />
      </div>

      <Wordmark name={site.name} />

      <div className="relative z-[2] border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-4 py-6 font-ui text-[12px] text-mute">
          <span>©2026 Limon Bandit. All rights reserved.</span>
          <span className="flex flex-wrap gap-x-6 gap-y-2">
            {/* Real policy pages now (/legal, CMS-edited). These used to be
             * two links to /contact labelled Terms and Privacy. */}
            <Link
              to="/legal/$slug"
              params={{ slug: "terms" }}
              className="tap transition-colors duration-300 hover:text-text"
            >
              Terms
            </Link>
            <Link
              to="/legal/$slug"
              params={{ slug: "privacy" }}
              className="tap transition-colors duration-300 hover:text-text"
            >
              Privacy
            </Link>
            <Link
              to="/legal/$slug"
              params={{ slug: "shipping-returns" }}
              className="tap transition-colors duration-300 hover:text-text"
            >
              Shipping &amp; returns
            </Link>
          </span>
        </div>
      </div>
    </footer>
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

  return (
    <div aria-hidden="true" className="relative z-[2] select-none px-[var(--page-margin)] pt-6">
      <svg
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
