"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { CalendarDays, LoaderCircle } from "lucide-react";

type ProjectOption = { id: string; title: string };
type BookingRequestFormProps = { equipmentId?: string; projects: ProjectOption[]; signedIn: boolean; status: "Available" | "In use" | "Maintenance" };

function localDateTime(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function BookingRequestForm({ equipmentId, projects, signedIn, status }: BookingRequestFormProps) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [minStart, setMinStart] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const datesInitialized = useRef(false);
  function initializeDates() {
    if (datesInitialized.current) return;
    datesInitialized.current = true;
    const startDefault = new Date(Date.now() + 60 * 60 * 1000);
    startDefault.setMinutes(Math.ceil(startDefault.getMinutes() / 30) * 30, 0, 0);
    setMinStart(localDateTime(new Date()));
    setStartsAt(localDateTime(startDefault));
    setEndsAt(localDateTime(new Date(startDefault.getTime() + 60 * 60 * 1000)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setLoading(true);
    try {
      const response = await fetch("/api/booking-requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, equipmentId, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), purpose }),
      });
      const body = await response.json();
      if (!response.ok) { setMessage(body.error ?? "The booking request could not be saved."); return; }
      setSaved(true); setMessage("Booking request submitted. It will appear as pending until reviewed."); router.refresh();
    } catch { setMessage("Could not reach LabLink. Check your connection and try again."); }
    finally { setLoading(false); }
  }

  if (status === "Maintenance") return <div role="status" className="mt-5 rounded-lg bg-[#f2f4f2] p-3 text-sm leading-6 text-[#52665c]">This equipment is under maintenance and cannot accept requests.</div>;
  if (!equipmentId) return <div role="status" className="mt-5 rounded-lg border border-[#dce5df] p-3 text-sm leading-6 text-[#52665c]">Connect Supabase to submit a persistent booking request. Demo equipment is read-only.</div>;
  if (!signedIn) return <div className="mt-5"><Link href="/sign-in" className="block min-h-11 w-full rounded-lg bg-[#176b50] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#11573f]">Sign in to request a booking</Link><p className="mt-2 text-center text-xs leading-5 text-[#52665c]">Requests require an active project and department membership.</p></div>;
  if (!projects.length) return <div className="mt-5 rounded-lg bg-[#f4f7f5] p-4 text-sm leading-6 text-[#52665c]">Create a project before requesting equipment.<Link href="/requests" className="mt-2 block min-h-10 font-bold text-[#145a42] underline underline-offset-2">Open Project Requests →</Link></div>;

  return <form onSubmit={submit} className="mt-5 border-t border-[#edf0ed] pt-4 space-y-3">
    <h3 className="font-extrabold text-sm flex gap-2 items-center"><CalendarDays size={15} className="text-[#28553e]"/>Request a booking</h3>
    <label className="block text-xs font-bold text-[#344e40]">Project<select required value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] bg-white px-3 py-2.5 text-sm">{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-[#344e40]">Start<input type="datetime-local" required onFocus={initializeDates} min={minStart} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1.5 min-h-11 w-full min-w-0 rounded-lg border border-[#cddbd1] bg-white px-2 py-2 text-sm"/></label><label className="text-xs font-bold text-[#344e40]">End<input type="datetime-local" required onFocus={initializeDates} min={startsAt} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1.5 min-h-11 w-full min-w-0 rounded-lg border border-[#cddbd1] bg-white px-2 py-2 text-sm"/></label></div>
    <label className="block text-xs font-bold text-[#344e40]">Research purpose<textarea required minLength={20} maxLength={2000} rows={4} value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Explain what the project needs to accomplish with this equipment." className="mt-1.5 w-full resize-y rounded-lg border border-[#cddbd1] bg-white px-3 py-2 text-sm leading-6"/></label>
    <button disabled={loading || saved || !startsAt || !endsAt} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#176b50] px-4 py-3 text-sm font-bold text-white hover:bg-[#11573f] disabled:opacity-60">{loading && <LoaderCircle size={16} aria-hidden="true" className="animate-spin"/>}{saved ? "Request submitted" : "Submit booking request"}</button>
    {message && <p role={saved ? "status" : "alert"} className={`text-sm leading-6 ${saved ? "text-[#28553e]" : "text-[#843f34]"}`}>{message}</p>}
  </form>;
}
