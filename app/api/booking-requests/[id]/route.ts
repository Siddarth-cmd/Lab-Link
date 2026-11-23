import { NextResponse } from "next/server";
import { databaseWriteError, requireAuthenticatedSupabaseUser } from "@/lib/supabase/api";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthenticatedSupabaseUser();
  if (auth.response || !auth.supabase || !auth.user) return auth.response;
  const { id } = await context.params;
  const { error } = await auth.supabase.rpc("cancel_booking_request", { p_booking_request_id: id });
  if (error) return databaseWriteError(error);
  return NextResponse.json({ cancelled: true }, { headers: { "Cache-Control": "no-store" } });
}
