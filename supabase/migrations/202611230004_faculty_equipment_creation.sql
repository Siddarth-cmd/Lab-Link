begin;

-- Canonical inventory additions are limited to verified department faculty.
-- The public showcase keeps equipment browsing public and exposes no anonymous
-- insert path to the canonical equipment table.
grant insert on public.equipment to authenticated;

create policy equipment_faculty_create on public.equipment
  for insert to authenticated
  with check (
    private.has_department_role(
      department_id,
      array['faculty','department_admin']::public.department_role[]
    )
  );

commit;
