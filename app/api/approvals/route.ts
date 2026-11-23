import { NextResponse } from "next/server";
import { databaseReadError, facultyForbiddenResponse, requireAuthenticatedSupabaseUser } from "@/lib/supabase/api";

type ApprovalRow = {
  equipment: { id: string; slug: string; name: string; lab_name: string; department_id: string } | { id: string; slug: string; name: string; lab_name: string; department_id: string }[] | null;
};

export async function GET() {
  const auth = await requireAuthenticatedSupabaseUser();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;

  const { data: memberships, error: membershipError } = await auth.supabase.from("department_memberships")
    .select("department_id").eq("user_id", auth.user.id).in("role", ["faculty", "department_admin"]);
  if (membershipError) return databaseReadError(membershipError);
  const departmentIds = [...new Set((memberships ?? []).map((membership) => membership.department_id))];
  if (!departmentIds.length) return facultyForbiddenResponse();
  const { data: departments, error: departmentsError } = await auth.supabase.from("departments")
    .select("id,name,code").eq("is_active", true).in("id", departmentIds).order("name");
  if (departmentsError) return databaseReadError(departmentsError);

  const { data, error } = await auth.supabase.from("booking_requests")
    .select("id,project_id,equipment_id,requested_by,starts_at,ends_at,purpose,status,created_at,equipment:equipment!inner(id,slug,name,lab_name,department_id),project:projects!inner(id,title,deadline,department_id)")
    .order("created_at", { ascending: true });
  if (error) return databaseReadError(error);

  // RLS limits this query to the caller's faculty departments; the explicit
  // membership filter keeps the API contract department-scoped as well.
  const requests = ((data ?? []) as unknown as ApprovalRow[]).filter((row) => {
    const item = Array.isArray(row.equipment) ? row.equipment[0] : row.equipment;
    return Boolean(item && departmentIds.includes(item.department_id));
  });
  return NextResponse.json({ bookingRequests: requests, departments: departments ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
