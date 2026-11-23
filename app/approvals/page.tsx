import { connection } from "next/server";
import Link from "next/link";
import { Clock3, FileText, ShieldAlert } from "lucide-react";
import { ApprovalActions } from "@/components/approvals/ApprovalActions";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";
import { approvals as demoApprovals } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const instant = false;

type ReviewRow = { id: string; name: string; student: string; project: string; purpose: string; date: string; priority: string };
export default async function ApprovalsPage() {
  await connection();
  const configured = isSupabaseConfigured();
  let signedIn = false; let faculty = false; let rows: ReviewRow[] = []; let error: string | undefined;
  if (configured) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: auth } = await supabase.auth.getUser();
      signedIn = Boolean(auth.user);
      if (auth.user) {
        const { data: memberships, error: memberError } = await supabase.from("department_memberships").select("department_id,role").eq("user_id", auth.user.id).in("role", ["faculty", "department_admin"]);
        faculty = Boolean(memberships?.length);
        if (memberError) error = "Faculty membership could not be verified. Check department membership policies.";
        if (faculty && !memberError) {
          const { data, error: queryError } = await supabase.from("booking_requests").select("id,requested_by,purpose,starts_at,equipment:equipment!inner(name,department_id),project:projects(title)").eq("status", "pending").order("created_at", { ascending: true });
          if (queryError) error = "Approval requests could not be loaded. Check migrations and faculty department policies.";
          else rows = (data ?? []).map((row) => {
            const project = Array.isArray(row.project) ? row.project[0] : row.project;
            return { id: row.id, name: project?.title ?? "Equipment access request", student: `Requester ${row.requested_by.slice(0, 8)}`, project: project?.title ?? "Project", purpose: row.purpose, date: new Date(row.starts_at).toLocaleString(), priority: "Standard" };
          });
        }
      }
    }
  }
  const isDemo = !configured;
  const demoRows: ReviewRow[] = demoApprovals.map((item, index) => ({ id: `demo-${index}`, name: item.name, student: item.student, project: item.name, purpose: "Demo faculty approval request", date: item.date, priority: item.priority }));
  return <Shell><main id="main-content" className="page-content"><PageHeader eyebrow="FACULTY WORKSPACE" title="Faculty approvals" description="Review equipment access requests for your department."/>
    {isDemo && <div className="rounded-xl border border-[#efdfbf] bg-[#fff9ed] p-4 mb-5 flex gap-3"><ShieldAlert size={17} className="text-[#b17b2d] shrink-0 mt-0.5"/><p className="text-xs text-[#735b34] leading-5"><b>Demo records.</b> Approval actions remain disabled until Supabase is configured and faculty department memberships are assigned.</p></div>}
    {configured && !signedIn && <div className="rounded-xl border border-[#dcebe1] bg-[#f2f8f3] p-4 mb-5 text-xs text-[#405c4a]">Sign in with your institutional account to check your faculty role. <Link href="/sign-in" className="text-[#176b50] font-bold">Sign in →</Link></div>}
    {configured && signedIn && !faculty && <div className="rounded-xl border border-[#efdfbf] bg-[#fff9ed] p-4 mb-5 text-xs text-[#735b34]">This account has no faculty approval role. Faculty roles must be provisioned by a LabLink administrator.</div>}
    {error && <div role="alert" className="rounded-xl border border-[#efd4ce] bg-[#fff4f1] p-4 mb-5 text-xs text-[#843f34]">{error}</div>}
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="stat-card"><div className="text-xs font-bold tracking-wide text-[#52665c]">AWAITING REVIEW</div><div className="mt-2 text-2xl font-extrabold">{configured ? signedIn && faculty ? rows.length : "—" : demoRows.length}</div></div><div className="stat-card"><div className="text-xs font-bold tracking-wide text-[#52665c]">ACCESS CONTROL</div><div className="mt-2 text-base font-extrabold">Server + RLS</div></div></div>
    {configured && !signedIn && !error && <div role="status" className="card px-5 py-8 text-center"><p className="text-base font-bold text-[#344e40]">Sign in to check for faculty requests.</p><p className="mt-2 text-sm leading-6 text-[#52665c]">Request details are only available to authorized faculty for their department.</p><Link href="/sign-in" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#176b50] px-4 py-2 text-sm font-bold text-white">Sign in</Link></div>}
    {configured && signedIn && !faculty && !error && <div role="status" className="card px-5 py-8 text-center"><p className="text-base font-bold text-[#344e40]">No faculty review requests are available.</p><p className="mt-2 text-sm leading-6 text-[#52665c]">This account has no faculty approval role. A LabLink administrator can provision department access.</p></div>}
    <div className="space-y-3">{(isDemo ? demoRows : faculty ? rows : []).map((item) => <section className="card min-w-0 p-4 sm:p-5" key={item.id}><div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start"><div aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f1edf7] text-[#614879]"><FileText size={19}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-base font-extrabold">{item.name}</h2>{item.priority === "High" && <span className="rounded-full bg-[#fff1da] px-2.5 py-1 text-xs font-bold text-[#735b34]">HIGH PRIORITY</span>}</div><div className="mt-2 break-words text-sm text-[#52665c]">{item.student}</div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><div><div className="text-xs font-bold text-[#52665c]">PROJECT</div><div className="mt-1 break-words text-sm font-semibold">{item.project}</div></div><div><div className="text-xs font-bold text-[#52665c]">REQUESTED SLOT</div><div className="mt-1 break-words text-sm font-semibold">{item.date}</div></div><div><div className="text-xs font-bold text-[#52665c]">PURPOSE</div><div className="mt-1 break-words text-sm font-semibold">{item.purpose}</div></div></div></div>{isDemo ? <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#52665c]"><Clock3 size={16} aria-hidden="true"/> Demo record · actions disabled</div> : <ApprovalActions requestId={item.id}/>}</div></section>)}{configured && signedIn && faculty && !rows.length && !error && <div role="status" className="card px-5 py-10 text-center"><p className="text-base font-bold text-[#344e40]">No requests are waiting for your department.</p><p className="mt-2 text-sm leading-6 text-[#52665c]">New booking requests will appear here when submitted.</p></div>}</div>
  </main></Shell>;
}
