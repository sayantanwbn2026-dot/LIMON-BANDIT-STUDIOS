import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useNavItems, useSite, useSocialLink } from "@/cms/hooks";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/smooth";
import { useNavPole } from "@/lib/nav-pole";
import { ThemeToggle } from "@/components/lb/ThemeToggle";
import { Picture } from "@/components/lb/Picture";
import { ShopBar } from "@/components/shop/ShopBar";

export function Logotype({ size = 18 }: { size?: number }) {
  return (
    <span className="flex items-end">
      <span
        className="font-display font-extrabold uppercase leading-none tracking-[-0.04em]"
        style={{ fontSize: size }}
      >
        Limon Bandit
      </span>
    </span>
  );
}

/**
 * The hamburger is the navigation. The bar carries exactly three things:
 * logotype, theme toggle, menu button — the latter two 12px apart so they
 * read as one control cluster.
 */
export function Nav() {
  const site = useSite();
  const instagram = useSocialLink("Instagram");
  /* Home lives on the logotype, so the menu carries the rest. */
  const menuLinks = useNavItems().slice(1);
  const navRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* How far down the bar stays transparent.
   *
   * Over a hero it floats — that is the design, and the hero is built to be
   * read through it. A page with no hero starts its content immediately
   * under the bar, and floating there means the logotype sits on top of
   * whatever the page opens with (on a product page, the price). So: 600px
   * where there is a hero, almost immediately where there is not.
   *
   * Read from the DOM after each navigation rather than from a list of
   * routes, because the question is "does this page open with a hero", and
   * the page itself is the only thing that knows. */
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const threshold = useRef(600);
  useEffect(() => {
    threshold.current = document.querySelector("[data-hero]") ? 600 : 24;
    setScrolled(window.scrollY > threshold.current);
  }, [pathname]);
  const navPole = useNavPole();

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

  /* The bar steps aside while you read downward and returns the moment you
   * scroll up — which is the moment you are looking for it. Never while it
   * holds focus (a keyboard user tabbing through it must not watch it leave)
   * and never in the first screen, where it is part of the hero's frame.
   * An 8px dead band stops a trackpad's jitter from flickering it. */
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > threshold.current);
      const dy = y - last;
      if (Math.abs(dy) < 8) return;
      const focusInside = navRef.current?.contains(document.activeElement) ?? false;
      setTucked(dy > 0 && y > window.innerHeight * 0.9 && !focusInside);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* On an inverted page the bar can never be transparent: the logotype and
   * burger are primary-pole, so they would sit bone-on-bone until the 600px
   * scroll threshold. Going solid immediately keeps them legible and reads
   * as a deliberate fixed bar over the chapter. */
  const solid = scrolled || navPole === "alt";

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
    lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [open]);

  return (
    <>
      <header
        ref={navRef}
        onFocus={() => setTucked(false)}
        className="fixed inset-x-0 top-0 z-[9990] h-[var(--nav-h)]"
        style={{
          backgroundColor: solid ? "var(--nav-solid)" : "transparent",
          borderBottom: solid ? "1px solid var(--line)" : "1px solid transparent",
          backdropFilter: solid ? "blur(14px) saturate(1.2)" : "none",
          /* Inline, not from a stylesheet rule: GSAP's intro
           * tween writes `translate: none` inline on this element (it clears
           * the individual transform properties it does not own), and an
           * inline value beats any stylesheet. */
          translate: tucked && !open ? "0 -100%" : "0 0",
          transition:
            "translate 0.6s var(--ease-out-expo), background-color 0.4s var(--ease-out-expo), border-color 0.4s linear",
        }}
      >
        <div className="shell flex h-full items-center justify-between">
          <Link to="/" className="tap text-text" aria-label={`${site.name} home`}>
            <Logotype />
          </Link>

          {/* Four controls now, not two — the shop added a cart and an
              account button. Five 48px squares plus the logotype overflow a
              360pt phone (measured: the burger left the screen at 320), so
              below `sm` the controls drop to 44px and the theme toggle moves
              into the menu, where it is one tap away and nothing is lost. */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle className="hidden sm:flex" />
            <ShopBar />
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label="Open menu"
              className="group flex h-11 w-11 flex-col items-center justify-center gap-[4px] border border-line transition-colors duration-300 hover:border-acid-type sm:h-12 sm:w-12"
            >
              {/* On hover the short middle bar reaches full width and the
               * outer two draw in to meet it — the icon evening itself out
               * under the pointer, a small "yes, this opens". */}
              <span className="block h-[2px] w-[20px] bg-text transition-[width] duration-500 ease-[var(--ease-out-expo)] group-hover:w-[14px]" />
              <span className="block h-[2px] w-[14px] bg-text transition-[width] duration-500 ease-[var(--ease-out-expo)] group-hover:w-[20px]" />
              <span className="block h-[2px] w-[20px] bg-text transition-[width] duration-500 ease-[var(--ease-out-expo)] group-hover:w-[14px]" />
            </button>
          </div>
        </div>
      </header>

      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        /* keeps the six links out of the tab order while closed */
        inert={!open}
        className="lb-menu fixed inset-0 z-[9995] overflow-hidden bg-surface-deep"
        style={{
          clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
          transition: "clip-path 0.7s var(--ease-in-out-quart)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div className="flex h-[100svh] flex-col">
          <div className="lb-menu-header shell flex shrink-0 items-center justify-between">
            <Logotype />
            <div className="flex items-center gap-2">
              {/* The bar's toggle is hidden below `sm` to make room for the
                  cart and account controls, so it lives here on phones. */}
              <ThemeToggle className="sm:hidden" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close menu"
                className="t-label flex min-h-11 items-center border border-line px-4 text-mute transition-colors duration-300 hover:border-acid-type hover:text-text"
              >
                Close
              </button>
            </div>
          </div>

          <nav aria-label="Site" className="shell flex min-h-0 flex-1 flex-col">
            {menuLinks.map((item, i) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="lb-menu-row group flex items-center justify-between border-t border-line"
                style={{
                  transitionDelay: `${i * 0.06}s`,
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(24px)",
                  transition:
                    "opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo)",
                }}
              >
                <span className="lb-menu-link font-display font-extrabold uppercase tracking-[-0.04em] text-text transition-transform duration-300 group-hover:translate-x-4">
                  {item.label}
                </span>
                <span className="t-label tnum text-acid-type transition-colors duration-300 group-hover:text-text">
                  [0{i + 1}]
                </span>
              </Link>
            ))}
          </nav>

          <div className="lb-menu-footer shell relative flex shrink-0 items-center border-t border-line">
            <div className="lb-menu-stack flex w-full flex-wrap items-end justify-between gap-6">
              <div className="t-label space-y-1 text-mute">
                {site.address.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
              <div className="t-label space-y-1 text-mute">
                <div>{site.phone}</div>
                {instagram ? <div>{instagram.handle || instagram.platform}</div> : null}
              </div>
            </div>

            <div className="lb-menu-compact t-label w-full items-center gap-3 text-mute">
              <span className="truncate">{site.address.join(", ")}</span>
              <span aria-hidden="true">·</span>
              <span className="shrink-0">{site.phone}</span>
              {instagram ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0">{instagram.handle || instagram.platform}</span>
                </>
              ) : null}
            </div>

            <Picture
              src="limon-mascot"
              sizes="88px"
              alt=""
              className="lb-menu-mascot pointer-events-none absolute bottom-0 right-[var(--page-margin)] w-auto opacity-15"
            />
          </div>
        </div>
      </div>
    </>
  );
}
