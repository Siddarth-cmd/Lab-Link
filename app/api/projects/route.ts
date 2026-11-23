import { NextResponse } from "next/server";
import { databaseReadError, databaseWriteError, requireAuthenticatedSupabaseUser } from "@/lib/supabase/api";
import { createProjectSchema } from "@/lib/validation/requests";

export async function GET() {
  const auth = await requireAuthenticatedSupabaseUser();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;

  const { data: memberships, error: membershipError } = await auth.supabase.from("department_memberships")
    .select("department_id").eq("user_id", auth.user.id).eq("role", "student");
  if (membershipError) return databaseReadError(membershipError);

  const [projectsResult, departmentsResult] = await Promise.all([
    auth.supabase.from("projects").select("id,department_id,title,description,deadline,status,created_at,department:departments(name)")
      .eq("owner_id", auth.user.id).order("created_at", { ascending: false }),
    memberships?.length
      ? auth.supabase.from("departments").select("id,name,code").eq("is_active", true).in("id", memberships.map((item) => item.department_id)).order("name")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (projectsResult.error) return databaseReadError(projectsResult.error);
  if (departmentsResult.error) return databaseReadError(departmentsResult.error);
  return NextResponse.json({ projects: projectsResult.data ?? [], departments: departmentsResult.data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedSupabaseUser();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid JSON project request." }, { status: 400 }); }
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Project details are invalid." }, { status: 400 });

  const { data, error } = await auth.supabase.from("projects").insert({
    department_id: parsed.data.departmentId,
    owner_id: auth.user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    deadline: parsed.data.deadline ?? null,
  }).select("id, department_id, title, description, deadline, status, created_at").single();
  if (error) return databaseWriteError(error);
  return NextResponse.json({ project: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
