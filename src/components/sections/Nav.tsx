import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { navItems, site } from "@/data/site";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { ThemeToggle } from "@/components/lb/ThemeToggle";
import mascot from "@/assets/limon-mascot.png";

const chipCls =
  "rounded-[2px] border border-line px-[18px] py-[10px] font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-mute transition-colors duration-[250ms] hover:border-line-strong hover:text-text";

export function Logotype({ size = 18 }: { size?: number }) {
  return (
    <span className="flex items-end gap-2">
      <span
        className="font-display font-extrabold uppercase leading-none tracking-[-0.04em]"
        style={{ fontSize: size }}
      >
        Limon Bandit
      </span>
      <span className="mb-[1px] h-[10px] w-[10px] shrink-0 bg-acid" />
    </span>
  );
}

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion() || !navRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { yPercent: -100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "expo.out" },
      );
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = menuRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const items = el.querySelectorAll<HTMLElement>("a, button");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    el?.querySelector<HTMLElement>("a")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        ref={navRef}
        className="fixed inset-x-0 top-0 z-[9990] h-[88px]"
        style={{
          backgroundColor: solid ? "rgba(5,5,5,0.88)" : "transparent",
          borderBottom: solid ? "1px solid var(--line)" : "1px solid transparent",
          backdropFilter: solid ? "blur(6px)" : "none",
          transition: "background-color 0.4s var(--ease-out-expo), border-color 0.4s linear",
        }}
      >
        <div className="shell flex h-full items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-text" aria-label={`${site.name} home`}>
              <Logotype />
            </Link>
            <div className="hidden items-center gap-2 xl:flex">
              {[
                { label: "Rooms", to: "/rooms" },
                { label: "Label", to: "/label" },
                { label: "Shop", to: "/shop" },
              ].map((c) => (
                <Link key={c.to} to={c.to} className={chipCls}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 xl:flex">
              <Link to="/journal" className={chipCls}>
                Journal
              </Link>
              <Link
                to="/contact"
                className="rounded-[2px] bg-alt-surface px-[18px] py-[10px] font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-alt-text transition-colors duration-[250ms] hover:bg-acid hover:text-accent-text"
              >
                Contact
              </Link>
            </div>
          <ThemeToggle />
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label="Open menu"
            className="flex h-12 w-12 flex-col items-center justify-center gap-[4px] border border-line transition-colors duration-300 hover:border-acid-type"
          >
            <span className="block h-[2px] w-[20px] bg-text" />
            <span className="block h-[2px] w-[14px] bg-text" />
            <span className="block h-[2px] w-[20px] bg-text" />
          </button>
          </div>
        </div>
      </header>

      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="fixed inset-0 z-[9995] bg-surface-deep"
        style={{
          clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
          transition: "clip-path 0.7s var(--ease-in-out-quart)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div className="shell flex h-full flex-col justify-between py-8">
          <div className="flex items-center justify-between">
            <Logotype />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="Close menu"
              className="t-label border border-line px-4 py-3 text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
            >
              Close
            </button>
          </div>

          <nav className="flex flex-col">
            {navItems.slice(1).map((item, i) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between border-t border-line py-4"
                style={{
                  transitionDelay: `${i * 0.06}s`,
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(24px)",
                  transition:
                    "opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo)",
                }}
              >
                <span
                  className="font-display font-extrabold uppercase leading-none tracking-[-0.04em] text-text transition-transform duration-300 group-hover:translate-x-4"
                  style={{ fontSize: "clamp(40px, 6vw, 84px)" }}
                >
                  {item.label}
                </span>
                <span className="t-label text-acid-type transition-colors duration-300 group-hover:text-text">
                  [0{i + 1}]
                </span>
              </Link>
            ))}
          </nav>

          <div className="relative flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6">
            <div className="t-label space-y-1 text-mute">
              {site.address.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
            <div className="t-label space-y-1 text-mute">
              <div>{site.phone}</div>
              <div>{site.instagram}</div>
            </div>
            <img
              src={mascot}
              alt=""
              aria-hidden="true"
              width={1024}
              height={1280}
              loading="lazy"
              className="pointer-events-none absolute bottom-0 right-0 h-[160px] w-auto opacity-15"
            />
          </div>
        </div>
      </div>
    </>
  );
}
