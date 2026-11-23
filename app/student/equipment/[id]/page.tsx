import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { DemoShell } from "@/components/demo/DemoShell";
import { EquipmentArtwork } from "@/components/EquipmentArtwork";
import { PageHeader } from "@/components/PageHeader";
import { getEquipmentBySlug } from "@/lib/equipment-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const instant = false;
export default async function StudentEquipmentDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getEquipmentBySlug(id);
  if (!isSupabaseConfigured()) return <DemoShell role="student"><main id="main-content" className="page-content"><PageHeader eyebrow="EQUIPMENT DETAILS" title="Live equipment unavailable" description="Connect Supabase to view current inventory."/><p role="alert" className="card p-5 text-sm text-[#843f34]">Demo fixtures are not used for student booking requests.</p></main></DemoShell>;
  if (result.error) return <DemoShell role="student"><main id="main-content" className="page-content"><PageHeader eyebrow="EQUIPMENT DETAILS" title="Could not load equipment" description={result.error}/><Link href="/student/catalog" className="inline-flex min-h-10 items-center rounded-lg border px-4 py-2 text-sm font-bold">Back to catalog</Link></main></DemoShell>;
  const item = result.item;
  if (!item || !item.dbId) notFound();
  const bookingHref = `/student/bookings/new?equipment=${encodeURIComponent(item.dbId)}`;
  return <DemoShell role="student"><main id="main-content" className="page-content"><Link href="/student/catalog" className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-[#145a42] hover:bg-[#edf6f0]"><ArrowLeft size={16} aria-hidden="true"/> Back to catalog</Link><PageHeader eyebrow="LIVE SUPABASE EQUIPMENT" title={item.name} description={item.description}/>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]"><section className="card overflow-hidden"><EquipmentArtwork item={item} className="rounded-none"/><div className="p-5 sm:p-6"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e5f3e9] px-3 py-1 text-xs font-bold text-[#28553e]">{item.status}</span><span className="rounded-full bg-[#f1f7f3] px-3 py-1 text-xs font-bold text-[#28553e]">{item.category}</span></div><p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[#52665c]"><MapPin size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-[#28553e]"/>{item.lab} · {item.building}, {item.floor}</p><Link href={bookingHref} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#176b50] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#11573f]"><CalendarDays size={16} aria-hidden="true"/> Book equipment</Link></div></section>
      <div className="space-y-5"><section className="card p-5 sm:p-6" aria-labelledby="equipment-specs"><h2 id="equipment-specs" className="text-lg font-extrabold">Specifications</h2><dl className="mt-4 divide-y divide-[#e5ece7]">{item.specs.map((spec) => <div key={spec.label} className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-4 py-3 first:pt-0"><dt className="text-sm text-[#52665c]">{spec.label}</dt><dd className="break-words text-right text-sm font-semibold">{spec.value}</dd></div>)}</dl></section><section className="rounded-xl border border-[#dce5df] bg-white p-5"><h2 className="flex items-center gap-2 text-base font-extrabold"><ShieldCheck size={18} aria-hidden="true" className="text-[#28553e]"/> Booking details</h2><p className="mt-2 text-sm leading-6 text-[#52665c]">Next availability: {item.nextAvailable}. Availability is informational; the booking is confirmed only after faculty approval.</p></section></div></div>
  </main></DemoShell>;
}
