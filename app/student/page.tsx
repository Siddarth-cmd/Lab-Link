"use client";

import Link from "next/link";
import { ArrowRight, Clock3, FolderKanban, Microscope, Plus, Sparkles } from "lucide-react";
import { DemoShell } from "@/components/demo/DemoShell";
import { DemoEquipmentCard } from "@/components/demo/DemoEquipmentCard";
import { ShowcaseStudentPicker } from "@/components/showcase/ShowcaseStudentPicker";
import { useShowcaseStudent } from "@/components/showcase/ShowcaseStudentProvider";
import { usePollingResource } from "@/components/usePollingResource";
import type { Equipment } from "@/lib/data";

type Booking = { id: string; student_id: string; starts_at: string; status: string; equipment?: { name: string } | { name: string }[] | null };
type BookingResult = { bookings: Booking[] };
type ProjectResult = { projects: { student_id: string }[] };
type EquipmentResult = { items: Equipment[]; source: string };
function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="stat-card"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold tracking-wide text-[#52665c]">{label}</span><span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-[#eaf4ee] text-[#28553e]">{icon}</span></div><div className="mt-2 text-3xl font-extrabold">{value}</div><p className="mt-1 text-xs text-[#52665c]">Supabase showcase data</p></div>; }

export default function StudentDashboard() {
  const { studentId, profile } = useShowcaseStudent();
  const bookings = usePollingResource<BookingResult>("/api/showcase-bookings");
  const projects = usePollingResource<ProjectResult>("/api/showcase-projects", 15000);
  const inventory = usePollingResource<EquipmentResult>("/api/equipment", 30000);
  const mine = bookings.data?.bookings.filter((booking) => booking.student_id === studentId) ?? [];
  const myProjects = projects.data?.projects.filter((project) => project.student_id === studentId) ?? [];
  const recent = mine.slice(0, 3);
  const liveEquipment = inventory.data?.source === "supabase" ? inventory.data.items : [];
  const errors = [bookings.error, projects.error, inventory.error].filter(Boolean);
  return <DemoShell role="student"><main id="main-content" className="page-content">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-[#426b56]">STUDENT PORTAL · PUBLIC SHOWCASE</p><h1 className="text-3xl font-extrabold sm:text-4xl">Your research, connected.</h1><p className="mt-2 text-sm leading-6 text-[#52665c]">Browse the live catalog and create clearly labeled showcase projects and requests.</p></div><Link href="/student/bookings/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#176b50] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#11573f]"><Plus size={17} aria-hidden="true"/> New booking</Link></div>
    <ShowcaseStudentPicker/>
    {errors.length > 0 && <p role="alert" className="mb-5 rounded-xl bg-[#fff4f1] px-4 py-3 text-sm text-[#843f34]">{errors.join(" ")}</p>}
    <section aria-label="Student summary" className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3"><Stat label="ACTIVE EQUIPMENT" value={inventory.loading && !inventory.data ? "…" : String(liveEquipment.length)} icon={<Microscope size={18}/>}/><Stat label="MY SHOWCASE PROJECTS" value={!studentId ? "—" : projects.loading && !projects.data ? "…" : String(myProjects.length)} icon={<FolderKanban size={18}/>}/><Stat label="PENDING SHOWCASE REQUESTS" value={!studentId ? "—" : bookings.loading && !bookings.data ? "…" : String(mine.filter((booking) => booking.status === "pending").length)} icon={<Clock3 size={18}/>}/></section>
    <div className="mb-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]"><section className="card min-w-0 p-4 sm:p-6" aria-labelledby="student-bookings-heading"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 id="student-bookings-heading" className="text-lg font-extrabold">My showcase bookings</h2><p className="mt-1 text-sm text-[#52665c]">Public demonstration records sync from Supabase across devices.</p></div><Link href="/student/bookings" className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm font-bold text-[#145a42] hover:bg-[#edf6f0]">All bookings <ArrowRight size={15}/></Link></div>
      {!studentId ? <p role="status" className="py-5 text-sm text-[#52665c]">Choose one of the fictional profiles above to view its showcase records.</p> : bookings.loading && !bookings.data ? <p role="status" className="py-5 text-sm">Loading showcase bookings…</p> : recent.length ? <div className="divide-y divide-[#e5ece7]">{recent.map((booking) => { const item = Array.isArray(booking.equipment) ? booking.equipment[0] : booking.equipment; return <div key={booking.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item?.name ?? "Equipment"}</p><p className="mt-1 text-xs text-[#52665c]">{new Date(booking.starts_at).toLocaleString()} · {booking.id.slice(0, 12)}</p></div><span className="w-fit rounded-full bg-[#fff3df] px-3 py-1 text-xs font-bold capitalize text-[#80520d]">{booking.status}</span></div>; })}</div> : <div className="rounded-xl border border-dashed border-[#cddbd1] bg-[#f8faf8] px-5 py-8 text-center"><p className="font-semibold text-[#344e40]">No showcase bookings yet{profile ? ` for ${profile.name}` : ""}</p><p className="mt-1 text-sm leading-6 text-[#52665c]">Create a project, then request an equipment time.</p></div>}
    </section><section className="relative overflow-hidden rounded-2xl bg-[#163d32] p-5 text-white sm:p-6" aria-labelledby="student-assistant-heading"><div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-[#d6f3df]"><Sparkles size={19} aria-hidden="true"/></div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#d0efdb]">ASSISTANT PREVIEW</p><h2 id="student-assistant-heading" className="mt-2 text-xl font-extrabold leading-7 text-white">Plan your next lab session.</h2><p className="mt-2 text-sm leading-6 text-[#e4efe9]">Gemini and FairShare are not connected in this stage. Showcase requests are pending proposals, not reservations.</p><Link href="/student/assistant" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[#173e32]">Open AI Assistant <ArrowRight size={15}/></Link></section></div>
    <section aria-labelledby="student-discover-heading"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="student-discover-heading" className="text-xl font-extrabold">Live equipment catalog</h2><p className="mt-1 text-sm text-[#52665c]">Active resources from Supabase.</p></div><Link href="/student/catalog" className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm font-bold text-[#145a42] hover:bg-[#edf6f0]">Full catalog <ArrowRight size={16}/></Link></div>{inventory.loading && !inventory.data ? <p role="status" className="card p-5 text-sm">Loading active equipment…</p> : liveEquipment.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{liveEquipment.slice(0, 3).map((item) => <DemoEquipmentCard key={item.dbId} item={item}/>)}</div> : <p role="status" className="card p-5 text-sm">{inventory.data?.source === "demo" ? "Supabase is not configured. Demo inventory is hidden." : "No active equipment is currently available."}</p>}</section>
  </main></DemoShell>;
}
