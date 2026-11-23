import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { canVisitPortalPath, defaultPortalPath, sanitizePortalNext } from "../lib/auth/portal-routing";

function source(path: string) { return readFileSync(join(process.cwd(), path), "utf8"); }

test("magic links do not auto-provision users and retain the server callback session exchange", () => {
  const form = source("components/auth/SignInForm.tsx");
  const callback = source("app/auth/callback/route.ts");
  assert.match(form, /shouldCreateUser:\s*false/);
  assert.match(form, /signInWithOtp/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /sanitizePortalNext/);
});

test("an already verified account skips the sign-in form and routes by server-verified department role", () => {
  const page = source("app/sign-in/page.tsx");
  assert.match(page, /auth\.getUser\(\)/);
  assert.match(page, /department_memberships/);
  assert.match(page, /redirect\(target\)/);
  assert.match(page, /defaultPortalPath/);
});

test("magic-link destinations are same-origin allowlisted and role constrained", () => {
  assert.equal(sanitizePortalNext("/faculty"), "/faculty");
  assert.equal(sanitizePortalNext("//attacker.example"), null);
  assert.equal(sanitizePortalNext("https://attacker.example"), null);
  assert.equal(sanitizePortalNext("/student/../faculty"), null);
  assert.equal(canVisitPortalPath("/faculty", ["faculty"]), true);
  assert.equal(canVisitPortalPath("/faculty", ["student"]), false);
  assert.equal(defaultPortalPath(["department_admin"]), "/faculty");
});
