import { NextResponse } from "next/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import { showcaseReadError } from "@/lib/showcase/data-errors";
import { createShowcaseProjectSchema } from "@/lib/validation/requests";
import { readLimitedJson } from "@/lib/showcase/limited-json";

export async function GET(request: Request) {
  const supabase = await createSupabasePublicServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const studentId = new URL(request.url).searchParams.get("student");
  let query = supabase.from("showcase_projects").select("id,student_id,title,description,deadline,created_at").order("created_at", { ascending: false }).limit(100);
  if (studentId) query = query.eq("student_id", studentId);
  const { data, error } = await query;
  if (error) return showcaseReadError(error);
  return NextResponse.json({ projects: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createSupabasePublicServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const parsedBody = await readLimitedJson(request);
  if (!parsedBody.ok) return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  const body = parsedBody.value;
  const parsed = createShowcaseProjectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Showcase project details are invalid." }, { status: 400 });
  const { data, error } = await supabase.rpc("create_showcase_project", {
    p_submission_key: parsed.data.submissionKey, p_student_id: parsed.data.studentId,
    p_title: parsed.data.title, p_description: parsed.data.description, p_deadline: parsed.data.deadline,
  });
  if (error) return writeError(error.code ?? "");
  const project = Array.isArray(data) ? data[0] : data;
  if (!project) return NextResponse.json({ error: "Supabase did not return the saved showcase project." }, { status: 503 });
  return NextResponse.json({ project }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

function writeError(code: string) {
  if (code === "P0001") return NextResponse.json({ error: "The public showcase has reached its submission limit. Try again later." }, { status: 429 });
  if (code === "42501") return NextResponse.json({ error: "The selected showcase profile is unavailable." }, { status: 403 });
  if (["22023", "23503", "23514"].includes(code)) return NextResponse.json({ error: "The showcase project details are invalid." }, { status: 400 });
  return NextResponse.json({ error: "Supabase could not save the showcase project. Confirm the showcase migration is applied." }, { status: 503 });
}
