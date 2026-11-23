import { NextResponse, type NextRequest } from "next/server";
import { databaseReadError, databaseWriteError, facultyForbiddenResponse, hasFacultyApprovalPermission, requireAuthenticatedSupabaseUser } from "@/lib/supabase/api";
import { reviewBookingSchema } from "@/lib/validation/requests";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedSupabaseUser();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;

  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid JSON review." }, { status: 400 }); }
  const parsed = reviewBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Review details are invalid." }, { status: 400 });

  // Check both the signed-in identity and faculty membership on the server before calling the DB RPC.
  const { data: booking, error: bookingError } = await auth.supabase.from("booking_requests")
    .select("id,equipment:equipment!inner(department_id)").eq("id", id).maybeSingle();
  if (bookingError) return databaseReadError(bookingError);
  if (!booking) return facultyForbiddenResponse("Booking request is unavailable or you are not authorized to review it.");
  const equipment = Array.isArray(booking.equipment) ? booking.equipment[0] : booking.equipment;
  const departmentId = equipment?.department_id;
  if (!departmentId) return facultyForbiddenResponse("The booking's department could not be verified.");
  const { data: membership, error: membershipError } = await auth.supabase.from("department_memberships")
    .select("role").eq("user_id", auth.user.id).eq("department_id", departmentId).in("role", ["faculty", "department_admin"]).maybeSingle();
  if (membershipError) return databaseReadError(membershipError);
  if (!hasFacultyApprovalPermission(membership, membershipError)) return facultyForbiddenResponse();

  const { error } = await auth.supabase.rpc("review_booking_request", {
    p_booking_request_id: id,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note || null,
  });
  if (error) return databaseWriteError(error);
  return NextResponse.json({ reviewed: true }, { headers: { "Cache-Control": "no-store" } });
}
