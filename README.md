# LabLink · PromptWars 2026

Next.js App Router application for laboratory equipment discovery, projects, booking requests, and faculty approvals. Existing dashboard, navigation, responsive styling, catalog search and equipment details are preserved. The catalog uses Supabase when configured and clearly labeled seed data when it is not.

## Live demo

[Open LabLink](https://lab-link-tan.vercel.app/)

## Supabase setup

1. Create a Supabase project and install the Supabase CLI.
2. In this project directory, run `supabase link --project-ref <project-ref>` and `supabase db push` to apply `supabase/migrations/202611230001_stage2_resource_booking.sql`.
3. For local demo equipment, run `supabase db reset` (the optional `supabase/seed.sql` marks all inserted records as demo). Production projects can add their real departments and equipment through controlled admin SQL/imports.
4. The app loads Supabase configuration from the project `.env.local` or the parent `Lab-Link/.env.local` (the VS Code workspace root). Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` there from the Supabase project API settings; never put service-role keys in the browser or source control. `.env.local` is ignored.
5. Enable email OTP in Supabase Auth and add `http://localhost:3000/auth/callback` to the allowed redirect URLs.
6. Sign in using `/sign-in`. A LabLink administrator must provision a `department_memberships` row for each user; project creation is limited to members of the selected department.

Example provisioning SQL (run in Supabase SQL Editor with the user's Auth UUID):

```sql
insert into public.department_memberships (department_id, user_id, role)
select id, '<auth-user-uuid>'::uuid, 'student'
from public.departments where slug = 'shared-research-facilities';
```

## Stage 2 behavior and security

- The equipment catalog and details query active equipment through the public, RLS-protected read policy. A missing environment config shows labeled demo seed data; database failures show a connection/migration message rather than silently using demo rows.
- Projects and booking requests require a verified Supabase session. Zod validates all writes; RLS checks project ownership and department membership. The database validates windows and prevents overlapping pending/approved equipment slots with an exclusion constraint.
- Faculty approval POSTs verify the signed-in user and their department role on the server, then call `review_booking_request`. The database function repeats the role check and atomically writes the approval and booking status. There is no client-side role trust or service-role client.
- `supabase/tests/stage2_schema.test.sql` checks the core tables, RLS activation, the booking exclusion constraint and future-slot trigger. Run it locally with `supabase test db` after `supabase start`. TypeScript request validation tests run with `npm test`.

## Local development and checks

```bash
npm ci
npm run dev
npm test
npm run build
```

Without credentials, `GET /api/equipment` returns labeled demo rows. With credentials and migrations applied, it returns current Supabase equipment. Never log or share `.env.local` values.

## Scope

FairShare optimization and Gemini Copilot are intentionally not implemented in this stage.
