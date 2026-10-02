-- Security hardening and the two missing foreign-key indexes.
--
-- APPLIED on 2026-10-03 to vwuuwommxvqtgzlsndip (limon-bandit-shop). Kept
-- here so a fresh database — a branch, a restore, a second environment —
-- can be brought to the same state. Safe to re-run.

-- 1. stamp_review_verified() was executable over RPC by anon and by any
--    signed-in user.
--
--    It is a TRIGGER function. Triggers fire as the table owner and never
--    consult the caller's EXECUTE grant, so nothing legitimate needs this
--    privilege and a direct call can only ever error ("trigger functions can
--    only be called as triggers"). It was reachable because a function with
--    no explicit grant inherits EXECUTE from PUBLIC — the two stock
--    functions beside it were revoked explicitly when they were written and
--    this one was not.
--
--    Verified after applying: the product_reviews_verify trigger is still
--    enabled and still fires, because none of this affects triggers.
revoke all on function public.stamp_review_verified() from public, anon, authenticated;

-- 2. Two foreign keys with no covering index. Both point at auth.users, and
--    both are read by a per-user lookup — "my enquiries", "my reviews" — so
--    without the index that read is a sequential scan that gets slower every
--    time somebody writes to the table.
create index if not exists enquiries_user_id_idx on public.enquiries (user_id);
create index if not exists product_reviews_user_id_idx on public.product_reviews (user_id);

-- DELIBERATELY NOT DONE, having checked each one:
--
--   `auth_rls_initplan` on admins.admins_select_own — the linter flags it,
--   but the policy already reads `(SELECT auth.jwt() ->> 'email')`, which is
--   exactly the recommended form. Nothing to fix.
--
--   `unused_index` on enquiries_status_idx and product_reviews_product_idx —
--   they are unused because those tables are nearly empty, not because the
--   queries do not exist. Dropping an index that the admin inbox and the
--   product page will both want the moment there is data would be optimising
--   for an empty database.
--
--   `multiple_permissive_policies` on admins, orders and product_reviews —
--   each pair is "the owner may see their own" plus "an admin may see all",
--   which is the security model stated plainly. Merging them into one policy
--   to save a predicate evaluation on tables this size trades a readable
--   rule for a measurement nobody can take yet.
--
--   reserve_stock / release_stock remain executable by `authenticated`.
--   That grant is load-bearing — checkout and the admin's order cancellation
--   both call them as the signed-in user — so it cannot simply be revoked.
--   See the note in the commit: closing that properly needs the stock
--   mutation to move behind the service role or into one atomic place_order
--   function, and that is a change to the money path which should not ship
--   without a signed-in account to test it against.
