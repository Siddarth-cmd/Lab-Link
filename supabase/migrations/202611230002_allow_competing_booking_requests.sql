begin;

-- Pending requests are competing proposals, not confirmed allocations. Let them
-- overlap; the exclusion constraint still serializes concurrent approvals.
alter table public.booking_requests
  drop constraint if exists booking_active_slot_no_overlap;

alter table public.booking_requests
  add constraint booking_active_slot_no_overlap
  exclude using gist (
    equipment_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'approved');

create or replace function public.review_booking_request(
  p_booking_request_id uuid,
  p_decision public.approval_decision,
  p_note text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_department_id uuid;
  v_equipment_id uuid;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_status public.booking_status;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_note is not null and char_length(p_note) > 1000 then
    raise exception 'Review note is too long' using errcode = '22023';
  end if;

  select e.department_id, b.equipment_id, b.starts_at, b.ends_at, b.status
    into v_department_id, v_equipment_id, v_starts_at, v_ends_at, v_status
  from public.booking_requests b
  join public.equipment e on e.id = b.equipment_id
  where b.id = p_booking_request_id
  for update of b;

  if not found then
    raise exception 'Booking request not found' using errcode = 'P0002';
  end if;
  if not private.has_department_role(v_department_id, array['faculty','department_admin']::public.department_role[]) then
    raise exception 'Faculty authorization required' using errcode = '42501';
  end if;
  if v_status <> 'pending' then
    raise exception 'Only pending requests can be reviewed' using errcode = '23514';
  end if;

  if p_decision = 'approved'::public.approval_decision and exists (
    select 1
    from public.booking_requests competing
    where competing.equipment_id = v_equipment_id
      and competing.id <> p_booking_request_id
      and competing.status = 'approved'
      and tstzrange(competing.starts_at, competing.ends_at, '[)')
          && tstzrange(v_starts_at, v_ends_at, '[)')
  ) then
    raise exception 'This equipment unit has already been approved for an overlapping time.'
      using errcode = '23P01';
  end if;

  -- The approved-only GiST exclusion constraint is the final atomic guard if
  -- another transaction approves an overlapping request after the check above.
  update public.booking_requests
    set status = p_decision::text::public.booking_status
    where id = p_booking_request_id;

  insert into public.faculty_approvals(booking_request_id, reviewer_id, decision, note)
    values (p_booking_request_id, v_actor, p_decision, nullif(trim(p_note), ''));
end;
$$;

commit;
