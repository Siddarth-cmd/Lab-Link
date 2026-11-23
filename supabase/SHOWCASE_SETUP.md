# LabLink public showcase setup

The public Student and Faculty portals use the isolated `showcase_*` tables. Institutional `projects`, `booking_requests`, `faculty_approvals`, and canonical equipment writes remain protected by their existing authenticated routes and RLS. The five selectable student profiles are fictional and do not create `auth.users` or grant production access.

## Apply the migration

1. In Supabase Dashboard, open the intended LabLink project and go to **SQL Editor**.
2. Check the applied migration list first (the repository does not automatically apply migrations):

   ```sql
   select version
   from supabase_migrations.schema_migrations
   where version in ('202611230003', '202611230004', '202611230005', '202611230006')
   order by version;
   ```

3. Confirm prerequisite migrations `202611230001` through `202611230005` are recorded. If 003/004 are absent, stop and apply the pending migrations in order using your deployment procedure. Runtime reads have already confirmed the 005-compatible tables and five profiles, so do not reapply 005 without checking its ledger entry.
4. If `202611230006` is absent from the ledger, open `supabase/migrations/202611230006_public_showcase_decisions.sql`, paste it into SQL Editor, review, and run once. Do not rerun an applied migration.
5. Verify seed rows and catalog inventory: select the five rows from `public.showcase_students` (all should be active), select Dr. Meera Rao from `public.showcase_coordinator`, and confirm the existing count of active `public.equipment` rows is unchanged. The migration adds no equipment.

## Showcase Faculty decisions

Public demo Approve/Reject actions are intentionally limited to the fictional rows in `showcase_bookings`; they never write to institutional `booking_requests` or `faculty_approvals`. No coordinator code is needed. Apply `202611230006_public_showcase_decisions.sql` once after migration 005 to enable the public decision RPC. PostgreSQL serializes decisions, allows overlapping pending requests, and rejects overlapping approved requests atomically. The decision table has global per-minute, per-hour, and total quotas.

This is a public showcase interaction, not proof of a real faculty identity or an institutional approval. The production `/api/approvals` routes remain protected by verified Supabase Auth and department membership.

## Verify

- `select id, display_name, department, project_focus, is_active from public.showcase_students order by display_name;` should return five fictional profiles.
- `select count(*) from public.showcase_projects;` and `select count(*) from public.showcase_bookings;` show persisted showcase submissions.
- Inspect `public.showcase_bookings` and `public.showcase_decisions` to confirm the same booking ID changes status and receives one decision row.
- Check `showcase_booking_approved_no_overlap`: pending requests may overlap; approval of the conflicting second request returns HTTP 409 and leaves it pending.
- In the browser, create one project and request from a fictional profile; open `/faculty`, approve or reject the showcase request directly, and confirm `/student/bookings` updates within its polling interval.
- Anonymous direct SQL table writes are not granted. Public operations are limited to validated RPCs, hard database quotas, the isolated records, and a one-time cancellation token.

This application change did not execute the migration. Read-only runtime checks currently return the five seeded profiles and empty showcase project/booking lists, so compatible showcase tables are queryable. Confirm the migration ledger separately before deciding whether any SQL remains to apply; never rerun it if its version is already recorded.
