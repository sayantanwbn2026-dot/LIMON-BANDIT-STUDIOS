import { useEffect, useRef, useState } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { RiseIn, WordReveal } from "@/components/lb/Reveal";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";
import tee from "@/assets/merch-tee.jpg";
import roomA from "@/assets/room-a.jpg";
import c1 from "@/assets/release-01.jpg";
import c2 from "@/assets/release-02.jpg";
import c3 from "@/assets/release-03.jpg";
import c4 from "@/assets/release-04.jpg";
import c5 from "@/assets/release-05.jpg";
import c6 from "@/assets/release-06.jpg";

const queue = [
  { title: "Rusted Gold", time: "3:41" },
  { title: "Late Fee", time: "2:58" },
  { title: "Terminus", time: "5:12" },
];

const crew = ["Video", "Cover art", "Photo", "Mixing", "Mastering", "Press"];
const avatars = [c1, c2, c3, c4, c5, c6];

export function Bento() {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-tile]"),
        { scale: 0.96, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
      gsap.to(el.querySelectorAll("[data-bar]"), {
        scaleY: 0.35,
        transformOrigin: "center",
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.04, from: "start" },
      });
      gsap.fromTo(
        el.querySelector("[data-connector]"),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 2,
          ease: "power4.inOut",
          scrollTrigger: { trigger: el, start: "top 70%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Section surface="bg-ink" className="py-[140px]">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Eyebrow>What&apos;s inside</Eyebrow>
        </div>
        <div className="md:col-span-2">
          <WordReveal
            as="h2"
            className="t-h2 text-text-dark"
            text={"A label, a shop,\nand a crew —\non one site."}
          />
        </div>
        <div className="flex flex-col justify-end gap-6 md:col-span-1">
          <p className="font-ui text-[16px] leading-[1.5] text-mute-dark">
            Everything the roster needs sits behind one login. Nothing is farmed out.
          </p>
          <a
            href="/label"
            className="group flex w-fit items-center gap-3 border border-ink-line px-6 py-4 transition-colors duration-300 hover:border-acid"
          >
            <span className="t-eyebrow text-text-dark">See everything</span>
            <ArrowRight size={15} className="text-acid transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      <div ref={ref} className="mt-20 grid grid-cols-1 gap-px bg-ink-line md:grid-cols-2 lg:grid-cols-4">
        {/* 1 — player */}
        <div data-tile className="bg-ink-raised p-8 lg:col-span-2">
          <div className="flex items-center gap-4">
            <img src={c1} alt="" aria-hidden="true" width={64} height={64} loading="lazy" className="h-16 w-16 object-cover grayscale" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[16px] font-bold uppercase text-text-dark">
                Rusted Gold
              </div>
              <div className="mt-1 font-ui text-[12px] text-mute-dark">Rana &amp; The Strays</div>
            </div>
            <button
              type="button"
              aria-label={playing ? "Pause preview" : "Play preview"}
              aria-pressed={playing}
              onClick={() => setPlaying((p) => !p)}
              className="flex h-11 w-11 items-center justify-center bg-acid"
            >
              {playing ? (
                <Pause size={16} className="fill-text-light text-text-light" />
              ) : (
                <Play size={16} className="fill-text-light text-text-light" />
              )}
            </button>
          </div>

          <div className="mt-8 flex h-16 items-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: 48 }).map((_, i) => (
              <span
                key={i}
                data-bar={i < 19 ? "" : undefined}
                className={`w-[3px] ${i < 19 ? "bg-acid" : "bg-ink-line"}`}
                style={{ height: `${20 + ((i * 37) % 60)}%` }}
              />
            ))}
          </div>

          <ul className="mt-8">
            {queue.map((q) => (
              <li
                key={q.title}
                className="flex items-center justify-between border-t border-ink-line py-3 font-ui text-[14px] text-mute-dark"
              >
                <span>{q.title}</span>
                <span className="tnum">{q.time}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2 — merch */}
        <div data-tile className="relative flex flex-col bg-ink-raised lg:row-span-2">
          <span className="t-label absolute left-6 top-6 z-[2] bg-acid px-3 py-1 text-text-light">
            Sold direct
          </span>
          <img
            src={tee}
            alt="The house tee hanging against a concrete wall"
            width={1000}
            height={1250}
            loading="lazy"
            className="h-full min-h-[320px] w-full flex-1 object-cover grayscale"
          />
          <div className="p-8">
            <div className="font-display text-[16px] font-bold uppercase text-text-dark">
              House Tee — Black
            </div>
            <div className="tnum mt-2 font-ui text-[14px] text-mute-dark">₹1,299</div>
            <a
              href="/shop"
              className="mt-6 flex items-center gap-2 font-ui text-[12px] font-bold uppercase tracking-[0.12em] text-text-dark"
            >
              Shop the drop <ArrowRight size={14} className="text-acid" />
            </a>
          </div>
        </div>

        {/* 3 — rooms */}
        <div data-tile className="relative min-h-[280px] overflow-hidden bg-ink-raised">
          <img
            src={roomA}
            alt="Room A set up for a live session"
            width={1600}
            height={900}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-45 grayscale"
          />
          <div className="relative flex h-full flex-col justify-between p-8">
            <div className="flex flex-wrap gap-2">
              {["Room A", "Room B", "Lockout"].map((c) => (
                <span key={c} className="t-label rounded-[2px] border border-ink-line bg-ink-deep px-3 py-2 text-text-dark">
                  {c}
                </span>
              ))}
            </div>
            <p className="font-ui text-[14px] text-mute-dark">
              4 rooms, booked by the hour or the night.
            </p>
          </div>
        </div>

        {/* 4 — roster */}
        <div data-tile className="flex min-h-[280px] flex-col justify-between bg-ink-raised p-8">
          <div className="flex">
            {avatars.map((a, i) => (
              <img
                key={i}
                src={a}
                alt=""
                aria-hidden="true"
                width={40}
                height={40}
                loading="lazy"
                className="h-10 w-10 border border-ink-raised object-cover grayscale"
                style={{ marginLeft: i === 0 ? 0 : -10 }}
              />
            ))}
            <span
              className="flex h-10 w-10 items-center justify-center border border-ink-raised bg-acid font-ui text-[10px] font-bold uppercase text-text-light"
              style={{ marginLeft: -10 }}
            >
              +You
            </span>
          </div>
          <div className="font-display text-[28px] font-extrabold uppercase leading-[1] tracking-[-0.03em] text-text-dark">
            40+ artists on the roster
          </div>
        </div>

        {/* 5 — crew */}
        <div data-tile className="bg-ink-raised p-8 lg:col-span-3">
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
            {crew.map((c) => (
              <div key={c} className="flex flex-col items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center border border-ink-line">
                  <span className="h-[10px] w-[10px] bg-mute-dark" />
                </span>
                <span className="t-label text-center text-mute-dark">{c}</span>
              </div>
            ))}
          </div>
          <div data-connector aria-hidden="true" className="mt-8 h-px w-full origin-left bg-acid" />
          <RiseIn className="mt-8">
            <p className="t-h3 text-text-dark">Hire the crew by the project.</p>
          </RiseIn>
        </div>
      </div>
    </Section>
  );
}
