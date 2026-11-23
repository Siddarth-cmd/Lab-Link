import { NextResponse } from "next/server";

const migrationMissingCodes = new Set(["PGRST202", "PGRST205", "PGRST200", "42P01", "42883"]);
const connectivityCodes = new Set(["PGRST000", "PGRST001", "PGRST002", "PGRST003", "ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "ETIMEDOUT"]);

export function showcaseReadError(error: { code?: string; message?: string }) {
  console.error("Showcase read failed", { code: error.code });
  if (error.code && migrationMissingCodes.has(error.code)) return NextResponse.json({ error: "The showcase database is not installed yet. Apply migration 202611230005_public_showcase_requests.sql in Supabase." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (error.code && connectivityCodes.has(error.code)) return NextResponse.json({ error: "Supabase could not load showcase data. Check the service connection and try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ error: "Supabase could not load showcase data. Please try again." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
