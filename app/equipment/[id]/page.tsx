import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MapPin, ShieldCheck, Star } from "lucide-react";
import { BookingRequestForm } from "@/components/booking/BookingRequestForm";
import { EquipmentArtwork } from "@/components/EquipmentArtwork";
import { Shell } from "@/components/Shell";
import { equipment as demoEquipment } from "@/lib/data";
import { getEquipmentBySlug } from "@/lib/equipment-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const instant = false;

export function generateStaticParams() { return demoEquipment.map((item) => ({ id: item.id })); }

export default async function EquipmentDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const { item, error } = await getEquipmentBySlug(id);
  if (!item && !error) notFound();
  if (!item) return <Shell><main className="page-content"><Link href="/catalog" className="inline-flex items-center gap-2 text-xs font-semibold text-[#52665c] mb-5"><ArrowLeft size={14}/> Back to catalog</Link><div role="alert" className="rounded-xl border border-[#efd4ce] bg-[#fff4f1] p-4 text-sm text-[#843f34]">{error}</div></main></Shell>;

  const supabase = item.dbId ? await createSupabaseServerClient() : null;
  let signedIn = false;
  let projects: { id: string; title: string }[] = [];
  if (supabase && item.dbId) {
    const { data: authData } = await supabase.auth.getUser();
    signedIn = Boolean(authData.user);
    if (authData.user) {
      const { data } = await supabase.from("projects").select("id, title").eq("owner_id", authData.user.id).eq("status", "active").order("created_at", { ascending: false });
      projects = data ?? [];
    }
  }

  return <Shell><main id="main-content" className="page-content"><Link href="/catalog" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#52665c] hover:text-[#145a42]"><ArrowLeft size={16} aria-hidden="true"/> Back to catalog</Link><div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)]"><div className="min-w-0"><EquipmentArtwork item={item} className="min-h-[230px] sm:min-h-[320px]"/><div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#edf5ef] px-3 py-1 text-xs font-bold text-[#28553e]">{item.category}</span>{item.isDemo && <span className="rounded-full bg-[#f2f3f2] px-3 py-1 text-xs font-bold text-[#52665c]">Demo data</span>}<span className="flex items-center gap-1 text-sm text-[#52665c]"><Star size={14} fill="#dda74c" stroke="#dda74c" aria-hidden="true"/> {item.rating} user rating</span></div><h1 className="mt-3 break-words text-3xl font-extrabold sm:text-4xl">{item.name}</h1><p className="mt-3 text-base leading-7 text-[#52665c]">{item.description}</p><h2 className="mb-3 mt-8 text-xl font-extrabold">Technical specifications</h2><div className="grid gap-3 sm:grid-cols-2">{item.specs.map((spec) => <div key={spec.label} className="card px-4 py-3"><div className="text-xs font-bold tracking-wide text-[#52665c]">{spec.label}</div><div className="mt-1 text-sm font-semibold">{spec.value}</div></div>)}</div></div><div className="space-y-4"><section className="card p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-extrabold">Availability</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "Available" ? "bg-[#e3f4e9] text-[#24613b]" : item.status === "In use" ? "bg-[#fff2d9] text-[#80520d]" : "bg-[#f1f2f1] text-[#4f5e56]"}`}>{item.status}</span></div><div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f3f7f4] p-3"><div className="text-[#28553e]"><Star size={18} aria-hidden="true"/></div><div><div className="text-xs font-bold text-[#52665c]">NEXT AVAILABLE SLOT</div><div className="mt-0.5 text-sm font-bold">{item.nextAvailable}</div></div></div><div className="mt-4 flex items-center justify-between gap-3 text-sm"><span className="text-[#52665c]">Utilization this month</span><b>{item.utilization}%</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5ece7]" role="progressbar" aria-label="Monthly equipment utilization" aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.utilization}><div className="h-full rounded-full bg-[#287b5d]" style={{ width: `${item.utilization}%` }}/></div><BookingRequestForm equipmentId={item.dbId} projects={projects} signedIn={signedIn} status={item.status}/></section><section className="card p-4 sm:p-5"><h2 className="text-base font-extrabold">Location & access</h2><div className="mt-4 flex items-start gap-3"><MapPin size={17} aria-hidden="true" className="mt-0.5 text-[#28553e]"/><div><div className="text-sm font-bold">{item.lab}</div><div className="mt-1 text-sm text-[#52665c]">{item.building} · {item.floor}</div></div></div><div className="mt-4 flex items-start gap-3 text-sm text-[#52665c]"><ShieldCheck size={17} aria-hidden="true" className="text-[#28553e]"/><span>Training certification may be required before access.</span></div></section><section className="rounded-xl border border-[#dcebe1] bg-[#f2f8f3] p-4"><div className="flex gap-2"><Check size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-[#28553e]"/><p className="text-sm leading-6 text-[#405c4a]">Scheduling enforces availability, training, and department review rules.</p></div></section></div></div></main></Shell>;
}
