"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FileText, Plus } from "lucide-react";
import type { requests as demoRequests } from "@/lib/data";

type Department = { id: string; name: string };
type Project = { id: string; title: string; description: string; status: string; created_at: string; department: string };
type Booking = { id: string; purpose: string; status: string; starts_at: string; ends_at: string; equipment: string; project: string };
type WorkspaceProps = { configured: boolean; signedIn: boolean; departments: Department[]; projects: Project[]; bookings: Booking[]; requestsError?: string; demoRequests: typeof demoRequests };

export function RequestWorkspace({ configured, signedIn, departments, projects, bookings, requestsError, demoRequests: samples }: WorkspaceProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ departmentId, title, description }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Project could not be saved."); return; }
      setFormOpen(false); setTitle(""); setDescription(""); router.refresh();
    } catch { setError("Could not reach LabLink. Check your connection and try again."); }
    finally { setLoading(false); }
  }

  return <>
    {!configured && <div className="mb-5 rounded-xl border border-[#e5d6b6] bg-[#fff9ed] p-4 text-sm leading-6 text-[#735b34]" role="status">Demo requests are placeholders. Add Supabase configuration and apply migrations to enable persistent projects and bookings.</div>}
    {requestsError && <div className="mb-5 rounded-xl border border-[#efd4ce] bg-[#fff4f1] p-4 text-sm leading-6 text-[#843f34]" role="alert">{requestsError}</div>}
    {configured && !signedIn && <div className="mb-5 rounded-xl border border-[#dcebe1] bg-[#f2f8f3] p-4 text-sm leading-6 text-[#405c4a]">Sign in with your institutional email to create projects and submit equipment requests. <Link href="/sign-in" className="ml-1 font-bold text-[#145a42] underline underline-offset-2">Sign in →</Link></div>}
    {configured && signedIn && <div className="mb-4 flex justify-stretch sm:justify-end"><button type="button" onClick={() => setFormOpen(!formOpen)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#176b50] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#11573f] sm:w-auto"><Plus size={17} aria-hidden="true"/>{formOpen ? "Close form" : "New project"}</button></div>}
    {formOpen && <form onSubmit={createProject} className="card p-5 mb-5 grid md:grid-cols-2 gap-3">
      <label className="text-xs font-bold text-[#344e40]">Department<select required value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] bg-white px-3 py-2.5 text-sm"><option value="">Choose a department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
      <label className="text-xs font-bold text-[#344e40]">Project title<input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] bg-white px-3 py-2.5 text-sm"/></label>
      <label className="text-xs font-bold text-[#344e40] md:col-span-2">Research summary<textarea required minLength={10} maxLength={4000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#cddbd1] bg-white px-3 py-2.5 text-sm leading-6"/></label>
      {error && <p role="alert" className="md:col-span-2 text-xs text-[#843f34]">{error}</p>}
      <button disabled={loading || !departments.length} className="md:col-span-2 min-h-11 rounded-lg bg-[#176b50] px-4 py-3 text-sm font-bold text-white hover:bg-[#11573f] disabled:opacity-60">{loading ? "Saving…" : "Create project"}</button>
      {!departments.length && <p className="md:col-span-2 text-sm text-[#843f34]">No active department is available. Ask an administrator to assign your department membership.</p>}
    </form>}

    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">{[["PROJECTS", configured ? signedIn ? String(projects.length) : "—" : "—"],["BOOKING REQUESTS", configured ? signedIn ? String(bookings.length) : "—" : String(samples.length)],["PENDING REVIEW", configured ? signedIn ? String(bookings.filter((booking) => booking.status === "pending").length) : "—" : "1"]].map(([label, value]) => <div className="stat-card" key={label}><div className="text-xs font-bold tracking-wide text-[#52665c]">{label}</div><div className="mt-2 text-2xl font-extrabold">{value}</div></div>)}</div>
    <div className="card overflow-hidden"><div className="flex items-center gap-3 border-b border-[#e5ece7] p-4 sm:p-5"><FileText size={19} aria-hidden="true" className="text-[#28553e]"/><h2 className="text-lg font-extrabold">{configured ? "Your projects" : "Project request samples"}</h2><span className="text-xs font-semibold uppercase tracking-wide text-[#52665c]">· {configured ? "Supabase" : "Demo seed data"}</span></div>
      {configured ? projects.length ? projects.map((project) => <div key={project.id} className="border-b border-[#e5ece7] p-4 last:border-0 sm:p-5"><div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center"><div aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eff5f0] text-[#28553e]"><FileText size={18}/></div><div className="min-w-0 flex-1"><div className="break-words text-sm font-bold">{project.title}</div><div className="mt-1 text-sm text-[#52665c]">{project.department} · {project.status}</div><p className="mt-2 break-words text-sm leading-6 text-[#52665c]">{project.description}</p></div><span className="text-xs text-[#52665c]">Created {new Date(project.created_at).toLocaleDateString()}</span></div></div>) : <div className="px-5 py-10 text-center"><p className="text-base font-bold text-[#344e40]">{signedIn ? "No projects yet" : "Sign in to view your projects"}</p><p className="mt-2 text-sm leading-6 text-[#52665c]">{signedIn ? "Create a project to request equipment access." : "Projects and requests are only shown to their signed-in owners."}</p>{!signedIn && <Link href="/sign-in" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#176b50] px-4 py-2 text-sm font-bold text-white">Sign in</Link>}</div> : samples.map((sample) => <div key={sample.name} className="flex flex-col gap-3 border-b border-[#e5ece7] p-4 last:border-0 md:flex-row md:items-center sm:p-5"><div aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eff5f0] text-[#28553e]"><FileText size={18}/></div><div className="flex-1"><div className="text-sm font-bold">{sample.name}</div><div className="mt-1 text-sm text-[#52665c]">{sample.target} · {sample.kind}</div></div><div className="text-sm text-[#52665c] md:w-32">Submitted<br/><b className="mt-1 inline-block text-[#344e40]">{sample.submitted}</b></div><span className="w-fit rounded-full bg-[#eaf1f7] px-3 py-1 text-xs font-bold text-[#315875]">{sample.status}</span></div>)}
    </div>
    {configured && <div className="card overflow-hidden mt-5"><div className="p-5 border-b border-[#edf0ed]"><h2 className="font-extrabold">Equipment booking requests</h2><p className="text-[10px] text-[#52665c] mt-1">Requests are persistent and reviewed by the equipment department.</p></div>{bookings.length ? bookings.map((booking) => <div key={booking.id} className="p-5 flex flex-col md:flex-row md:items-center gap-3 border-b last:border-0 border-[#edf0ed]"><div className="flex-1"><div className="font-bold text-sm">{booking.equipment}</div><div className="text-xs text-[#52665c] mt-1">{booking.project} · {new Date(booking.starts_at).toLocaleString()}</div><div className="text-xs text-[#52665c] mt-2">{booking.purpose}</div></div><span className="w-fit px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fff3df] text-[#735b34]">{booking.status.replaceAll("_", " ")}</span></div>) : <div className="p-8 text-center text-xs text-[#52665c]">No equipment requests yet. Find a resource in the <Link href="/catalog" className="text-[#176b50] font-bold">catalog</Link>.</div>}</div>}
  </>;
}
