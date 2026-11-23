"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoShell } from "@/components/demo/DemoShell";
import { PageHeader } from "@/components/PageHeader";
import { ShowcaseStudentPicker } from "@/components/showcase/ShowcaseStudentPicker";
import { useShowcaseStudent } from "@/components/showcase/ShowcaseStudentProvider";
import { usePollingResource } from "@/components/usePollingResource";

type Booking = { id: string; student_id: string; starts_at: string; ends_at: string; purpose: string; status: string; equipment: { name: string; slug: string } | { name: string; slug: string }[]; project: { title: string; deadline: string } | { title: string; deadline: string }[]; decision?: { decision: string; note: string | null; created_at: string }[] };
type Result = { bookings: Booking[] };
const TOKEN_KEY = "lablink.showcase-cancel-tokens.v1";
function related<T>(value: T | T[] | null | undefined): T | undefined { return Array.isArray(value) ? value[0] : value ?? undefined; }
function cancelTokenFor(id: string) { try { const tokens = JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? "{}") as Record<string,string>; return tokens[id] ?? null; } catch { return null; } }
function forgetCancelToken(id: string) { try { const tokens = JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? "{}") as Record<string,string>; delete tokens[id]; sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens)); } catch { /* cancellation already persisted */ } }
function Status({ value }: { value: string }) { const color = value === "approved" ? "bg-[#e5f3e9] text-[#28553e]" : value === "rejected" || value === "cancelled" ? "bg-[#fff0ed] text-[#843f34]" : "bg-[#fff3df] text-[#80520d]"; return <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${color}`}>{value.replaceAll("_", " ")}</span>; }

export default function StudentBookingsPage() {
  const { studentId, profile } = useShowcaseStudent();
  const { data, loading, error, refresh } = usePollingResource<Result>("/api/showcase-bookings", 5000);
  const [canceling, setCanceling] = useState("");
  const [actionError, setActionError] = useState("");
  const mine = data?.bookings.filter((booking) => booking.student_id === studentId) ?? [];
  async function cancel(id: string) {
    if (canceling) return;
    const cancelToken = cancelTokenFor(id);
    if (!cancelToken) { setActionError("This request can only be cancelled from the browser session that submitted it."); return; }
    setCanceling(id); setActionError("");
    try {
      const response = await fetch(`/api/showcase-bookings/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cancelToken }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Showcase cancellation failed.");
      forgetCancelToken(id); await refresh();
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "Could not reach Supabase."); }
    finally { setCanceling(""); }
  }
  return <DemoShell role="student"><main id="main-content" className="page-content">
    <PageHeader eyebrow="STUDENT PORTAL · PUBLIC SHOWCASE" title="My Bookings" description="Status is read from the shared showcase database and refreshes automatically." action={<Link href="/student/bookings/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#176b50] px-4 py-2.5 text-sm font-bold text-white">New booking</Link>}/>
    <ShowcaseStudentPicker/>
    {(error || actionError) && <p role="alert" className="mb-4 rounded-lg bg-[#fff4f1] px-4 py-3 text-sm text-[#843f34]">{error || actionError}</p>}
    {loading && !data ? <p role="status" className="card p-8 text-center text-sm">Loading showcase bookings…</p> : !studentId ? <p role="status" className="card p-8 text-center text-sm">Choose one of the fictional profiles above to view its requests.</p> : mine.length ? <div className="space-y-4">{mine.map((booking) => { const equipment = related(booking.equipment); const project = related(booking.project); const decision = booking.decision?.[0]; return <article className="card p-5" key={booking.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-extrabold">{equipment?.name ?? "Equipment"}</h2><p className="mt-1 text-sm text-[#52665c]">Project: {project?.title ?? "Project"}</p><p className="mt-1 text-xs font-semibold text-[#52665c]">{profile?.name} · {profile?.department} · Showcase request</p></div><Status value={booking.status}/></div><dl className="mt-4 grid gap-3 sm:grid-cols-2"><div><dt className="text-xs font-bold text-[#61736a]">REQUESTED TIME</dt><dd className="mt-1 text-sm">{new Date(booking.starts_at).toLocaleString()} – {new Date(booking.ends_at).toLocaleTimeString()}</dd></div><div><dt className="text-xs font-bold text-[#61736a]">PROJECT DEADLINE</dt><dd className="mt-1 text-sm">{project?.deadline ? new Date(`${project.deadline}T12:00:00`).toLocaleDateString() : "Not set"}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-bold text-[#61736a]">JUSTIFICATION</dt><dd className="mt-1 text-sm leading-6">{booking.purpose}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-bold text-[#61736a]">REQUEST ID</dt><dd className="mt-1 break-all font-mono text-xs">{booking.id}</dd></div></dl>{decision && <p className="mt-4 rounded-lg bg-[#f1f7f3] p-3 text-sm text-[#28553e]"><strong>Coordinator decision:</strong> {decision.decision}{decision.note ? ` — ${decision.note}` : ""}</p>}{booking.status === "pending" && <button type="button" disabled={Boolean(canceling)} onClick={() => void cancel(booking.id)} className="mt-4 min-h-10 rounded-lg border border-[#ecd7d4] px-3 py-2 text-sm font-bold text-[#843f34] disabled:opacity-60">{canceling === booking.id ? "Canceling…" : "Cancel request"}</button>}</article>; })}</div> : <section role="status" className="card px-5 py-12 text-center"><h2 className="text-lg font-extrabold">No showcase requests{profile ? ` for ${profile.name}` : ""}</h2><p className="mt-2 text-sm text-[#52665c]">Choose equipment and a project to request a time.</p><Link href="/student/bookings/new" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#176b50] px-4 py-2 text-sm font-bold text-white">Start a booking request</Link></section>}
  </main></DemoShell>;
}
