"use client";

import { useState, type FormEvent } from "react";
import { ArrowUp, CalendarDays, Clock3, Lightbulb, Sparkles, UserRound } from "lucide-react";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";

const prompts = [
  "Find a confocal microscope slot this week",
  "I need SEM access for a 2-hour project",
  "Resolve a scheduling conflict fairly",
];

export default function Assistant() {
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) setSent(true);
  }

  return <Shell><main id="main-content" className="page-content">
    <PageHeader eyebrow="SMART RESOURCE PLANNING" title="AI scheduling assistant" description="Plan around availability, project needs and fair access."/>
    <div role="status" className="mb-5 rounded-xl border border-[#dce5df] bg-white px-4 py-3 text-sm leading-6 text-[#52665c]">Preview only: Gemini and FairShare scheduling are not connected yet. Messages and suggestions on this page are examples.</div>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
      <section className="card flex min-h-[420px] min-w-0 flex-col overflow-hidden lg:min-h-[520px]" aria-labelledby="assistant-heading">
        <div className="flex items-center gap-3 border-b border-[#e5ece7] p-4 sm:p-5"><div aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f4ed] text-[#28553e]"><Sparkles size={19}/></div><div className="min-w-0"><h2 id="assistant-heading" className="text-base font-extrabold">LabLink assistant</h2><p className="mt-0.5 text-sm text-[#52665c]">Scheduling preview · Gemini integration pending</p></div><span aria-label="Preview mode" className="ml-auto h-3 w-3 shrink-0 rounded-full bg-[#a56a12] ring-4 ring-[#fff3df]"/></div>
        <div className="flex-1 space-y-4 p-4 sm:p-6" aria-live="polite">
          <div className="flex items-start gap-3"><div aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8f3ec] text-[#28553e]"><Sparkles size={16}/></div><div className="max-w-[42rem] rounded-2xl rounded-tl-sm bg-[#f1f7f3] p-4 text-sm leading-6 text-[#344e40]"><p>Describe your research, equipment needs, and preferred dates to explore how schedule planning will work.</p><p className="mt-3 text-xs font-semibold text-[#52665c]">Example message · not a live assistant response</p></div></div>
          {sent && <><div className="flex items-start justify-end gap-3"><div className="max-w-[80%] break-words rounded-2xl rounded-tr-sm bg-[#176b50] p-4 text-sm leading-6 text-white">{query}</div><div aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e3ede6] text-[#28553e]"><UserRound size={17}/></div></div><div className="rounded-xl border border-[#dce5df] bg-[#fbfcfb] p-4 text-sm leading-6 text-[#52665c]"><div className="flex items-center gap-2 font-bold text-[#344e40]"><CalendarDays size={17} aria-hidden="true"/> Example scheduling state</div><p className="mt-2">Live suggestions will use equipment availability, project context, and current requests once the scheduling service is connected.</p><p className="mt-2 text-xs font-semibold">Preview only · no booking was created.</p></div></>}
        </div>
        <form onSubmit={submit} className="border-t border-[#e5ece7] p-4">
          <label htmlFor="assistant-query" className="sr-only">Describe your experiment or scheduling need</label>
          <div className="flex items-end gap-2 rounded-xl border border-[#cddbd1] bg-white p-2 focus-within:border-[#287b5d]">
            <textarea id="assistant-query" value={query} onChange={(event) => setQuery(event.target.value)} rows={2} placeholder="Describe your experiment, equipment needs, or scheduling conflict" className="min-h-12 min-w-0 flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-[#65766d]"/>
            <button type="submit" disabled={!query.trim()} aria-label="Send preview message" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#176b50] text-white hover:bg-[#11573f] disabled:opacity-50"><ArrowUp size={18} aria-hidden="true"/></button>
          </div>
          <p className="mt-2 px-1 text-xs leading-5 text-[#52665c]">Demo interface · suggestions and booking actions are not connected.</p>
        </form>
      </section>
      <aside className="space-y-4">
        <section className="card p-4 sm:p-5" aria-labelledby="try-asking-heading"><div className="flex items-center gap-2"><Lightbulb size={18} aria-hidden="true" className="text-[#80520d]"/><h2 id="try-asking-heading" className="text-base font-extrabold">Try asking</h2></div><div className="mt-4 space-y-2">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => { setQuery(prompt); setSent(false); }} className="min-h-12 w-full rounded-lg border border-[#dce5df] px-3 py-3 text-left text-sm leading-5 text-[#344e40] hover:border-[#9dbca8] hover:bg-[#f3f8f4]">“{prompt}”</button>)}</div></section>
        <section className="card p-4 sm:p-5" aria-labelledby="fairness-heading"><h2 id="fairness-heading" className="text-base font-extrabold">Scheduling factors</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-[#52665c]">{["Project deadlines and research needs", "Recent use and equitable access", "Equipment availability and maintenance", "Training and safety prerequisites"].map((item) => <li key={item} className="flex items-start gap-3"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#287b5d]"/>{item}</li>)}</ul></section>
        <div className="flex items-start gap-3 rounded-xl border border-[#dce5df] bg-[#f0f5f1] p-4"><Clock3 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-[#28553e]"/><p className="text-sm leading-6 text-[#405c4a]">Schedule suggestions require live availability and booking history.</p></div>
      </aside>
    </div>
  </main></Shell>;
}
