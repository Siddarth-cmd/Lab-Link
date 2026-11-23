begin;

-- These fictional records are isolated from auth.users, production projects,
-- booking_requests, faculty_approvals, and the canonical equipment write path.
create table public.showcase_students (
  id uuid primary key,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  department text not null check (char_length(trim(department)) between 2 and 80),
  project_focus text not null check (char_length(trim(project_focus)) between 2 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.showcase_coordinator (
  id uuid primary key,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  access_code_hash bytea,
  created_at timestamptz not null default now()
);

create table public.showcase_projects (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_key uuid not null unique,
  student_id uuid not null references public.showcase_students(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 120),
  description text not null check (char_length(trim(description)) between 10 and 1000),
  deadline date not null,
  created_at timestamptz not null default now()
);
create index showcase_projects_student_created_idx on public.showcase_projects(student_id, created_at desc);

create table public.showcase_bookings (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_key uuid not null unique,
  cancel_token_hash bytea not null check (octet_length(cancel_token_hash) = 32),
  student_id uuid not null references public.showcase_students(id) on delete restrict,
  project_id uuid not null references public.showcase_projects(id) on delete restrict,
  equipment_id uuid not null references public.equipment(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  purpose text not null check (char_length(trim(purpose)) between 20 and 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint showcase_booking_valid_window check (ends_at > starts_at and ends_at - starts_at <= interval '8 hours'),
  -- The existing equipment schema has no quantity/unit-count field: one row is one bookable unit.
  constraint showcase_booking_approved_no_overlap exclude using gist (
    equipment_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'approved')
);
create index showcase_bookings_student_created_idx on public.showcase_bookings(student_id, created_at desc);
create index showcase_bookings_equipment_time_idx on public.showcase_bookings(equipment_id, starts_at);
create index showcase_bookings_status_created_idx on public.showcase_bookings(status, created_at desc);

create table public.showcase_decisions (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.showcase_bookings(id) on delete restrict,
  coordinator_id uuid not null references public.showcase_coordinator(id) on delete restrict,
  decision text not null check (decision in ('approved','rejected')),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  constraint showcase_decisions_one_per_booking unique (booking_id)
);
create index showcase_decisions_created_idx on public.showcase_decisions(created_at desc);

alter table public.showcase_students enable row level security;
alter table public.showcase_coordinator enable row level security;
alter table public.showcase_projects enable row level security;
alter table public.showcase_bookings enable row level security;
alter table public.showcase_decisions enable row level security;

revoke all on public.showcase_students, public.showcase_coordinator, public.showcase_projects,
  public.showcase_bookings, public.showcase_decisions from anon, authenticated;
grant select (id, display_name, department, project_focus, is_active, created_at) on public.showcase_students to anon, authenticated;
grant select (id, student_id, title, description, deadline, created_at) on public.showcase_projects to anon, authenticated;
grant select (id, student_id, project_id, equipment_id, starts_at, ends_at, purpose, status, created_at, updated_at)
  on public.showcase_bookings to anon, authenticated;
grant select (id, booking_id, coordinator_id, decision, note, created_at) on public.showcase_decisions to anon, authenticated;

create policy showcase_students_public_read on public.showcase_students for select to anon, authenticated using (is_active);
create policy showcase_projects_public_read on public.showcase_projects for select to anon, authenticated using (true);
create policy showcase_bookings_public_read on public.showcase_bookings for select to anon, authenticated using (true);
create policy showcase_decisions_public_read on public.showcase_decisions for select to anon, authenticated using (true);

insert into public.showcase_students(id, display_name, department, project_focus) values
  ('90000000-0000-4000-8000-000000000001', 'Aarav Sharma', 'CSE', 'Autonomous Rover'),
  ('90000000-0000-4000-8000-000000000002', 'Ananya Rao', 'AI & ML', 'Object Detection'),
  ('90000000-0000-4000-8000-000000000003', 'Rohan Mehta', 'ECE', 'Smart IoT Sensor'),
  ('90000000-0000-4000-8000-000000000004', 'Priya Nair', 'Mechanical', '3D Printing Prototype'),
  ('90000000-0000-4000-8000-000000000005', 'Kiran Patel', 'Robotics', 'Line-Following Robot')
on conflict (id) do nothing;

insert into public.showcase_coordinator(id, display_name, access_code_hash)
values ('90000000-0000-4000-8000-000000000010', 'Dr. Meera Rao', null)
on conflict (id) do nothing;

-- Shared hard limits make the public RPC safe even if callers bypass the Next
-- route and call the publishable-key endpoint directly. The advisory lock
-- serializes quota checks across concurrent requests and app instances.
create function private.enforce_showcase_write_quota()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_total bigint;
  v_minute bigint;
  v_hour bigint;
begin
  perform pg_advisory_xact_lock(41900, 20261123);
  select count(*) into v_total from (
    select created_at from public.showcase_projects
    union all
    select created_at from public.showcase_bookings
  ) records;
  if v_total >= 1000 then raise exception 'Showcase storage quota reached' using errcode = 'P0001'; end if;
  select count(*) into v_minute from (
    select created_at from public.showcase_projects
    union all
    select created_at from public.showcase_bookings
  ) records where created_at >= now() - interval '1 minute';
  if v_minute >= 5 then raise exception 'Showcase per-minute limit reached' using errcode = 'P0001'; end if;
  select count(*) into v_hour from (
    select created_at from public.showcase_projects
    union all
    select created_at from public.showcase_bookings
  ) records where created_at >= now() - interval '1 hour';
  if v_hour >= 30 then raise exception 'Showcase hourly limit reached' using errcode = 'P0001'; end if;
end;
$$;
revoke all on function private.enforce_showcase_write_quota() from public, anon, authenticated;

create function public.create_showcase_project(
  p_submission_key uuid, p_student_id uuid, p_title text, p_description text, p_deadline date
)
returns table (id uuid, student_id uuid, title text, description text, deadline date, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_existing public.showcase_projects%rowtype; v_new public.showcase_projects%rowtype;
begin
  if p_submission_key is null or p_student_id is null
    or p_title is null or char_length(trim(p_title)) not between 3 and 120
    or p_description is null or char_length(trim(p_description)) not between 10 and 1000
    or p_deadline is null or p_deadline < current_date then
    raise exception 'Showcase project input is invalid' using errcode = '22023';
  end if;
  if not exists (select 1 from public.showcase_students s where s.id = p_student_id and s.is_active) then
    raise exception 'Showcase student profile is not active' using errcode = '23503';
  end if;
  perform pg_advisory_xact_lock(41900, 20261123);
  select * into v_existing from public.showcase_projects p where p.submission_key = p_submission_key;
  if found then
    if v_existing.student_id <> p_student_id or v_existing.title <> trim(p_title)
      or v_existing.description <> trim(p_description) or v_existing.deadline <> p_deadline then
      raise exception 'Submission key was already used for different project data' using errcode = '22023';
    end if;
    return query select v_existing.id,v_existing.student_id,v_existing.title,v_existing.description,v_existing.deadline,v_existing.created_at;
    return;
  end if;
  if (select count(*) from public.showcase_projects p where p.student_id = p_student_id) >= 3 then
    raise exception 'Showcase project limit reached for this profile' using errcode = 'P0001';
  end if;
  perform private.enforce_showcase_write_quota();
  insert into public.showcase_projects as saved(submission_key,student_id,title,description,deadline)
    values (p_submission_key,p_student_id,trim(p_title),trim(p_description),p_deadline)
    returning saved.* into v_new;
  return query select v_new.id,v_new.student_id,v_new.title,v_new.description,v_new.deadline,v_new.created_at;
end;
$$;

create function public.create_showcase_booking(
  p_submission_key uuid, p_cancel_token_hash bytea, p_student_id uuid, p_project_id uuid,
  p_equipment_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_purpose text
)
returns table (id uuid, student_id uuid, project_id uuid, equipment_id uuid, starts_at timestamptz,
  ends_at timestamptz, purpose text, status text, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_existing public.showcase_bookings%rowtype; v_new public.showcase_bookings%rowtype;
begin
  if p_submission_key is null or p_cancel_token_hash is null or octet_length(p_cancel_token_hash) <> 32
    or p_student_id is null or p_project_id is null or p_equipment_id is null
    or p_starts_at is null or p_ends_at is null or p_starts_at <= now() or p_ends_at <= p_starts_at
    or p_ends_at - p_starts_at > interval '8 hours'
    or p_purpose is null or char_length(trim(p_purpose)) not between 20 and 1000 then
    raise exception 'Showcase booking input is invalid' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(41900, 20261123);
  select * into v_existing from public.showcase_bookings b where b.submission_key = p_submission_key;
  if found then
    if v_existing.cancel_token_hash <> p_cancel_token_hash or v_existing.student_id <> p_student_id
      or v_existing.project_id <> p_project_id or v_existing.equipment_id <> p_equipment_id
      or v_existing.starts_at <> p_starts_at or v_existing.ends_at <> p_ends_at
      or v_existing.purpose <> trim(p_purpose) then
      raise exception 'Submission key was already used for different booking data' using errcode = '22023';
    end if;
    return query select v_existing.id,v_existing.student_id,v_existing.project_id,v_existing.equipment_id,
      v_existing.starts_at,v_existing.ends_at,v_existing.purpose,v_existing.status,v_existing.created_at;
    return;
  end if;
  if not exists (select 1 from public.showcase_students s where s.id=p_student_id and s.is_active)
    or not exists (select 1 from public.showcase_projects p where p.id=p_project_id and p.student_id=p_student_id and p.deadline >= (p_starts_at at time zone 'UTC')::date)
    or not exists (select 1 from public.equipment e where e.id=p_equipment_id and e.is_active and e.status <> 'maintenance') then
    raise exception 'Showcase profile, project, or equipment is unavailable' using errcode = '23503';
  end if;
  perform private.enforce_showcase_write_quota();
  insert into public.showcase_bookings as saved(
    submission_key,cancel_token_hash,student_id,project_id,equipment_id,starts_at,ends_at,purpose
  ) values (p_submission_key,p_cancel_token_hash,p_student_id,p_project_id,p_equipment_id,p_starts_at,p_ends_at,trim(p_purpose))
  returning saved.* into v_new;
  return query select v_new.id,v_new.student_id,v_new.project_id,v_new.equipment_id,
    v_new.starts_at,v_new.ends_at,v_new.purpose,v_new.status,v_new.created_at;
end;
$$;

create function public.cancel_showcase_booking(p_booking_id uuid, p_cancel_token_hash bytea)
returns void language plpgsql security definer set search_path = '' as $$
declare v_booking public.showcase_bookings%rowtype;
begin
  select * into v_booking from public.showcase_bookings b where b.id=p_booking_id for update;
  if not found or p_cancel_token_hash is null or v_booking.cancel_token_hash <> p_cancel_token_hash then
    raise exception 'Showcase booking or cancellation token is invalid' using errcode = '42501';
  end if;
  if v_booking.status <> 'pending' then
    raise exception 'Only pending showcase requests can be cancelled' using errcode = '23514';
  end if;
  update public.showcase_bookings set status='cancelled', updated_at=now() where id=p_booking_id;
end;
$$;

create function public.review_showcase_booking(
  p_booking_id uuid, p_coordinator_code_hash bytea, p_decision text, p_note text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.showcase_bookings%rowtype;
  v_coordinator uuid;
  v_decisions bigint;
begin
  if p_decision is null or p_decision not in ('approved','rejected') or (p_note is not null and char_length(p_note)>1000) then
    raise exception 'Showcase decision input is invalid' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(41901, 20261123);
  select c.id into v_coordinator from public.showcase_coordinator c
  where c.access_code_hash is not null and c.access_code_hash=p_coordinator_code_hash limit 1;
  if v_coordinator is null then raise exception 'Showcase coordinator access denied' using errcode = '42501'; end if;
  select * into v_booking from public.showcase_bookings b where b.id=p_booking_id for update;
  if not found then raise exception 'Showcase booking not found' using errcode = 'P0002'; end if;
  if v_booking.status <> 'pending' then raise exception 'Showcase request has already been reviewed' using errcode = '23514'; end if;
  select count(*) into v_decisions from public.showcase_decisions d where d.created_at >= now()-interval '1 hour';
  if v_decisions >= 60 then raise exception 'Coordinator review rate limit reached' using errcode = 'P0001'; end if;
  update public.showcase_bookings set status=p_decision, updated_at=now() where id=p_booking_id;
  insert into public.showcase_decisions(booking_id,coordinator_id,decision,note)
  values (p_booking_id,v_coordinator,p_decision,nullif(trim(p_note),''));
end;
$$;

revoke all on function public.create_showcase_project(uuid,uuid,text,text,date) from public;
revoke all on function public.create_showcase_booking(uuid,bytea,uuid,uuid,uuid,timestamptz,timestamptz,text) from public;
revoke all on function public.cancel_showcase_booking(uuid,bytea) from public;
revoke all on function public.review_showcase_booking(uuid,bytea,text,text) from public;
grant execute on function public.create_showcase_project(uuid,uuid,text,text,date) to anon, authenticated;
grant execute on function public.create_showcase_booking(uuid,bytea,uuid,uuid,uuid,timestamptz,timestamptz,text) to anon, authenticated;
grant execute on function public.cancel_showcase_booking(uuid,bytea) to anon, authenticated;
grant execute on function public.review_showcase_booking(uuid,bytea,text,text) to anon, authenticated;

commit;
