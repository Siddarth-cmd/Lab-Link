"use client";

import { useMemo, useState } from "react";
import { EquipmentCard } from "@/components/EquipmentCard";
import type { Equipment } from "@/lib/data";
import { Search, SlidersHorizontal, X } from "lucide-react";

type CatalogProps = { items: Equipment[]; source: "supabase" | "demo" | "error"; message?: string };

export function Catalog({ items, source, message }: CatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All equipment");
  const [availability, setAvailability] = useState(false);
  const categories = ["All equipment", ...Array.from(new Set(items.map((item) => item.category)))];
  const filtered = useMemo(() => items.filter((item) =>
    (category === "All equipment" || item.category === category)
    && (!availability || item.status === "Available")
    && `${item.name} ${item.category} ${item.lab} ${item.building}`.toLowerCase().includes(query.toLowerCase())
  ), [items, query, category, availability]);

  return <>
    {message && <div role={source === "error" ? "alert" : "status"} className={`mb-4 rounded-xl border px-4 py-3 text-sm leading-6 ${source === "error" ? "border-[#efd4ce] bg-[#fff4f1] text-[#843f34]" : "border-[#dce5df] bg-white text-[#52665c]"}`}>
      {message}{source === "error" && <span className="mt-1 block text-xs">Check the Supabase connection and confirm the equipment table and read policy are available.</span>}
    </div>}
    <div className="card mb-5 flex flex-col gap-3 p-3 sm:p-4 md:flex-row md:items-center">
      <label className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#cddbd1] bg-white px-3 focus-within:border-[#287b5d]">
        <Search size={18} aria-hidden="true" className="shrink-0 text-[#52665c]"/>
        <span className="sr-only">Search equipment</span>
        <input aria-label="Search equipment" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search equipment, labs, or capabilities" className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#65766d]"/>
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#52665c] hover:bg-[#f2f6f3]"><X size={16} aria-hidden="true"/></button>}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="equipment-category">Filter by category</label>
        <select id="equipment-category" value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 min-w-0 rounded-lg border border-[#cddbd1] bg-white px-3 text-sm font-semibold text-[#344e40] sm:min-w-44">
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button type="button" aria-pressed={availability} onClick={() => setAvailability(!availability)} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${availability ? "border-[#176b50] bg-[#e8f4ee] text-[#145a42]" : "border-[#cddbd1] bg-white text-[#344e40] hover:bg-[#f3f7f4]"}`}>
          <SlidersHorizontal size={16} aria-hidden="true"/> Available now
        </button>
      </div>
    </div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-[#52665c]">Showing <strong className="text-[#172c27]">{filtered.length}</strong> {filtered.length === 1 ? "resource" : "resources"}<span className="ml-2 text-xs font-semibold uppercase tracking-wide text-[#52665c]">· {source === "supabase" ? "Supabase catalog" : source === "demo" ? "Demo seed data" : "Unavailable"}</span></p>
      <p className="text-xs text-[#52665c]">Sorted by name</p>
    </div>
    {filtered.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <EquipmentCard key={item.dbId ?? item.id} item={item}/>)}</div>
      : <div className="card p-8 text-center sm:p-12" role="status">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf4ef] text-[#28553e]"><Search size={20} aria-hidden="true"/></div>
        <h2 className="mt-4 text-lg font-bold">{source === "error" ? "Equipment is temporarily unavailable" : query || availability || category !== "All equipment" ? "No equipment matches these filters" : "No equipment has been added yet"}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#52665c]">{source === "error" ? message : source === "supabase" && !items.length ? "The catalog is connected to Supabase. An administrator can add active equipment to make it available here." : "Try a different search or clear your filters."}</p>
        {(query || availability || category !== "All equipment") && <button type="button" onClick={() => { setQuery(""); setCategory("All equipment"); setAvailability(false); }} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#176b50] px-4 py-2 text-sm font-bold text-[#145a42] hover:bg-[#edf6f0]">Clear filters</button>}
      </div>}
  </>;
}
