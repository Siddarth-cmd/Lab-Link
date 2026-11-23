import { NextResponse } from "next/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import { readLimitedJson } from "@/lib/showcase/limited-json";
import { reviewShowcaseBookingSchema } from "@/lib/validation/requests";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabasePublicServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const parsedBody = await readLimitedJson(request);
  if (!parsedBody.ok) return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  const parsed = reviewShowcaseBookingSchema.safeParse(parsedBody.value);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Showcase decision is invalid." }, { status: 400 });
  const { id } = await context.params;
  const { error } = await supabase.rpc("review_public_showcase_booking", {
    p_booking_id: id,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note || null,
  });
  if (error) {
    if (["PGRST202", "PGRST205", "42883"].includes(error.code ?? "")) return NextResponse.json({ error: "Apply migration 202611230006_public_showcase_decisions.sql to enable showcase decisions." }, { status: 503 });
    if (error.code === "23P01") return NextResponse.json({ error: "Another showcase request already has this equipment at that time. This request remains pending." }, { status: 409 });
    if (error.code === "P0001") return NextResponse.json({ error: "The public showcase review limit has been reached." }, { status: 429 });
    if (error.code === "55000") return NextResponse.json({ error: "The showcase coordinator seed is missing. Recheck migrations 005 and 006." }, { status: 503 });
    if (error.code === "23514") return NextResponse.json({ error: "This showcase request has already been reviewed." }, { status: 409 });
    if (["22023", "P0002"].includes(error.code ?? "")) return NextResponse.json({ error: "This showcase request is unavailable or the decision is invalid." }, { status: 400 });
    return NextResponse.json({ error: "Supabase could not save the showcase decision." }, { status: 503 });
  }
  return NextResponse.json({ reviewed: true, visibility: "public-showcase" }, { headers: { "Cache-Control": "no-store" } });
}
