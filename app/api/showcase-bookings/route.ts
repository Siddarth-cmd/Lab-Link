import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import { showcaseReadError } from "@/lib/showcase/data-errors";
import { createShowcaseBookingSchema } from "@/lib/validation/requests";
import { readLimitedJson } from "@/lib/showcase/limited-json";

export async function GET(request: Request) {
  const supabase = await createSupabasePublicServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const params = new URL(request.url).searchParams;
  let query = supabase.from("showcase_bookings")
    .select("id,student_id,project_id,equipment_id,starts_at,ends_at,purpose,status,created_at,updated_at,student:showcase_students!inner(id,display_name,department,project_focus),project:showcase_projects!inner(id,title,description,deadline),equipment:equipment!inner(id,slug,name,lab_name,department_id),decision:showcase_decisions(decision,note,created_at)")
    .order("created_at", { ascending: false }).limit(100);
  const studentId = params.get("student");
  const status = params.get("status");
  if (studentId) query = query.eq("student_id", studentId);
  if (status && ["pending", "approved", "rejected", "cancelled"].includes(status)) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return showcaseReadError(error);
  return NextResponse.json({ bookings: data ?? [], visibility: "public-showcase" }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createSupabasePublicServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const parsedBody = await readLimitedJson(request);
  if (!parsedBody.ok) return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  const body = parsedBody.value;
  const parsed = createShowcaseBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Showcase booking details are invalid." }, { status: 400 });
  const cancelTokenHash = `\\x${createHash("sha256").update(parsed.data.cancelToken).digest("hex")}`;
  const { data, error } = await supabase.rpc("create_showcase_booking", {
    p_submission_key: parsed.data.submissionKey, p_cancel_token_hash: cancelTokenHash,
    p_student_id: parsed.data.studentId, p_project_id: parsed.data.projectId,
    p_equipment_id: parsed.data.equipmentId, p_starts_at: parsed.data.startsAt,
    p_ends_at: parsed.data.endsAt, p_purpose: parsed.data.purpose,
  });
  if (error) {
    if (["PGRST202", "PGRST205", "42P01", "42883"].includes(error.code ?? "")) return NextResponse.json({ error: "Apply the showcase database migration before submitting requests." }, { status: 503 });
    if (error.code === "P0001") return NextResponse.json({ error: "The public showcase request limit has been reached. Try again later." }, { status: 429 });
    if (error.code === "23P01") return NextResponse.json({ error: "This equipment already has an approved reservation for that time." }, { status: 409 });
    if (error.code === "42501") return NextResponse.json({ error: "Showcase booking is not authorized." }, { status: 403 });
    if (["22023", "23503", "23514"].includes(error.code ?? "")) return NextResponse.json({ error: "The selected profile, project, equipment, or time range is invalid." }, { status: 400 });
    return showcaseReadError(error);
  }
  const booking = Array.isArray(data) ? data[0] : data;
  if (!booking) return NextResponse.json({ error: "Supabase did not return the saved showcase request." }, { status: 503 });
  return NextResponse.json({ booking, visibility: "public-showcase" }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
