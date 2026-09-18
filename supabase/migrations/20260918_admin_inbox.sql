-- Admin inbox: let admins read and work the orders, enquiries and mailing list
-- from /admin/orders, /admin/enquiries and /admin/subscribers.
--
-- Safe to run more than once: every policy is dropped (if present) and
-- recreated. Shoppers are unaffected — their own-row policies on `orders`
-- ("orders_select_own", "orders_insert_own") are left exactly as they are,
-- and nothing here grants anything to a non-admin. `public.is_admin()` is the
-- same check the CMS tables already use.
--
-- Run it in: Supabase dashboard → SQL Editor → paste → Run.

-- orders --------------------------------------------------------------------
drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select" on public.orders
  for select to authenticated
  using (public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- enquiries (select/update may already exist from create_enquiries_table) ----
drop policy if exists "admins read enquiries" on public.enquiries;
create policy "admins read enquiries" on public.enquiries
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admins update enquiries" on public.enquiries;
create policy "admins update enquiries" on public.enquiries
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- mailing list ----------------------------------------------------------------
-- Delete is for honouring an unsubscribe / erasure request (see the privacy
-- page); there is no other way for a person to leave the list.
drop policy if exists "offer_signups_admin_select" on public.offer_signups;
create policy "offer_signups_admin_select" on public.offer_signups
  for select to authenticated
  using (public.is_admin());

drop policy if exists "offer_signups_admin_delete" on public.offer_signups;
create policy "offer_signups_admin_delete" on public.offer_signups
  for delete to authenticated
  using (public.is_admin());
