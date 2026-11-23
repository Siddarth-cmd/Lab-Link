import { NextResponse } from "next/server";
import { databaseReadError, databaseWriteError, requireAuthenticatedSupabaseUser } from "@/lib/supabase/api";
import { createBookingRequestSchema } from "@/lib/validation/requests";

export async function GET() {
  const auth = await requireAuthenticatedSupabaseUser();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;

  const { data, error } = await auth.supabase.from("booking_requests")
    .select("id,project_id,equipment_id,requested_by,starts_at,ends_at,purpose,status,created_at,updated_at,equipment:equipment!inner(id,slug,name,lab_name,department_id),project:projects!inner(id,title,deadline,department_id)")
    .eq("requested_by", auth.user.id).order("created_at", { ascending: false });
  if (error) return databaseReadError(error);
  return NextResponse.json({ bookingRequests: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedSupabaseUser();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid JSON booking request." }, { status: 400 }); }
  const parsed = createBookingRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Booking details are invalid." }, { status: 400 });

  const { data, error } = await auth.supabase.from("booking_requests").insert({
    project_id: parsed.data.projectId,
    equipment_id: parsed.data.equipmentId,
    requested_by: auth.user.id,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
    purpose: parsed.data.purpose,
  }).select("id, project_id, equipment_id, starts_at, ends_at, purpose, status, created_at").single();
  if (error) return databaseWriteError(error);
  return NextResponse.json({ bookingRequest: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
