import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type SupabaseServerClientFactory = () => Promise<SupabaseServerClient | null>;

type ErrorMetadata = { name?: string; status?: number; code?: string; cause?: unknown };

function errorMetadata(error: unknown): ErrorMetadata {
  if (!error || typeof error !== "object") return {};
  const candidate = error as ErrorMetadata;
  return {
    name: typeof candidate.name === "string" ? candidate.name : undefined,
    status: typeof candidate.status === "number" ? candidate.status : undefined,
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    cause: candidate.cause,
  };
}

const unauthenticatedCodes = new Set([
  "bad_jwt",
  "invalid_jwt",
  "session_expired",
  "session_not_found",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "user_not_found",
  "invalid_credentials",
]);

const connectivityCodes = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "PGRST000",
  "PGRST001",
  "PGRST002",
  "PGRST003",
]);

function isUnauthenticatedSessionError(error: unknown) {
  const metadata = errorMetadata(error);
  return metadata.name === "AuthSessionMissingError"
    || metadata.name === "AuthInvalidJwtError"
    || metadata.status === 401
    || Boolean(metadata.code && unauthenticatedCodes.has(metadata.code));
}

function isServiceConnectivityError(error: unknown, depth = 0): boolean {
  if (error instanceof TypeError && /fetch failed|failed to fetch|network/i.test(error.message)) return true;
  if (depth > 3) return false;

  const metadata = errorMetadata(error);
  if (metadata.name === "AuthRetryableFetchError" || (metadata.status !== undefined && metadata.status >= 500)) return true;
  if (metadata.code && connectivityCodes.has(metadata.code)) return true;
  return metadata.cause !== undefined && isServiceConnectivityError(metadata.cause, depth + 1);
}

export function authVerificationErrorResponse(error: unknown) {
  if (isUnauthenticatedSessionError(error)) {
    return NextResponse.json({ error: "Sign in is required to continue. Your session may have expired." }, { status: 401 });
  }

  if (isServiceConnectivityError(error)) {
    const metadata = errorMetadata(error);
    console.error("Supabase session check failed", { code: metadata.code ?? "NETWORK", name: metadata.name });
    return NextResponse.json({ error: "Supabase could not verify your session. Check the connection and try again." }, { status: 503 });
  }

  const metadata = errorMetadata(error);
  console.error("Supabase session check returned an unexpected error", { code: metadata.code, name: metadata.name, status: metadata.status });
  // Preserve provider throttling responses; other unexpected upstream auth failures are gateway errors,
  // not missing sessions or service-unavailable responses.
  const status = metadata.status === 429 ? 429 : 502;
  return NextResponse.json({ error: "Supabase returned an unexpected response while verifying your session." }, { status });
}

export async function requireAuthenticatedSupabaseUser(clientFactory: SupabaseServerClientFactory = createSupabaseServerClient) {
  try {
    const supabase = await clientFactory();
    if (!supabase) {
      return { response: NextResponse.json({ error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local." }, { status: 503 }), supabase: null, user: null };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) return { response: authVerificationErrorResponse(error), supabase: null, user: null };
    if (!data.user) {
      return { response: NextResponse.json({ error: "Sign in is required to continue. Your session may have expired." }, { status: 401 }), supabase: null, user: null };
    }
    return { response: null, supabase, user: data.user };
  } catch (error) {
    return { response: authVerificationErrorResponse(error), supabase: null, user: null };
  }
}

export function facultyForbiddenResponse(message = "Faculty approval access is required for this equipment department.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function hasFacultyApprovalPermission(membership: { role?: string } | null, error: unknown) {
  return !error && (membership?.role === "faculty" || membership?.role === "department_admin");
}

export function databaseReadError(error: unknown) {
  const metadata = errorMetadata(error);
  if (metadata.code === "42501" || metadata.status === 403) return facultyForbiddenResponse("Your account is not authorized for this department.");
  if (metadata.status === 401 || metadata.code === "PGRST301" || metadata.code === "bad_jwt") {
    return NextResponse.json({ error: "Sign in is required to continue. Your session may have expired." }, { status: 401 });
  }
  if (isServiceConnectivityError(error)) {
    console.error("Supabase read failed", { code: metadata.code ?? "NETWORK", name: metadata.name });
    return NextResponse.json({ error: "Supabase could not load this information. Check the connection and try again." }, { status: 503 });
  }
  console.error("Supabase read failed", { code: metadata.code, name: metadata.name, status: metadata.status });
  return NextResponse.json({ error: "Supabase could not load this information. Please try again." }, { status: 500 });
}

export function databaseWriteError(error: unknown) {
  const metadata = errorMetadata(error);
  if (metadata.code === "23P01") return NextResponse.json({ error: "This equipment has already been approved for an overlapping time. Choose a different slot." }, { status: 409 });
  if (metadata.code === "42501" || metadata.status === 403) return facultyForbiddenResponse("Your account is not authorized for this action or department.");
  if (metadata.status === 401 || metadata.code === "PGRST301" || metadata.code === "bad_jwt") return NextResponse.json({ error: "Sign in is required to continue. Your session may have expired." }, { status: 401 });
  if (metadata.code === "23514" || metadata.code === "22023") return NextResponse.json({ error: "The request does not meet the database validation rules." }, { status: 400 });
  if (metadata.code === "23503") return NextResponse.json({ error: "The selected project, department, or equipment is no longer available." }, { status: 400 });
  if (isServiceConnectivityError(error)) {
    console.error("Supabase write failed", { code: metadata.code ?? "NETWORK", name: metadata.name });
    return NextResponse.json({ error: "Supabase could not save this request. Check the connection and try again." }, { status: 503 });
  }
  console.error("Supabase write failed", { code: metadata.code, name: metadata.name, status: metadata.status });
  return NextResponse.json({ error: "The request could not be saved. Check the Supabase migration and try again." }, { status: 500 });
}
