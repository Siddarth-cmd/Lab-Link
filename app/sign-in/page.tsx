import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authVerificationErrorResponse, databaseReadError } from "@/lib/supabase/api";
import { canVisitPortalPath, defaultPortalPath, sanitizePortalNext, type PortalRole } from "@/lib/auth/portal-routing";

export const instant = false;

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string | string[]; error?: string | string[] }> }) {
  await connection();
  const params = await searchParams;
  const requested = Array.isArray(params.next) ? params.next[0] : params.next;
  const callbackError = (Array.isArray(params.error) ? params.error[0] : params.error) === "auth_callback"
    ? "The link could not be verified or has expired. Request a fresh link for your pre-provisioned account."
    : "";
  const next = sanitizePortalNext(requested) ?? "/student";
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase.auth.getUser();
    if (error && authVerificationErrorResponse(error).status !== 401) {
      return <Shell><main id="main-content" className="page-content"><PageHeader eyebrow="SECURE ACCESS" title="Session service unavailable" description="LabLink could not verify this session. Try again when the authentication service is reachable."/><Link href="/" className="inline-flex min-h-10 items-center rounded-lg border px-4 py-2 text-sm font-bold">Back to portals</Link></main></Shell>;
    }
    if (!error && data.user) {
      const { data: memberships, error: membershipError } = await supabase.from("department_memberships")
        .select("role").eq("user_id", data.user.id);
      if (membershipError) {
        const response = databaseReadError(membershipError);
        const body = await response.json() as { error?: string };
        return <Shell><main id="main-content" className="page-content"><PageHeader eyebrow="SECURE ACCESS" title="Department role could not be checked" description={body.error ?? "LabLink could not verify department access."}/><Link href="/" className="inline-flex min-h-10 items-center rounded-lg border px-4 py-2 text-sm font-bold">Back to portals</Link></main></Shell>;
      }
      const roles = (memberships ?? []).map((row) => row.role as PortalRole);
      const target = canVisitPortalPath(next, roles) ? next : defaultPortalPath(roles);
      if (target) redirect(target);
      return <Shell><main id="main-content" className="page-content"><PageHeader eyebrow="ACCOUNT ACCESS" title="Account access is not provisioned" description="This verified account has no active LabLink department role. A trusted administrator must assign its membership."/><Link href="/" className="inline-flex min-h-10 items-center rounded-lg border px-4 py-2 text-sm font-bold">Back to portals</Link></main></Shell>;
    }
  }

  return <Shell><main id="main-content" className="page-content"><PageHeader eyebrow="SECURE ACCESS" title="Continue to your workspace" description="Use the institutional email for an account already provisioned by a LabLink administrator."/><SignInForm next={next} initialError={callbackError}/></main></Shell>;
}
