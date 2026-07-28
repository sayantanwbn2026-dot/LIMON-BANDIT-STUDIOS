import { useEffect, useRef, useState } from "react";
import { Check, Clock, MapPin, Play } from "lucide-react";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion";

const entries = [
  { Icon: Check, title: "Session confirmed", sub: "Room A · Fri 22:00 → 06:00" },
  { Icon: Clock, title: "Master in progress", sub: "Rusted Gold · rev 2 of 3" },
  { Icon: Play, title: "Release is live", sub: "Terminus · streaming now" },
  { Icon: MapPin, title: "Walk-in open", sub: "Room B · tonight after 23:00" },
];

export function LiveLog() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
    if (reduced.current || paused) return;
    const id = setInterval(() => setI((v) => (v + 1) % entries.length), 3500);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const gsap = ensureGsap();
    if (!gsap || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" });
    }, el);
    return () => ctx.revert();
  }, [i]);

  const { Icon, title, sub } = entries[i];

  return (
    <div
      className="w-[300px] max-w-full border border-line bg-surface-raised p-4"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2">
        <span className="h-[7px] w-[7px] bg-acid pulse-dot" />
        <span className="font-ui text-[10px] font-bold uppercase tracking-[0.16em] text-text">
          House log
        </span>
        <span className="ml-auto font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">
          Live
        </span>
      </div>
      <div className="mt-4 h-[42px] overflow-hidden">
        <div ref={rowRef} className="flex items-center gap-3">
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center bg-acid">
            <Icon size={12} className="text-accent-text" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-text">
              {title}
            </span>
            <span className="block truncate font-ui text-[11px] text-mute">{sub}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
