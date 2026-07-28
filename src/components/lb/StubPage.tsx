import { Link } from "@tanstack/react-router";
import { Nav } from "@/components/sections/Nav";
import { Footer } from "@/components/sections/Footer";
import { Noise } from "@/components/lb/Noise";
import { GridRules } from "@/components/lb/GridRules";

export function StubPage({ label, blurb }: { label: string; blurb: string }) {
  return (
    <>
      <Noise />
      <Nav />
      <main className="relative flex min-h-screen items-center bg-surface-deep">
        <GridRules tone="dark" />
        <div className="shell relative z-[2] py-[200px]">
          <div className="flex items-center gap-3">
            <span className="h-[10px] w-[10px] bg-acid" />
            <span className="t-eyebrow text-mute">Limon Bandit</span>
          </div>
          <h1 className="t-hero mt-8 text-text">{label}</h1>
          <p className="t-lead mt-6 max-w-[46ch] text-mute">{blurb}</p>
          <Link
            to="/"
            className="mt-10 flex h-[56px] w-full max-w-[280px] items-center justify-center border border-line font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:bg-surface-raised"
          >
            Back home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
