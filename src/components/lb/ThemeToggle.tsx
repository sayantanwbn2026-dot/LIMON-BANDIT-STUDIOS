import { useTheme } from "@/lib/theme";

/**
 * A 48px square holding a 14px square glyph — outlined in dark mode,
 * solid-filled in light mode. The two states crossfade; nothing rotates,
 * nothing is round, and there is no sun or moon anywhere near it.
 *
 * 44px below `sm`. The navbar now carries a cart and an account control as
 * well, and five 48px squares plus the logotype do not fit a 360pt phone —
 * measured, the hamburger was pushed off the right edge at 320. 44 is still
 * above the 44×44 floor for a touch target.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      className={`flex h-11 w-11 items-center justify-center border border-line text-text transition-colors duration-300 hover:border-acid-type sm:h-12 sm:w-12 ${className ?? ""}`}
    >
      <span aria-hidden="true" className="relative block h-[14px] w-[14px]">
        {/* outlined — dark mode */}
        <span
          className="absolute inset-0 block border border-current"
          style={{ opacity: light ? 0 : 1, transition: "opacity 150ms linear" }}
        />
        {/* solid — light mode */}
        <span
          className="absolute inset-0 block bg-current"
          style={{ opacity: light ? 1 : 0, transition: "opacity 150ms linear" }}
        />
      </span>
    </button>
  );
}
