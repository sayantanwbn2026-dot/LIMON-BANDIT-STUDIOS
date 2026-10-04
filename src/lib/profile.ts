import { getSupabase } from "./supabase";

/**
 * The buyer's own profile row.
 *
 * `public.profiles` has existed since the schema was written — one row per
 * account, created alongside the user — and nothing in the site has ever read
 * or written it. The name and phone a visitor typed at checkout lived only on
 * the order, so the next order asked for them again, and there was nowhere to
 * correct a misspelt name short of placing another one.
 *
 * SECURITY IS THE TABLE'S, NOT THIS FILE'S. RLS allows select, insert and
 * update only where `auth.uid() = id`, so none of these queries carries a
 * user filter and none of them could be widened from the client if it tried:
 * a request for somebody else's row comes back empty rather than forbidden.
 * That is also why `load` cannot tell "no row yet" from "not signed in" and
 * does not try — both mean the same thing to the caller, which is that there
 * is nothing to show.
 */

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

export type SaveResult = { ok: true } | { ok: false; error: string };

/** The signed-in person's row, or null when there is no session or no row. */
export async function loadProfile(): Promise<Profile | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .maybeSingle();
  if (error) {
    console.error("could not load profile", error);
    return null;
  }
  return (data as Profile | null) ?? null;
}

/**
 * Write the name and phone back.
 *
 * `upsert`, not `update`: an account that predates the row-creating trigger —
 * or one whose row was removed — has nothing to update, and an update
 * matching no rows is not an error in PostgREST. It returns success having
 * changed nothing, which is the worst of both worlds on a form: the field
 * says saved and the value is gone on the next load.
 *
 * The id is sent explicitly because an upsert needs the conflict target, and
 * RLS checks it against `auth.uid()` on both the insert and the update paths
 * — so passing somebody else's id fails at the database rather than here.
 */
export async function saveProfile(
  id: string,
  patch: { full_name: string; phone: string },
): Promise<SaveResult> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, error: "Accounts are not connected yet." };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id,
        full_name: patch.full_name.trim() || null,
        phone: patch.phone.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    /* 42501 is the database refusing outright. Anything else is usually the
     * network, and saying so beats printing Postgres at somebody. */
    if (error.code === "42501") {
      return { ok: false, error: "The database would not accept that change." };
    }
    return { ok: false, error: error.message || "Could not save. Try again." };
  }

  /* No row back means RLS filtered the write out and nothing was stored.
   * Reporting success here would be a lie the next page load exposes. */
  if (!data) return { ok: false, error: "That did not save. Sign in again and retry." };

  return { ok: true };
}
