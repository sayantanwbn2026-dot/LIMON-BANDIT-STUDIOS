-- Stock that actually goes down when something sells.
--
-- APPLIED on 2026-09-24 to vwuuwommxvqtgzlsndip (limon-bandit-shop) as
-- migration `stock_reserve_release`. Kept here so a fresh database — a
-- branch, a restore, a second environment — can be brought to the same
-- state. Safe to re-run.
--
-- Why a function at all: stock lives inside the `commerce.products` CMS
-- document, which only an admin may write, and a shopper placing an order is
-- not an admin and must never become one. These run as the definer, and take
-- a row lock so two checkouts a millisecond apart cannot both be sold the
-- last tee. Digital items are skipped — they have no run to exhaust.
--
-- `submitOrder` (src/lib/orders.ts) reserves before writing the order and
-- releases if the write fails; the admin releases when an order is cancelled
-- (src/cms/inbox.ts).

create or replace function public.reserve_stock(items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  doc jsonb;
  it jsonb;
  pid text;
  want int;
  idx int;
  have int;
  short jsonb := '[]'::jsonb;
begin
  select data into doc from cms_documents where key = 'commerce.products' for update;

  if doc is null or jsonb_typeof(doc) <> 'array' then
    return jsonb_build_object('ok', true, 'applied', false);
  end if;

  for it in select * from jsonb_array_elements(items) loop
    pid := it ->> 'product_id';
    want := coalesce((it ->> 'qty')::int, 0);
    if want <= 0 then continue; end if;

    select ord - 1 into idx
    from jsonb_array_elements(doc) with ordinality as e(value, ord)
    where e.value ->> 'id' = pid
    limit 1;

    if idx is null then continue; end if;
    if coalesce((doc -> idx ->> 'digital')::boolean, false) then continue; end if;

    have := coalesce((doc -> idx ->> 'stock')::int, 0);
    if have < want then
      short := short || jsonb_build_object('product_id', pid, 'title', doc -> idx ->> 'title',
                                           'available', have, 'wanted', want);
    end if;
  end loop;

  if jsonb_array_length(short) > 0 then
    return jsonb_build_object('ok', false, 'shortages', short);
  end if;

  for it in select * from jsonb_array_elements(items) loop
    pid := it ->> 'product_id';
    want := coalesce((it ->> 'qty')::int, 0);
    if want <= 0 then continue; end if;

    select ord - 1 into idx
    from jsonb_array_elements(doc) with ordinality as e(value, ord)
    where e.value ->> 'id' = pid
    limit 1;

    if idx is null then continue; end if;
    if coalesce((doc -> idx ->> 'digital')::boolean, false) then continue; end if;

    have := coalesce((doc -> idx ->> 'stock')::int, 0);
    doc := jsonb_set(doc, array[idx::text, 'stock'], to_jsonb(greatest(0, have - want)));
  end loop;

  update cms_documents
     set data = doc, updated_by = coalesce(updated_by, 'shop')
   where key = 'commerce.products';

  return jsonb_build_object('ok', true, 'applied', true);
end;
$$;

create or replace function public.release_stock(items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  doc jsonb;
  it jsonb;
  pid text;
  qty int;
  idx int;
begin
  select data into doc from cms_documents where key = 'commerce.products' for update;
  if doc is null or jsonb_typeof(doc) <> 'array' then
    return jsonb_build_object('ok', true, 'applied', false);
  end if;

  for it in select * from jsonb_array_elements(items) loop
    pid := it ->> 'product_id';
    qty := coalesce((it ->> 'qty')::int, 0);
    if qty <= 0 then continue; end if;

    select ord - 1 into idx
    from jsonb_array_elements(doc) with ordinality as e(value, ord)
    where e.value ->> 'id' = pid
    limit 1;

    if idx is null then continue; end if;
    if coalesce((doc -> idx ->> 'digital')::boolean, false) then continue; end if;

    doc := jsonb_set(doc, array[idx::text, 'stock'],
                     to_jsonb(coalesce((doc -> idx ->> 'stock')::int, 0) + qty));
  end loop;

  update cms_documents set data = doc where key = 'commerce.products';
  return jsonb_build_object('ok', true, 'applied', true);
end;
$$;

revoke all on function public.reserve_stock(jsonb) from public, anon;
revoke all on function public.release_stock(jsonb) from public, anon;
grant execute on function public.reserve_stock(jsonb) to authenticated;
grant execute on function public.release_stock(jsonb) to authenticated;
