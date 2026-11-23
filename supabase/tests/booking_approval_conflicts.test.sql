begin;
select plan(5);

do $$
declare
  v_department_id uuid := extensions.gen_random_uuid();
  v_student_id uuid := extensions.gen_random_uuid();
  v_faculty_id uuid := extensions.gen_random_uuid();
  v_equipment_id uuid := extensions.gen_random_uuid();
  v_project_id uuid := extensions.gen_random_uuid();
  v_first_booking_id uuid := extensions.gen_random_uuid();
  v_second_booking_id uuid := extensions.gen_random_uuid();
  v_alternative_booking_id uuid := extensions.gen_random_uuid();
  v_start timestamptz := now() + interval '2 days';
  v_conflict_state text;
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values
    (v_student_id, 'authenticated', 'authenticated', v_student_id::text || '@booking-test.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (v_faculty_id, 'authenticated', 'authenticated', v_faculty_id::text || '@booking-test.invalid', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb);

  insert into public.departments (id, slug, name, code)
  values (v_department_id, 'booking-test-' || left(v_department_id::text, 8), 'Booking Test ' || left(v_department_id::text, 8), 'BT' || upper(left(replace(v_department_id::text, '-', ''), 8)));

  insert into public.department_memberships (department_id, user_id, role)
  values (v_department_id, v_student_id, 'student'), (v_department_id, v_faculty_id, 'faculty');

  insert into public.equipment (id, slug, department_id, name, category, lab_name, building, floor)
  values (v_equipment_id, 'booking-test-equipment-' || left(v_equipment_id::text, 8), v_department_id, 'Booking Test Equipment', 'Test equipment', 'Booking Test Lab', 'Test Building', '1');

  insert into public.projects (id, department_id, owner_id, title, description)
  values (v_project_id, v_department_id, v_student_id, 'Booking Conflict Test', 'Temporary project fixture for approval conflict tests.');

  insert into public.booking_requests (id, project_id, equipment_id, requested_by, starts_at, ends_at, purpose)
  values
    (v_first_booking_id, v_project_id, v_equipment_id, v_student_id, v_start, v_start + interval '1 hour', 'First competing request for the same equipment.'),
    (v_second_booking_id, v_project_id, v_equipment_id, v_student_id, v_start, v_start + interval '1 hour', 'Second competing request for the same equipment.'),
    (v_alternative_booking_id, v_project_id, v_equipment_id, v_student_id, v_start + interval '2 hours', v_start + interval '3 hours', 'Non-overlapping alternative equipment request.');

  perform ok(
    (select count(*) = 2 from public.booking_requests where id in (v_first_booking_id, v_second_booking_id) and status = 'pending'),
    'two overlapping pending requests can be recorded'
  );

  perform set_config('request.jwt.claim.sub', v_faculty_id::text, true);
  perform public.review_booking_request(v_first_booking_id, 'approved', null);

  perform ok(
    (select status = 'approved' from public.booking_requests where id = v_first_booking_id),
    'the first competing request is approved'
  );

  begin
    perform public.review_booking_request(v_second_booking_id, 'approved', null);
    v_conflict_state := null;
  exception when exclusion_violation then
    v_conflict_state := sqlstate;
  end;

  perform is(v_conflict_state, '23P01', 'the second overlapping approval is rejected as a conflict');
  perform ok(
    (select status = 'pending' from public.booking_requests where id = v_second_booking_id),
    'a rejected conflicting request remains pending'
  );

  perform public.review_booking_request(v_alternative_booking_id, 'approved', null);
  perform ok(
    (select status = 'approved' from public.booking_requests where id = v_alternative_booking_id),
    'a non-overlapping alternative request can be approved'
  );
end;
$$;

select * from finish();
rollback;
