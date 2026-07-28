import { Play, Star } from "lucide-react";
import { Section, Eyebrow } from "@/components/lb/Section";
import { RiseIn } from "@/components/lb/Reveal";
import founder from "@/assets/founder.jpg";
import roomA from "@/assets/room-a.jpg";

export function Founder() {
  return (
    <Section tone="dark" className="py-[120px]">
      {/* the section's heading is carried visually by the statement itself */}
      <h2 className="sr-only">Who&apos;s behind it</h2>
      <div className="section-head">
        <div className="flex gap-4 md:col-span-2">
          <div className="relative w-full max-w-[420px]">
            <img
              src={founder}
              alt="The founder of Limon Bandit standing in the control room"
              width={1000}
              height={1250}
              loading="lazy"
              className="aspect-[4/5] w-full border border-line object-cover"
              style={{ filter: "grayscale(1) brightness(var(--img-brightness)) contrast(1.08)" }}
            />
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-[20px] w-[20px] border-b border-l border-acid-type"
            />
          </div>
          <div
            aria-hidden="true"
            className="t-label hidden select-none whitespace-nowrap text-mute sm:block"
            style={{ writingMode: "vertical-rl" }}
          >
            From the floor · From the floor · From the floor ·
          </div>
        </div>

        <div className="md:col-span-2">
          <Eyebrow>Who&apos;s behind it</Eyebrow>
          <div className="mt-8 space-y-6 font-ui text-[20px] leading-[1.5] text-text">
            {/* REPLACE */}
            <p>
              <strong className="font-semibold">
                I started Limon Bandit because the good rooms in this city were always booked by
                people who weren&apos;t making anything.
              </strong>
            </p>
            <p className="text-mute">
              The idea was straightforward: keep the room open late, keep the rates readable, and
              let the artist walk out owning the record.
            </p>
            <p className="text-mute">
              <strong className="font-semibold text-text">
                Everything else — the label, the merch, the crew — grew out of that one room
              </strong>{" "}
              because the people using it kept needing the next thing.
            </p>
          </div>
          <div className="mt-10 border-t border-line pt-6">
            <div className="font-display text-[15px] font-bold uppercase text-text">
              Arko Dasgupta
            </div>

            <div className="mt-1 font-ui text-[12px] text-mute">Founder &amp; Head Engineer</div>
          </div>
        </div>
      </div>

      <RiseIn className="mt-20 grid grid-cols-1 items-center gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={14} className="fill-acid-type text-acid-type" />
            ))}
          </div>
          <p className="t-eyebrow mt-3 text-mute">4.9/5 across 230+ sessions</p>
        </div>
        <div className="relative md:col-span-3">
          <img
            src={roomA}
            alt="A night session running in Room A"
            width={1600}
            height={900}
            loading="lazy"
            className="aspect-video w-full border border-line object-cover mono"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Play the Room A film"
              className="flex h-[72px] w-[72px] items-center justify-center bg-acid transition-transform duration-300 hover:scale-105"
            >
              <Play size={24} className="fill-accent-text text-accent-text" />
            </button>
            <span className="font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text">
              Watch a night in Room A
            </span>
          </div>
        </div>
      </RiseIn>
    </Section>
  );
}
