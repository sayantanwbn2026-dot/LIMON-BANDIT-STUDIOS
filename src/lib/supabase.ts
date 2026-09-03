import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The browser Supabase client.
 *
 * Both values are public by design: the publishable key can only ever act
 * through Row Level Security, which is enabled on every table in the schema
 * and denies by default. The key that must never appear here is the service
 * role — it lives in `SUPABASE_SERVICE_ROLE_KEY` and is read only inside
 * server functions.
 *
 * **Imported dynamically, and that is the point.** `supabase-js` is ~100KB
 * gzipped and pulls in `realtime-js` and `storage-js`, neither of which this
 * site uses. Imported at module scope it landed in the entry chunk — because
 * `AuthProvider` sits in `__root` — and pushed the first-paint bundle from
 * 206KB to 248KB against a 180KB budget. Behind `import()` it is a separate
 * chunk fetched after hydration: still fetched on every page, since the
 * provider checks the session on mount, but no longer blocking the render.
 *
 * The promise is memoised, so twenty callers produce one module fetch and one
 * client. Returns `null` rather than a broken object when the env vars are
 * missing, so `isSupabaseConfigured` can make the UI say so plainly instead
 * of failing at the first click.
 *
 * Every caller must `await` this. They all sit inside an async function or an
 * effect already, so that costs nothing.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabase(): Promise<SupabaseClient | null> {
  /* Never during SSR: building an auth client on the server would either read
   * a session belonging to nobody or reach for localStorage and throw. */
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!url || !key) return Promise.resolve(null);

  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js")
      .then(({ createClient }) =>
        createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }),
      )
      .catch((e) => {
        /* A failed chunk fetch must not poison the memo — the next caller
         * should be able to try again rather than inherit a rejected promise
         * for the life of the page. */
        console.error("could not load supabase-js", e);
        clientPromise = null;
        return null;
      });
  }

  return clientPromise;
}
