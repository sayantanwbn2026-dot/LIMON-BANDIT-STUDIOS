import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

export const THEME_KEY = "lb-theme";

const META = { dark: "#050505", light: "#f1f1ef" } as const;

/**
 * Runs blocking in <head>, before first paint, so the stored theme is on
 * <html> by the time any pixel is drawn. Without this the page would paint
 * dark and then snap to light on hydration.
 *
 * Kept dependency-free and wrapped in try/catch: localStorage throws in
 * private-mode Safari and inside sandboxed iframes, and a throw here would
 * abort head parsing.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(THEME_KEY)});
var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
document.documentElement.setAttribute("data-theme",t);
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute("content",t==="light"?${JSON.stringify(META.light)}:${JSON.stringify(META.dark)});
}catch(e){}})();`;

function readDom(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META[theme]);
}

/**
 * `theme` starts as "dark" on both server and client so hydration matches;
 * the real value is read from the DOM (already set by THEME_INIT_SCRIPT)
 * in an effect. Only the toggle's label depends on it, so the one-frame
 * correction is invisible.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readDom());
  }, []);

  /* Follow the OS only while the user has expressed no preference. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => {
      if (stored()) return;
      const next: Theme = e.matches ? "light" : "dark";
      apply(next);
      setTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = readDom() === "dark" ? "light" : "dark";
    const root = document.documentElement;

    /* Crossfade colour only, and only for this switch — never on load. */
    root.classList.add("theme-switching");
    window.setTimeout(() => root.classList.remove("theme-switching"), 450);

    apply(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* preference simply won't persist */
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}
