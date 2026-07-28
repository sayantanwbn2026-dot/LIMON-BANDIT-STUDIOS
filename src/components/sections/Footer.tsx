import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { GridRules } from "@/components/lb/GridRules";
import { Logotype } from "./Nav";
import { navItems, site } from "@/data/site";
import { releases } from "@/data/releases";
import mascot from "@/assets/limon-mascot.png";

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-line bg-surface-deep">
      <GridRules tone="dark" />

      <div className="shell relative z-[2] pt-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
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
              <ArrowRight size={15} className="text-acid-type transition-transform duration-300 group-hover:translate-x-1" />
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
              <div>{site.instagram}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[2] mt-20 flex items-end justify-between">
        <span
          aria-hidden="true"
          className="block w-full select-none whitespace-nowrap px-[var(--page-margin)] font-display font-extrabold uppercase leading-[0.8] tracking-[-0.05em]"
          style={{
            fontSize: "clamp(90px, 15vw, 260px)",
            color: "var(--emboss)",
            marginBottom: "-0.18em",
          }}
        >
          Limon Bandit
        </span>
        <img
          src={mascot}
          alt=""
          aria-hidden="true"
          width={1024}
          height={1280}
          loading="lazy"
          className="pointer-events-none absolute bottom-0 right-[var(--page-margin)] h-[8vw] max-h-[120px] w-auto opacity-[0.12]"
        />
      </div>

      <div className="relative z-[2] border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-4 py-7 font-ui text-[12px] text-mute">
          <span>©2026 Limon Bandit. All rights reserved.</span>
          <span className="flex gap-6">
            <a href="/contact" className="transition-colors duration-300 hover:text-text">
              Terms
            </a>
            <a href="/contact" className="transition-colors duration-300 hover:text-text">
              Privacy
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
