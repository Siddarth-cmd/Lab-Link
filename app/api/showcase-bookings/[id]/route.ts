import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import { cancelShowcaseBookingSchema } from "@/lib/validation/requests";
import { readLimitedJson } from "@/lib/showcase/limited-json";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabasePublicServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const parsedBody = await readLimitedJson(request);
  if (!parsedBody.ok) return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  const body = parsedBody.value;
  const parsed = cancelShowcaseBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "The cancellation token is invalid." }, { status: 400 });
  const { id } = await context.params;
  const hash = `\\x${createHash("sha256").update(parsed.data.cancelToken).digest("hex")}`;
  const { error } = await supabase.rpc("cancel_showcase_booking", { p_booking_id: id, p_cancel_token_hash: hash });
  if (error) {
    if (error.code === "42501") return NextResponse.json({ error: "This request cannot be cancelled with that token." }, { status: 403 });
    if (error.code === "23514") return NextResponse.json({ error: "Only pending showcase requests can be cancelled." }, { status: 409 });
    if (["PGRST202", "PGRST205"].includes(error.code ?? "")) return NextResponse.json({ error: "Apply the showcase migration before cancelling requests." }, { status: 503 });
    return NextResponse.json({ error: "Supabase could not cancel the showcase request." }, { status: 503 });
  }
  return NextResponse.json({ cancelled: true }, { headers: { "Cache-Control": "no-store" } });
}
