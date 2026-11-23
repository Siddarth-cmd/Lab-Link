import { NextResponse } from "next/server";
import { getEquipmentCatalog } from "@/lib/equipment-service";
import { databaseWriteError, facultyForbiddenResponse, hasFacultyApprovalPermission, requireAuthenticatedSupabaseUser } from "@/lib/supabase/api";
import { createEquipmentSchema } from "@/lib/validation/requests";


export async function GET() {
  const result = await getEquipmentCatalog();
  if (result.source === "error") return NextResponse.json({ error: result.message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ items: result.items, source: result.source }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedSupabaseUser();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send valid JSON equipment details." }, { status: 400 }); }
  const parsed = createEquipmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Equipment details are invalid." }, { status: 400 });
  const { data: membership, error: membershipError } = await auth.supabase.from("department_memberships")
    .select("role").eq("user_id", auth.user.id).eq("department_id", parsed.data.departmentId)
    .in("role", ["faculty", "department_admin"]).maybeSingle();
  if (membershipError) return databaseWriteError(membershipError);
  if (!hasFacultyApprovalPermission(membership, membershipError)) return facultyForbiddenResponse("Only verified faculty in the selected department can add canonical equipment.");
  const slugBase = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  const { data, error } = await auth.supabase.from("equipment").insert({
    slug: `${slugBase}-${crypto.randomUUID().slice(0, 8)}`,
    department_id: parsed.data.departmentId,
    name: parsed.data.name,
    category: parsed.data.category,
    lab_name: parsed.data.labName,
    building: parsed.data.building,
    floor: parsed.data.floor,
    description: parsed.data.description,
    specifications: parsed.data.specifications,
  }).select("id,slug,name,category,lab_name,building,floor,description,specifications,status,is_active").single();
  if (error) return databaseWriteError(error);
  return NextResponse.json({ equipment: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
