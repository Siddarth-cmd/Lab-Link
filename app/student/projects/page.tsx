"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { CalendarDays, FolderKanban, Plus } from "lucide-react";
import { DemoShell } from "@/components/demo/DemoShell";
import { PageHeader } from "@/components/PageHeader";
import { ShowcaseStudentPicker } from "@/components/showcase/ShowcaseStudentPicker";
import { useShowcaseStudent } from "@/components/showcase/ShowcaseStudentProvider";
import { usePollingResource } from "@/components/usePollingResource";

type Project = { id: string; student_id: string; title: string; description: string; deadline: string; created_at: string };
type ProjectData = { projects: Project[] };

export default function StudentProjectsPage() {
  const { studentId, profile } = useShowcaseStudent();
  const url = studentId ? `/api/showcase-projects?student=${encodeURIComponent(studentId)}` : "/api/showcase-projects";
  const { data, loading, error, refresh } = usePollingResource<ProjectData>(url, 10000);
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const submissionKey = useRef("");

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !studentId) return;
    submitting.current = true;
    submissionKey.current ||= crypto.randomUUID();
    setSaving(true); setFormError(""); setCreated("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/showcase-projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        submissionKey: submissionKey.current, studentId, title: form.get("title"), description: form.get("description"), deadline: form.get("deadline"),
      }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Showcase project could not be saved.");
      submissionKey.current = "";
      setCreated("Showcase project saved to Supabase.");
      formElement.reset();
      await refresh();
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : "Could not reach Supabase."); }
    finally { submitting.current = false; setSaving(false); }
  }

  return <DemoShell role="student"><main id="main-content" className="page-content">
    <PageHeader eyebrow="STUDENT PORTAL · PUBLIC SHOWCASE" title="My projects" description="Create a clearly labeled showcase project. It is stored separately from institutional student records." action={<Link href="/student/bookings/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#176b50] px-4 py-2.5 text-sm font-bold text-white">New equipment booking</Link>}/>
    <ShowcaseStudentPicker/>
    {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff4f1] px-4 py-3 text-sm text-[#843f34]">{error}</p>}
    {created && <p role="status" className="mb-4 rounded-lg bg-[#eaf4ee] px-4 py-3 text-sm text-[#28553e]">{created}</p>}
    {formError && <p role="alert" className="mb-4 rounded-lg bg-[#fff4f1] px-4 py-3 text-sm text-[#843f34]">{formError}</p>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.8fr)]">
      <section className="space-y-3" aria-label="Selected showcase student's projects">
        {loading && !data ? <p role="status" className="card p-5 text-sm">Loading showcase projects…</p> : !studentId ? <p role="status" className="card p-7 text-center text-sm text-[#52665c]">Choose a fictional student profile to view its projects.</p> : data?.projects.length ? data.projects.filter((project) => project.student_id === studentId).map((project) => <article key={project.id} className="card p-5"><div className="flex items-start gap-3"><FolderKanban size={18} aria-hidden="true" className="mt-1 shrink-0 text-[#28553e]"/><div className="min-w-0"><h2 className="break-words text-base font-extrabold">{project.title}</h2><p className="mt-2 text-sm leading-6 text-[#52665c]">{project.description}</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5ece7] pt-3"><span className="flex items-center gap-2 text-sm font-semibold text-[#52665c]"><CalendarDays size={16} aria-hidden="true"/> Deadline {new Date(`${project.deadline}T12:00:00`).toLocaleDateString()}</span><span className="text-xs font-bold uppercase tracking-wide text-[#28553e]">Showcase project</span></div></article>) : <p role="status" className="card p-8 text-center text-sm text-[#52665c]">No showcase projects yet. Add one to request equipment.</p>}
      </section>
      <form onSubmit={createProject} className="card space-y-3 p-5" aria-labelledby="new-project-heading">
        <h2 id="new-project-heading" className="flex items-center gap-2 text-lg font-extrabold"><Plus size={18} aria-hidden="true" className="text-[#28553e]"/> Create a project</h2>
        <p className="text-sm leading-6 text-[#52665c]">{profile ? `Project owner: ${profile.name} (${profile.department}).` : "Choose a student profile above first."} Writes go only to the isolated showcase project table.</p>
        <label className="block text-sm font-semibold">Project title<input name="title" required minLength={3} maxLength={120} className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] px-3 text-sm" placeholder="e.g. Smart greenhouse monitor"/></label>
        <label className="block text-sm font-semibold">Description<textarea name="description" required minLength={10} maxLength={1000} rows={3} className="mt-1.5 w-full rounded-lg border border-[#cddbd1] px-3 py-2 text-sm" placeholder="Describe the research goal."/></label>
        <label className="block text-sm font-semibold">Project deadline<input name="deadline" type="date" required className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] px-3 text-sm"/></label>
        <button disabled={saving || !studentId} className="min-h-11 w-full rounded-lg bg-[#176b50] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#11573f] disabled:opacity-60">{saving ? "Saving…" : "Save showcase project"}</button>
      </form>
    </div>
  </main></DemoShell>;
}
