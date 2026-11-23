"use client";

import { FormEvent, useRef, useState } from "react";

type Department = { id: string; name: string; code: string };
export function EquipmentSubmissionForm({ departments, onAdded }: { departments: Department[]; onAdded: () => void }) {
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const guard = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (guard.current) return;
    guard.current = true; setBusy(true); setError(""); setMessage(""); const formElement = event.currentTarget; const form = new FormData(formElement);
    const specifications: Record<string, string> = {};
    for (const line of String(form.get("specifications") ?? "").split("\n")) { const index = line.indexOf(":"); if (index > 0) specifications[line.slice(0, index).trim()] = line.slice(index + 1).trim(); }
    try {
      const response = await fetch("/api/equipment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ departmentId: form.get("departmentId"), name: form.get("name"), category: form.get("category"), labName: form.get("labName"), building: form.get("building"), floor: form.get("floor"), description: form.get("description"), specifications }) });
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "Read-only showcase: no equipment was added because this session is not authorized." : response.status === 403 ? "Only verified faculty assigned to this department can add equipment." : body.error ?? "Equipment could not be added.");
      formElement.reset(); setMessage(`${body.equipment.name} was added to the shared equipment catalog.`); onAdded();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reach LabLink."); }
    finally { guard.current = false; setBusy(false); }
  }
  const input = "mt-1.5 min-h-10 w-full rounded-lg border border-[#cddbd1] px-3 text-sm";
  return <form onSubmit={submit} className="card space-y-3 p-5"><h3 className="text-lg font-extrabold">Add equipment</h3><p className="text-sm leading-6 text-[#52665c]">Available only to verified faculty in an assigned department. New records enter the shared active catalog.</p>{message && <p role="status" className="rounded-lg bg-[#eaf4ee] px-3 py-2 text-sm text-[#28553e]">{message}</p>}{error && <p role="alert" className="rounded-lg bg-[#fff4f1] px-3 py-2 text-sm text-[#843f34]">{error}</p>}<label className="block text-sm font-semibold">Department<select name="departmentId" required className={input}>{departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Equipment name<input name="name" required minLength={2} maxLength={160} className={input}/></label><label className="block text-sm font-semibold">Category<input name="category" required minLength={2} maxLength={80} className={input}/></label><label className="block text-sm font-semibold">Lab name<input name="labName" required minLength={2} maxLength={160} className={input}/></label><label className="block text-sm font-semibold">Building<input name="building" required minLength={2} maxLength={120} className={input}/></label><label className="block text-sm font-semibold">Floor<input name="floor" required maxLength={80} className={input}/></label></div><label className="block text-sm font-semibold">Description<textarea name="description" maxLength={4000} rows={2} className="mt-1.5 w-full rounded-lg border border-[#cddbd1] p-3 text-sm"/></label><label className="block text-sm font-semibold">Specifications <span className="font-normal text-[#61736a]">(one Label: Value per line)</span><textarea name="specifications" maxLength={2000} rows={3} className="mt-1.5 w-full rounded-lg border border-[#cddbd1] p-3 text-sm" placeholder="Resolution: 1.2 nm\nCapacity: 4 samples"/></label><button disabled={busy} className="min-h-10 rounded-lg bg-[#176b50] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Add to equipment catalog"}</button></form>;
}
