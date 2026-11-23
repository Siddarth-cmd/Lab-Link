import { NextResponse } from "next/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import { showcaseReadError } from "@/lib/showcase/data-errors";

export async function GET() {
  const supabase = await createSupabasePublicServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data, error } = await supabase.from("showcase_students")
    .select("id,display_name,department,project_focus").eq("is_active", true).order("display_name");
  if (error) return showcaseReadError(error);
  return NextResponse.json({ students: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
