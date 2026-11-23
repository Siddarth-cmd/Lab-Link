"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePollingResource } from "@/components/usePollingResource";
import { useShowcaseStudent } from "@/components/showcase/ShowcaseStudentProvider";
import type { Equipment } from "@/lib/data";

type EquipmentResult = { items: Equipment[]; source: string };
type ProjectResult = { projects: { id: string; student_id: string; title: string; deadline: string }[] };
const TOKEN_KEY = "lablink.showcase-cancel-tokens.v1";
function rememberCancelToken(id: string, token: string) {
  try { const tokens = JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? "{}") as Record<string,string>; tokens[id] = token; sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens)); } catch { /* session-only cancellation convenience */ }
}

export function NewBookingForm({ initialEquipmentId }: { initialEquipmentId?: string }) {
  const router = useRouter();
  const { studentId, profile } = useShowcaseStudent();
  const equipmentResult = usePollingResource<EquipmentResult>("/api/equipment", 30000);
  const projectUrl = studentId ? `/api/showcase-projects?student=${encodeURIComponent(studentId)}` : "/api/showcase-projects";
  const projectResult = usePollingResource<ProjectResult>(projectUrl, 15000);
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const submission = useRef({ key: "", cancelToken: "" });
  const items = equipmentResult.data?.source === "supabase" ? equipmentResult.data.items : [];
  const projects = projectResult.data?.projects.filter((project) => project.student_id === studentId) ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitting.current || !studentId) return;
    submitting.current = true;
    submission.current.key ||= crypto.randomUUID();
    submission.current.cancelToken ||= crypto.randomUUID();
    setSaving(true); setError("");
    const element = event.currentTarget; const form = new FormData(element);
    const start = new Date(`${String(form.get("date"))}T${String(form.get("start"))}`);
    const end = new Date(`${String(form.get("date"))}T${String(form.get("end"))}`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start <= new Date() || end <= start || end.getTime() - start.getTime() > 8 * 60 * 60 * 1000) {
      setError("Choose a future date and a valid time range of up to 8 hours."); submitting.current = false; setSaving(false); return;
    }
    try {
      const response = await fetch("/api/showcase-bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        submissionKey: submission.current.key, cancelToken: submission.current.cancelToken, studentId,
        projectId: form.get("projectId"), equipmentId: form.get("equipmentId"), startsAt: start.toISOString(), endsAt: end.toISOString(), purpose: form.get("purpose"),
      }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Showcase booking could not be saved.");
      rememberCancelToken(body.booking.id, submission.current.cancelToken);
      submission.current = { key: "", cancelToken: "" };
      router.push("/student/bookings"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reach Supabase. The request was not confirmed."); }
    finally { submitting.current = false; setSaving(false); }
  }
  const loadError = equipmentResult.error || projectResult.error;
  const loading = equipmentResult.loading || projectResult.loading;
  if (loading && !equipmentResult.data) return <p role="status" className="card p-6 text-sm">Loading live equipment and showcase projects…</p>;
  if (loadError) return <p role="alert" className="card p-6 text-sm text-[#843f34]">{loadError}</p>;
  if (equipmentResult.data?.source !== "supabase") return <p role="alert" className="card p-6 text-sm text-[#843f34]">Live equipment is unavailable. Local fixtures cannot be booked.</p>;
  if (!items.length) return <p role="status" className="card p-6 text-sm">No active equipment is available.</p>;
  if (!studentId) return <p role="status" className="card p-6 text-sm">Choose one of the fictional showcase students before submitting a request.</p>;
  if (!projects.length) return <div className="card p-6 text-sm"><p>No showcase projects are available for {profile?.name ?? "this profile"}.</p><p className="mt-2 text-[#52665c]">Create a showcase project first. Project and booking records are separate from production accounts.</p></div>;
  return <form onSubmit={submit} onChange={() => { /* key stays stable across retries; changing the request after a conflict should be an intentional new submission */ }} className="card space-y-4 p-5 sm:p-7">
    {error && <p role="alert" className="rounded-lg bg-[#fff4f1] px-3 py-2 text-sm text-[#843f34]">{error}</p>}
    <p className="rounded-lg bg-[#f1f7f3] px-3 py-2 text-sm text-[#28553e]">Showcase request for {profile?.name}; saved only in the public showcase tables.</p>
    <label className="block text-sm font-semibold">Equipment<select name="equipmentId" required defaultValue={items.find((item) => item.dbId === initialEquipmentId || item.slug === initialEquipmentId)?.dbId ?? ""} className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] bg-white px-3 text-sm"><option value="" disabled>Select active equipment</option>{items.map((item) => <option key={item.dbId} value={item.dbId}>{item.name} · {item.lab}</option>)}</select></label>
    <label className="block text-sm font-semibold">Showcase project<select name="projectId" required defaultValue="" className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] bg-white px-3 text-sm"><option value="" disabled>Select your project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title} · due {project.deadline}</option>)}</select></label>
    <label className="block text-sm font-semibold">Requested date<input name="date" type="date" required className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] px-3 text-sm"/></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Start time<input name="start" type="time" required className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] px-3 text-sm"/></label><label className="block text-sm font-semibold">End time<input name="end" type="time" required className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] px-3 text-sm"/></label></div>
    <label className="block text-sm font-semibold">Research justification<textarea name="purpose" required minLength={20} maxLength={500} rows={4} className="mt-1.5 w-full rounded-lg border border-[#cddbd1] px-3 py-2 text-sm" placeholder="Explain how this equipment supports the project."/></label>
    <button disabled={saving} className="min-h-11 w-full rounded-lg bg-[#176b50] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#11573f] disabled:opacity-60">{saving ? "Submitting…" : "Submit showcase request"}</button>
    <p className="text-xs text-[#61736a]">Pending requests are proposals, not equipment reservations. Conflicting pending requests remain available for review; the database blocks overlapping approvals.</p>
  </form>;
}
