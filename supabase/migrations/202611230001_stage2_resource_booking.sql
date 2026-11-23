create schema if not exists extensions;
create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

create type public.department_role as enum ('student', 'faculty', 'department_admin');
create type public.booking_status as enum ('pending', 'approved', 'rejected', 'changes_requested', 'cancelled');
create type public.approval_decision as enum ('approved', 'rejected', 'changes_requested');

create table public.departments (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique check (char_length(trim(name)) between 2 and 120),
  code text not null unique check (code ~ '^[A-Z0-9-]{2,16}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.department_memberships (
  department_id uuid not null references public.departments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.department_role not null,
  created_at timestamptz not null default now(),
  primary key (department_id, user_id)
);
create index department_memberships_user_idx on public.department_memberships(user_id, department_id);

create table public.equipment (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  department_id uuid not null references public.departments(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 160),
  category text not null check (char_length(trim(category)) between 2 and 80),
  lab_name text not null check (char_length(trim(lab_name)) between 2 and 160),
  building text not null check (char_length(trim(building)) between 2 and 120),
  floor text not null check (char_length(trim(floor)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 4000),
  image_url text,
  specifications jsonb not null default '{}'::jsonb check (jsonb_typeof(specifications) = 'object'),
  status text not null default 'available' check (status in ('available', 'in_use', 'maintenance')),
  utilization_percent numeric(5,2) not null default 0 check (utilization_percent between 0 and 100),
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  next_available_at timestamptz,
  training_required boolean not null default false,
  is_demo_seed boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index equipment_department_active_idx on public.equipment(department_id, is_active);
create index equipment_category_idx on public.equipment(category);

create table public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 120),
  description text not null check (char_length(trim(description)) between 10 and 4000),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_owner_created_idx on public.projects(owner_id, created_at desc);
create index projects_department_idx on public.projects(department_id, created_at desc);

create table public.booking_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  equipment_id uuid not null references public.equipment(id) on delete restrict,
  requested_by uuid not null references auth.users(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  purpose text not null check (char_length(trim(purpose)) between 20 and 2000),
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_valid_window check (ends_at > starts_at and ends_at - starts_at <= interval '8 hours'),
  constraint booking_active_slot_no_overlap exclude using gist (
    equipment_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'approved'))
);
create index booking_requests_project_idx on public.booking_requests(project_id, created_at desc);
create index booking_requests_equipment_idx on public.booking_requests(equipment_id, starts_at);
create index booking_requests_requester_idx on public.booking_requests(requested_by, created_at desc);
create index booking_requests_status_start_idx on public.booking_requests(status, starts_at);

create table public.faculty_approvals (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete restrict,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision public.approval_decision not null,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index faculty_approvals_booking_created_idx on public.faculty_approvals(booking_request_id, created_at desc);
create index faculty_approvals_reviewer_idx on public.faculty_approvals(reviewer_id, created_at desc);

create function private.validate_booking_window()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.starts_at <= now() then
    raise exception 'Booking requests must start in the future' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger booking_requests_validate_window
  before insert on public.booking_requests
  for each row execute function private.validate_booking_window();
create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger equipment_set_updated_at before update on public.equipment for each row execute function private.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function private.set_updated_at();
create trigger booking_requests_set_updated_at before update on public.booking_requests for each row execute function private.set_updated_at();

create function private.has_department_role(p_department_id uuid, p_roles public.department_role[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.department_memberships dm
    where dm.department_id = p_department_id
      and dm.user_id = (select auth.uid())
      and dm.role = any(p_roles)
  );
$$;
create function private.is_project_owner(p_project_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.owner_id = (select auth.uid())
  );
$$;
create function private.can_create_booking(p_project_id uuid, p_equipment_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.projects p
    join public.equipment e on e.id = p_equipment_id
    join public.department_memberships dm on dm.department_id = p.department_id
      and dm.user_id = (select auth.uid())
    where p.id = p_project_id
      and p.owner_id = (select auth.uid())
      and p.status = 'active'
      and dm.role in ('student', 'faculty', 'department_admin')
      and e.is_active
      and e.status <> 'maintenance'
  );
$$;
revoke all on function private.has_department_role(uuid, public.department_role[]) from public, anon;
revoke all on function private.is_project_owner(uuid) from public, anon;
revoke all on function private.can_create_booking(uuid, uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_department_role(uuid, public.department_role[]) to authenticated;
grant execute on function private.is_project_owner(uuid) to authenticated;
grant execute on function private.can_create_booking(uuid, uuid) to authenticated;

alter table public.departments enable row level security;
alter table public.department_memberships enable row level security;
alter table public.equipment enable row level security;
alter table public.projects enable row level security;
alter table public.booking_requests enable row level security;
alter table public.faculty_approvals enable row level security;

revoke all on public.departments, public.department_memberships, public.equipment, public.projects, public.booking_requests, public.faculty_approvals from anon, authenticated;
grant select on public.departments, public.equipment to anon, authenticated;
grant update on public.equipment to authenticated;
grant select on public.department_memberships to authenticated;
grant select, insert on public.projects to authenticated;
grant select, insert on public.booking_requests to authenticated;
grant select on public.faculty_approvals to authenticated;

create policy departments_read_active on public.departments for select to anon, authenticated using (is_active);
create policy equipment_read_active on public.equipment for select to anon, authenticated using (is_active);
create policy equipment_faculty_manage on public.equipment for update to authenticated
  using (private.has_department_role(department_id, array['faculty','department_admin']::public.department_role[]))
  with check (private.has_department_role(department_id, array['faculty','department_admin']::public.department_role[]));
create policy memberships_read_self_or_faculty on public.department_memberships for select to authenticated
  using (user_id = (select auth.uid()) or private.has_department_role(department_id, array['faculty','department_admin']::public.department_role[]));
create policy projects_read_owner_or_faculty on public.projects for select to authenticated
  using (owner_id = (select auth.uid()) or private.has_department_role(department_id, array['faculty','department_admin']::public.department_role[]));
create policy projects_create_for_member_department on public.projects for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and private.has_department_role(department_id, array['student','faculty','department_admin']::public.department_role[])
  );
create policy booking_requests_read_requester_or_faculty on public.booking_requests for select to authenticated
  using (
    requested_by = (select auth.uid())
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and private.has_department_role(e.department_id, array['faculty','department_admin']::public.department_role[])
    )
  );
create policy booking_requests_create_project_owner on public.booking_requests for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and status = 'pending'
    and private.can_create_booking(project_id, equipment_id)
  );
create policy approvals_read_requester_or_faculty on public.faculty_approvals for select to authenticated
  using (
    exists (
      select 1 from public.booking_requests b
      join public.equipment e on e.id = b.equipment_id
      where b.id = booking_request_id
        and (b.requested_by = (select auth.uid())
          or private.has_department_role(e.department_id, array['faculty','department_admin']::public.department_role[]))
    )
  );

create function public.review_booking_request(
  p_booking_request_id uuid,
  p_decision public.approval_decision,
  p_note text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_department_id uuid;
  v_status public.booking_status;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_note is not null and char_length(p_note) > 1000 then
    raise exception 'Review note is too long' using errcode = '22023';
  end if;
  select e.department_id, b.status into v_department_id, v_status
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
  update public.booking_requests
    set status = p_decision::text::public.booking_status
    where id = p_booking_request_id;
  insert into public.faculty_approvals(booking_request_id, reviewer_id, decision, note)
    values (p_booking_request_id, v_actor, p_decision, nullif(trim(p_note), ''));
end;
$$;
revoke all on function public.review_booking_request(uuid, public.approval_decision, text) from public, anon;
grant execute on function public.review_booking_request(uuid, public.approval_decision, text) to authenticated;
