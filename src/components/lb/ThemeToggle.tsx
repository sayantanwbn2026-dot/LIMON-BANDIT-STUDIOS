import { useTheme } from "@/lib/theme";

/**
 * A 48px square holding a 14px square glyph — outlined in dark mode,
 * solid-filled in light mode. The two states crossfade; nothing rotates,
 * nothing is round, and there is no sun or moon anywhere near it.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      className="flex h-12 w-12 items-center justify-center border border-line text-text transition-colors duration-300 hover:border-acid-type"
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
