-- Reviews on shop products.
--
-- APPLIED on 2026-09-26 to vwuuwommxvqtgzlsndip (limon-bandit-shop) as
-- migration `product_reviews`. Kept here so a fresh database can be brought
-- to the same state. Safe to re-run.
--
-- Public to read (a review nobody can see is decoration), one per person per
-- product, and only ever written as yourself. "Verified purchase" is decided
-- here, by looking for the product in that person's own orders — a client
-- that could set it would be a client that could lie about it. The house can
-- take a review down; it cannot write one.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id uuid not null references auth.users on delete cascade,
  author text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null check (char_length(body) between 4 and 2000),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, created_at desc);

alter table public.product_reviews enable row level security;

drop policy if exists "reviews are public" on public.product_reviews;
create policy "reviews are public" on public.product_reviews
  for select to anon, authenticated
  using (true);

drop policy if exists "write your own review" on public.product_reviews;
create policy "write your own review" on public.product_reviews
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "edit your own review" on public.product_reviews;
create policy "edit your own review" on public.product_reviews
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "delete your own review" on public.product_reviews;
create policy "delete your own review" on public.product_reviews
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "admins may remove a review" on public.product_reviews;
create policy "admins may remove a review" on public.product_reviews
  for delete to authenticated
  using (public.is_admin());

-- Stamp `verified` from the reviewer's own order history, on the way in, so
-- it cannot be supplied by the caller.
create or replace function public.stamp_review_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.verified := exists (
    select 1
    from public.orders o
    where o.user_id = new.user_id
      and o.status <> 'cancelled'
      and exists (
        select 1 from jsonb_array_elements(o.items) as i
        where i.value ->> 'product_id' = new.product_id
      )
  );
  return new;
end;
$$;

drop trigger if exists product_reviews_verify on public.product_reviews;
create trigger product_reviews_verify
  before insert or update on public.product_reviews
  for each row execute function public.stamp_review_verified();
