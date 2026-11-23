import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

function source(path: string) { return readFileSync(join(process.cwd(), path), "utf8"); }

test("institutional projects, bookings, and approvals remain authenticated", () => {
  const projectRoute = source("app/api/projects/route.ts");
  const bookingRoute = source("app/api/booking-requests/route.ts");
  const approvalRoute = source("app/api/approvals/route.ts");
  const reviewRoute = source("app/api/approvals/[id]/route.ts");
  for (const [path, text] of [["projects", projectRoute], ["booking requests", bookingRoute], ["approvals", approvalRoute]]) {
    assert.match(text, /requireAuthenticatedSupabaseUser\(\)/, `${path} requires a verified cookie session`);
    assert.match(text, /Cache-Control.*no-store/);
  }
  assert.match(projectRoute, /owner_id:\s*auth\.user\.id/);
  assert.match(bookingRoute, /requested_by:\s*auth\.user\.id/);
  assert.match(approvalRoute, /department_memberships/);
  assert.match(reviewRoute, /hasFacultyApprovalPermission/);
  assert.match(reviewRoute, /rpc\("review_booking_request"/);
});

test("public showcase pages use isolated Supabase APIs without auth prompts or local persistence", () => {
  const paths = ["app/student/page.tsx", "app/student/projects/page.tsx", "app/student/bookings/page.tsx", "app/student/bookings/new/page.tsx", "components/student/NewBookingForm.tsx", "app/faculty/page.tsx"];
  const all = paths.map(source).join("\n");
  assert.doesNotMatch(all, /SessionSetupLink|Continue with an existing student account|Public showcase is read-only for this workspace/i);
  assert.doesNotMatch(all, /demo-workspace-store|useDemoWorkspace/);
  assert.match(source("app/page.tsx"), /Student Portal/);
  assert.match(source("app/page.tsx"), /Faculty Portal/);
  assert.match(source("components/usePollingResource.ts"), /setInterval/);
  assert.match(source("components/usePollingResource.ts"), /removeEventListener/);
  assert.match(source("components/showcase/ShowcaseStudentProvider.tsx"), /localStorage/);
  assert.match(source("components/showcase/ShowcaseStudentProvider.tsx"), /STORAGE_KEY/);
  assert.match(source("components/showcase/ShowcaseStudentPicker.tsx"), /Selection grants no production access/);
  assert.match(source("lib/supabase/server.ts"), /createSupabasePublicServerClient/);
  assert.match(source("lib/equipment-service.ts"), /createSupabasePublicServerClient/);
});

test("five fixed fictional profiles are seeded consistently in TypeScript and SQL", () => {
  const profiles = source("lib/showcase/profiles.ts");
  const migration = source("supabase/migrations/202611230005_public_showcase_requests.sql");
  for (const person of ["Aarav Sharma", "Ananya Rao", "Rohan Mehta", "Priya Nair", "Kiran Patel", "Dr. Meera Rao"]) {
    assert.ok(profiles.includes(person), `TypeScript profile is missing ${person}`);
    assert.ok(migration.includes(person), `SQL seed is missing ${person}`);
  }
  assert.match(profiles, /Autonomous Rover/);
  assert.match(profiles, /Object Detection/);
  assert.match(profiles, /Smart IoT Sensor/);
  assert.match(profiles, /3D Printing Prototype/);
  assert.match(profiles, /Line-Following Robot/);
});

test("showcase writes use bounded, validated database RPCs and persistent shared records", () => {
  const projectRoute = source("app/api/showcase-projects/route.ts");
  const bookingRoute = source("app/api/showcase-bookings/route.ts");
  const bookingsPage = source("app/student/bookings/page.tsx");
  const facultyPage = source("app/faculty/page.tsx");
  assert.match(projectRoute, /readLimitedJson/);
  assert.match(projectRoute, /rpc\("create_showcase_project"/);
  assert.match(bookingRoute, /readLimitedJson/);
  assert.match(bookingRoute, /rpc\("create_showcase_booking"/);
  assert.match(bookingRoute, /submissionKey/);
  assert.match(bookingsPage, /\/api\/showcase-bookings/);
  assert.match(bookingsPage, /setInterval|usePollingResource/);
  assert.match(facultyPage, /\/api\/showcase-bookings/);
  assert.match(facultyPage, /\/decision/);
  assert.match(source("lib/showcase/limited-json.ts"), /maxBytes = 8192/);
});

test("showcase tables expose only safe reads and database serialization blocks conflicting approvals", () => {
  const migration = source("supabase/migrations/202611230005_public_showcase_requests.sql");
  assert.match(migration, /alter table public\.showcase_bookings enable row level security/i);
  assert.match(migration, /revoke all on public\.showcase_students[\s\S]*from anon, authenticated/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete|all)[^;]*\bon public\.showcase_/i);
  assert.match(migration, /exclude using gist[\s\S]*where \(status = 'approved'\)/i);
  assert.match(migration, /create function public\.review_showcase_booking/i);
  assert.match(migration, /update public\.showcase_bookings set status=p_decision/i);
  assert.match(migration, /insert into public\.showcase_decisions/i)
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /showcase_booking_approved_no_overlap/);
  assert.match(migration, /p_decision is null or p_decision not in/);
  assert.match(migration, /one row is one bookable unit/);
  assert.match(migration, /p\.deadline >= \(p_starts_at at time zone 'UTC'\)::date/);
  assert.match(migration, /showcase storage quota reached/i);
});

test("showcase approvals are direct but isolated, while production faculty approvals remain authenticated", () => {
  const decision = source("app/api/showcase-bookings/[id]/decision/route.ts");
  const facultyPage = source("app/faculty/page.tsx");
  const migration = source("supabase/migrations/202611230006_public_showcase_decisions.sql");
  assert.match(decision, /createSupabasePublicServerClient/);
  assert.match(decision, /rpc\("review_public_showcase_booking"/);
  assert.match(decision, /23P01/);
  assert.match(facultyPage, /Approve/);
  assert.match(facultyPage, /Reject/);
  assert.doesNotMatch(facultyPage, /unlock|access code/i);
  assert.match(migration, /grant execute[\s\S]*to anon, authenticated/i);
  assert.match(migration, /update public\.showcase_bookings/);
  assert.match(migration, /insert into public\.showcase_decisions/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /v_minute >= 10/);
  assert.match(migration, /v_hour >= 60/);
  assert.match(migration, /review_showcase_booking\(uuid, bytea, text, text\) from anon, authenticated/i);
  assert.match(source("app/api/approvals/[id]/route.ts"), /requireAuthenticatedSupabaseUser\(\)/);
});

test("anonymous canonical equipment writes and production booking/approval APIs remain protected", () => {
  const equipmentRoute = source("app/api/equipment/route.ts");
  assert.match(equipmentRoute, /export async function GET/);
  assert.match(equipmentRoute, /export async function POST/);
  assert.match(equipmentRoute, /requireAuthenticatedSupabaseUser\(\)/);
  assert.match(equipmentRoute, /hasFacultyApprovalPermission/);
  assert.doesNotMatch(equipmentRoute, /showcase/);
  assert.match(source("lib/supabase/api.ts"), /status:\s*401/);
});
