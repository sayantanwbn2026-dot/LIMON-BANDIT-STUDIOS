import { useEffect, useState, type FormEvent } from "react";
import { Star, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { useAllReviews, useRatings } from "@/lib/reviews";

/**
 * What other people thought.
 *
 * A shop with no reviews asks a stranger to take its own word for a ₹3,200
 * hoodie. This is the smallest honest version: a rating, a sentence, one
 * per person per product, and a "verified purchase" mark that the database
 * decides by looking at that person's own orders — the client cannot claim
 * it (see the trigger in supabase/migrations/…_product_reviews.sql).
 *
 * Reviews are public to read and only ever written as yourself. Editing
 * replaces your own; nobody can touch anyone else's. The house can take one
 * down but cannot write one, which is the right way round for a shop that
 * sells its own merch.
 *
 * Ratings for the whole catalogue are fetched once and shared — the table is
 * small, and twenty cards each asking for their own average would be twenty
 * round trips for one number apiece.
 */

/** Five stars, filled to the value. Decorative — the number is always beside it. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[2px]" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "fill-acid text-acid" : "text-line-strong"}
        />
      ))}
    </span>
  );
}

export function Reviews({ productId, productTitle }: { productId: string; productTitle: string }) {
  const { user, requireAuth } = useAuth();
  const { rows, refresh } = useAllReviews();

  const mine = rows.filter((r) => r.product_id === productId);
  const own = user ? mine.find((r) => r.user_id === user.id) : undefined;
  const aggregate = useRatings(productId);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);

  /* Editing starts from what is already there, rather than a blank form
   * that silently replaces it. */
  useEffect(() => {
    if (!own) return;
    setRating(own.rating);
    setTitle(own.title ?? "");
    setBody(own.body);
  }, [own]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 4) {
      setNote("A sentence is enough, but it needs one.");
      return;
    }
    requireAuth("Sign in to leave a review.", () => void save());
  };

  const save = async () => {
    setBusy(true);
    setNote(null);
    try {
      const supabase = await getSupabase();
      const { data: sessionData } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      const me = sessionData.user;
      if (!supabase || !me) {
        setNote("Sign in again — that session has expired.");
        return;
      }

      const meta = me.user_metadata as { full_name?: string } | undefined;
      const author = (meta?.full_name || me.email?.split("@")[0] || "Anonymous").slice(0, 60);

      /* Upsert on (product_id, user_id): one review per person per product,
       * and pressing save twice edits rather than duplicating. */
      const { error } = await supabase.from("product_reviews").upsert(
        {
          product_id: productId,
          user_id: me.id,
          author,
          rating,
          title: title.trim() || null,
          body: body.trim(),
        },
        { onConflict: "product_id,user_id" },
      );

      if (error) {
        setNote(error.message);
        return;
      }
      await refresh();
      setWriting(false);
      setNote("Thank you — it is up.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!own) return;
    if (!window.confirm("Delete your review?")) return;
    setBusy(true);
    try {
      const supabase = await getSupabase();
      await supabase?.from("product_reviews").delete().eq("id", own.id);
      await refresh();
      setRating(5);
      setTitle("");
      setBody("");
      setNote(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="reviews" className="relative w-full border-t border-line bg-surface py-14">
      <div className="shell relative z-[2]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-[22px] font-extrabold uppercase tracking-[-0.02em] text-text md:text-[28px]">
            Reviews
          </h2>
          {aggregate.count > 0 ? (
            <p className="flex items-center gap-3 font-ui text-[14px] text-mute">
              <Stars value={aggregate.average} />
              <span className="tnum text-text">{aggregate.average.toFixed(1)} / 5</span>
              <span>
                {aggregate.count} {aggregate.count === 1 ? "review" : "reviews"}
              </span>
            </p>
          ) : null}
        </div>

        {mine.length === 0 ? (
          <p className="mt-6 max-w-[60ch] font-ui text-[15px] leading-[1.6] text-mute">
            Nobody has written about {productTitle} yet. If you have one, say what it is actually
            like — the fit, the print, how it washed.
          </p>
        ) : (
          <ul className="mt-8 border-t border-line">
            {mine.map((r) => (
              <li key={r.id} className="border-b border-line py-6">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Stars value={r.rating} />
                  {r.title ? (
                    <span className="font-ui text-[15px] font-semibold text-text">{r.title}</span>
                  ) : null}
                  {r.verified ? (
                    <span className="t-label bg-acid px-2 py-[2px] text-accent-text">
                      Verified purchase
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 max-w-[66ch] whitespace-pre-wrap font-ui text-[15px] leading-[1.6] text-text">
                  {r.body}
                </p>
                <p className="t-label mt-3 text-mute">
                  {r.author} ·{" "}
                  {new Date(r.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {own && own.id === r.id ? " · yours" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* ---- writing one ---- */}
        {!writing ? (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => requireAuth("Sign in to leave a review.", () => setWriting(true))}
              className="flex h-[48px] items-center border border-line-strong px-6 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-text transition-colors duration-300 hover:border-acid-type"
            >
              {own ? "Edit your review" : "Write a review"}
            </button>
            {own ? (
              <button
                type="button"
                onClick={() => void remove()}
                disabled={busy}
                className="tap inline-flex items-center gap-2 font-ui text-[13px] text-mute transition-colors duration-300 hover:text-text"
              >
                <Trash2 size={14} /> Delete yours
              </button>
            ) : null}
            {note ? <p className="font-ui text-[13px] text-acid-type">{note}</p> : null}
          </div>
        ) : (
          <form onSubmit={submit} className="ui-card mt-8 max-w-[560px] p-6">
            <fieldset>
              <legend className="t-label text-mute">Your rating</legend>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} out of 5`}
                    aria-pressed={rating === n}
                    className="flex h-11 w-11 items-center justify-center"
                  >
                    <Star
                      size={22}
                      className={n <= rating ? "fill-acid text-acid" : "text-line-strong"}
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="mt-6 block">
              <span className="t-label text-mute">Headline</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="Optional"
                className="ui-field mt-2 h-11 w-full px-3.5 font-ui text-[15px] text-text outline-none"
              />
            </label>

            <label className="mt-6 block">
              <span className="t-label text-mute">What is it like?</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 2000))}
                rows={4}
                required
                placeholder="Fit, print, how it washed."
                className="mt-2 w-full resize-y border border-line bg-transparent p-3 font-ui text-[15px] leading-[1.55] text-text outline-none focus:border-acid-type"
              />
            </label>

            {note ? <p className="mt-4 font-ui text-[13px] text-acid-type">{note}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={busy}
                className="flex h-[48px] items-center bg-acid px-6 font-ui text-[13px] font-bold uppercase tracking-[0.14em] text-accent-text disabled:opacity-60"
              >
                {busy ? "Saving…" : own ? "Save changes" : "Post review"}
              </button>
              <button
                type="button"
                onClick={() => setWriting(false)}
                className="tap flex h-[48px] items-center px-2 font-ui text-[13px] text-mute hover:text-text"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
