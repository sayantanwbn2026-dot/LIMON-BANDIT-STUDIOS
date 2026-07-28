import { useEffect, useState } from "react";

const fmt = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());

/** Live Kolkata clock — the house knows what time it is at its own address. */
export function LocalTime({ className }: { className?: string }) {
  const [t, setT] = useState("--:--:--");

  useEffect(() => {
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={`font-ui text-[12px] font-semibold uppercase tracking-[0.12em] tnum ${className ?? ""}`}
    >
      Kolkata — {t} IST
    </span>
  );
}
