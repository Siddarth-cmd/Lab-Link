import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authVerificationErrorResponse,
  databaseReadError,
  databaseWriteError,
  facultyForbiddenResponse,
  hasFacultyApprovalPermission,
  requireAuthenticatedSupabaseUser,
} from "../lib/supabase/api";
import type { createSupabaseServerClient } from "../lib/supabase/server";

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

function clientReturning(error: unknown, user: unknown = null) {
  const client = {
    auth: {
      getUser: async () => ({ data: { user }, error }),
    },
  } as unknown as ServerClient;
  return async () => client;
}

test("missing Supabase session returns 401", async () => {
  const auth = await requireAuthenticatedSupabaseUser(clientReturning({ name: "AuthSessionMissingError" }));
  assert.equal(auth.response?.status, 401);
  assert.equal(auth.supabase, null);
  assert.equal(auth.user, null);
});

test("expired or invalid Supabase session returns 401", async () => {
  const expired = await requireAuthenticatedSupabaseUser(clientReturning({ name: "AuthApiError", status: 400, code: "session_expired" }));
  const invalid = await requireAuthenticatedSupabaseUser(clientReturning({ name: "AuthInvalidJwtError", status: 400, code: "bad_jwt" }));
  assert.equal(expired.response?.status, 401);
  assert.equal(invalid.response?.status, 401);
});

test("authenticated user without faculty permissions returns 403", () => {
  assert.equal(hasFacultyApprovalPermission(null, null), false);
  assert.equal(hasFacultyApprovalPermission({ role: "student" }, null), false);
  assert.equal(hasFacultyApprovalPermission({ role: "faculty" }, null), true);
  assert.equal(hasFacultyApprovalPermission({ role: "department_admin" }, null), true);
  assert.equal(hasFacultyApprovalPermission({ role: "faculty" }, new Error("membership query failed")), false);
  assert.equal(facultyForbiddenResponse().status, 403);
  assert.equal(databaseWriteError({ code: "42501" }).status, 403);
  assert.equal(databaseReadError({ code: "42501" }).status, 403);
});

test("Supabase auth connectivity and upstream service failures return 503", async () => {
  const retryable = await requireAuthenticatedSupabaseUser(clientReturning({ name: "AuthRetryableFetchError" }));
  const network = await requireAuthenticatedSupabaseUser(async () => { throw new TypeError("fetch failed"); });
  const upstream = authVerificationErrorResponse({ name: "AuthApiError", status: 503 });
  const readFailure = databaseReadError({ code: "PGRST000" });
  const writeFailure = databaseWriteError({ code: "ECONNRESET" });
  assert.equal(retryable.response?.status, 503);
  assert.equal(network.response?.status, 503);
  assert.equal(upstream.status, 503);
  assert.equal(readFailure.status, 503);
  assert.equal(writeFailure.status, 503);
});

test("equipment approval conflicts return a clear 409 response", async () => {
  const response = databaseWriteError({ code: "23P01", message: "conflicting key value violates exclusion constraint" });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, "This equipment has already been approved for an overlapping time. Choose a different slot.");
});

test("unexpected auth errors are not mislabeled as service unavailable", () => {
  const response = authVerificationErrorResponse({ name: "AuthApiError", status: 400, code: "validation_failed" });
  assert.equal(response.status, 502);
});
