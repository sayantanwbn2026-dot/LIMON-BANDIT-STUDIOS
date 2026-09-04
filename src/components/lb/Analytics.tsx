import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { getSupabase } from "@/lib/supabase";

/**
 * Counts a page view. No cookie, no third party.
 *
 * Identity is a random id held in `sessionStorage`, so it lasts exactly as
 * long as the browser tab and cannot be used to recognise anyone on a later
 * visit. That is the whole design: enough to tell twelve views by one person
 * apart from twelve people, not enough to build a profile.
 *
 * The referrer is reduced to a host before it is stored. Knowing traffic
 * arrived from instagram.com is useful; recording the exact post someone came
 * from is surveillance, and it is not needed for any number the dashboard
 * shows.
 *
 * `/admin` is excluded — staff editing the site are not visitors, and
 * counting them would quietly inflate every figure on the analytics page.
 */
const KEY = "lb-session";

function sessionId(): string {
  try {
    const found = sessionStorage.getItem(KEY);
    if (found) return found;
    const made = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(KEY, made);
    return made;
  } catch {
    /* private mode: a per-render id still counts the view, it just counts
     * this visitor more than once. Better than losing the view. */
    return Math.random().toString(36).slice(2);
  }
}

function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const url = new URL(document.referrer);
    if (url.host === window.location.host) return null;
    return url.host;
  } catch {
    return null;
  }
}

export function Analytics() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (path.startsWith("/admin")) return;

    let alive = true;
    /* Deferred so the write never competes with the render it is measuring. */
    const t = window.setTimeout(() => {
      void (async () => {
        const supabase = await getSupabase();
        if (!supabase || !alive) return;
        const { error } = await supabase.from("page_views").insert({
          path,
          session_id: sessionId(),
          referrer_host: referrerHost(),
        });
        /* A failed count must never surface to a visitor — it is the least
         * important thing happening on the page. */
        if (error) console.debug("analytics: view not recorded", error.message);
      })();
    }, 800);

    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [path]);

  return null;
}
