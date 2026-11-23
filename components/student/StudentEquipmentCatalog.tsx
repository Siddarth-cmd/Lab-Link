"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { Equipment } from "@/lib/data";
import { DemoEquipmentCard } from "@/components/demo/DemoEquipmentCard";
import { usePollingResource } from "@/components/usePollingResource";

type EquipmentResult = { items: Equipment[]; source: string };
const EMPTY_ITEMS: Equipment[] = [];
export function StudentEquipmentCatalog() {
  const resource = usePollingResource<EquipmentResult>("/api/equipment", 30000);
  const items = resource.data?.source === "supabase" ? resource.data.items : EMPTY_ITEMS;
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("All categories");
  const categories = ["All categories", ...new Set(items.map((item) => item.category))];
  const filtered = useMemo(() => items.filter((item) => `${item.name} ${item.category} ${item.lab} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()) && (category === "All categories" || item.category === category)), [items, query, category]);
  if (resource.loading && !resource.data) return <p role="status" className="card p-5 text-sm">Loading live equipment…</p>;
  if (resource.error) return <p role="alert" className="card p-5 text-sm text-[#843f34]">{resource.error}</p>;
  if (resource.data?.source !== "supabase") return <p role="alert" className="card p-5 text-sm text-[#843f34]">Supabase is not connected. Demo equipment is hidden in the live catalog.</p>;
  return <><div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]"><label className="relative block"><span className="sr-only">Search equipment</span><Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#61736a]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search equipment, lab, or capability" className="min-h-12 w-full rounded-xl border border-[#cddbd1] bg-white pl-10 pr-3 text-sm"/></label><label className="relative block"><span className="sr-only">Filter by category</span><SlidersHorizontal size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#61736a]"/><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#cddbd1] bg-white pl-10 pr-3 text-sm">{categories.map((value) => <option key={value}>{value}</option>)}</select></label></div>{filtered.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <DemoEquipmentCard key={item.dbId} item={item} basePath="/student/equipment"/>)}</div> : <div role="status" className="card px-5 py-12 text-center"><h2 className="text-lg font-extrabold">{items.length ? "No equipment matches" : "No active equipment"}</h2><p className="mt-2 text-sm text-[#52665c]">{items.length ? "Try another search or reset the category filter." : "The equipment catalog is empty."}</p>{items.length ? <button type="button" onClick={() => { setQuery(""); setCategory("All categories"); }} className="mt-4 min-h-10 rounded-lg border border-[#176b50] px-4 py-2 text-sm font-bold text-[#145a42]">Clear filters</button> : <Link href="/student/bookings" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-[#176b50] px-4 py-2 text-sm font-bold text-[#145a42]">My bookings</Link>}</div>}</>;
}
