"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";

export function ApprovalActions({ requestId, onReviewed }: { requestId: string; onReviewed?: () => void }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function review(decision: "approved" | "rejected" | "changes_requested") {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/approvals/${requestId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, note }) });
      const body = await response.json();
      if (!response.ok) { setError(response.status === 401 ? "Read-only showcase: no review was saved because this session is not authorized." : response.status === 403 ? "This session is not authorized to review the request." : body.error ?? "Review could not be saved."); return; }
      onReviewed?.();
      router.refresh();
    } catch { setError("Could not reach LabLink. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <div className="lg:w-64 space-y-2">
    <label className="block text-[9px] font-bold text-[#52665c]">OPTIONAL NOTE<textarea maxLength={1000} rows={2} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-lg border border-[#e5e9e6] p-2 text-[11px] outline-none" placeholder="Add context for the requester"/></label>
    <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => review("approved")} className="rounded-lg bg-[#176b50] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-60">{busy ? <LoaderCircle size={13} className="animate-spin"/> : <Check size={13} className="inline mr-1"/>}Approve</button><button disabled={busy} onClick={() => review("changes_requested")} className="rounded-lg border border-[#e5e9e6] px-3 py-2 text-[11px] font-bold text-[#52665c] disabled:opacity-60">Request changes</button><button disabled={busy} onClick={() => review("rejected")} className="rounded-lg border border-[#ecd7d4] px-3 py-2 text-[11px] font-bold text-[#843f34] disabled:opacity-60"><X size={13} className="inline mr-1"/>Reject</button></div>
    {error && <p role="alert" className="text-[10px] text-[#843f34]">{error}</p>}
  </div>;
}
