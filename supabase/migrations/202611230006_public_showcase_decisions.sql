begin;

-- Showcase decisions are intentionally available to unauthenticated demo visitors.
-- This RPC can only change the isolated, fictional showcase tables. Institutional
-- approvals continue to use review_booking_request behind verified faculty auth.
create function public.review_public_showcase_booking(
  p_booking_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.showcase_bookings%rowtype;
  v_coordinator uuid := '90000000-0000-4000-8000-000000000010';
  v_total bigint;
  v_minute bigint;
  v_hour bigint;
begin
  if p_booking_id is null or p_decision is null or p_decision not in ('approved', 'rejected')
    or (p_note is not null and char_length(p_note) > 1000) then
    raise exception 'Showcase decision input is invalid' using errcode = '22023';
  end if;

  -- Serialize review and quota checks across concurrent anonymous callers.
  perform pg_advisory_xact_lock(41901, 20261123);

  if not exists (select 1 from public.showcase_coordinator c where c.id = v_coordinator) then
    raise exception 'Showcase coordinator seed is unavailable' using errcode = '55000';
  end if;

  select * into v_booking
  from public.showcase_bookings b
  where b.id = p_booking_id
  for update;
  if not found then raise exception 'Showcase booking not found' using errcode = 'P0002'; end if;
  if v_booking.status <> 'pending' then
    raise exception 'Showcase request has already been reviewed' using errcode = '23514';
  end if;

  select count(*) into v_total from public.showcase_decisions d;
  select count(*) into v_minute from public.showcase_decisions d where d.created_at >= now() - interval '1 minute';
  select count(*) into v_hour from public.showcase_decisions d where d.created_at >= now() - interval '1 hour';
  if v_total >= 1000 or v_minute >= 10 or v_hour >= 60 then
    raise exception 'Public showcase review limit reached' using errcode = 'P0001';
  end if;

  -- The approved-only GiST exclusion constraint is checked atomically here.
  -- If it raises 23P01, the status update and decision insert both roll back.
  update public.showcase_bookings
  set status = p_decision, updated_at = now()
  where id = p_booking_id;

  insert into public.showcase_decisions(booking_id, coordinator_id, decision, note)
  values (p_booking_id, v_coordinator, p_decision, nullif(trim(p_note), ''));
end;
$$;

revoke all on function public.review_public_showcase_booking(uuid, text, text) from public;
-- Retire the old code-hash review RPC for client roles; the public demo uses the tightly scoped RPC below.
revoke all on function public.review_showcase_booking(uuid, bytea, text, text) from anon, authenticated;
grant execute on function public.review_public_showcase_booking(uuid, text, text) to anon, authenticated;

commit;
