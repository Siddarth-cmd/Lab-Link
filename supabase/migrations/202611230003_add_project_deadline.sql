-- Project deadlines were part of the workspace flow but not persisted in the
-- original Stage 2 schema. Nullable preserves all existing project records.
alter table public.projects
  add column if not exists deadline date;

create or replace function public.cancel_booking_request(p_booking_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_requester uuid;
  v_status public.booking_status;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  select requested_by, status into v_requester, v_status
  from public.booking_requests
  where id = p_booking_request_id
  for update;
  if not found then
    raise exception 'Booking request not found' using errcode = 'P0002';
  end if;
  if v_requester <> v_actor then
    raise exception 'Only the requester can cancel this booking' using errcode = '42501';
  end if;
  if v_status <> 'pending' then
    raise exception 'Only pending requests can be cancelled' using errcode = '23514';
  end if;
  update public.booking_requests set status = 'cancelled' where id = p_booking_request_id;
end;
$$;
revoke all on function public.cancel_booking_request(uuid) from public, anon;
grant execute on function public.cancel_booking_request(uuid) to authenticated;
