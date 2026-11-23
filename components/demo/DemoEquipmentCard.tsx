import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Equipment } from "@/lib/data";
import { EquipmentArtwork } from "@/components/EquipmentArtwork";

export function DemoEquipmentCard({ item, basePath = "/student/equipment" }: { item: Equipment; basePath?: string }) {
  const equipmentId = item.slug ?? item.id;
  return <article className="card min-w-0 overflow-hidden transition-shadow hover:shadow-[0_12px_32px_rgba(31,54,44,.1)]">
    <Link href={`${basePath}/${equipmentId}`} className="group block rounded-2xl focus-visible:outline-offset-[-3px]"><EquipmentArtwork item={item} className="rounded-none" showBadges/><div className="p-4 sm:p-5"><div className="flex min-w-0 items-start justify-between gap-3"><h2 className="min-w-0 break-words text-base font-bold leading-6 text-[#172c27] group-hover:text-[#145a42]">{item.name}</h2><ArrowUpRight size={18} aria-hidden="true" className="mt-1 shrink-0 text-[#52665c]"/></div><div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-[#52665c]"><MapPin size={15} aria-hidden="true" className="shrink-0"/><span className="truncate">{item.lab}</span></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e5ece7] pt-3"><span className="text-xs font-semibold uppercase tracking-wide text-[#52665c]">Next available</span><span className="text-sm font-bold text-[#28553e]">{item.nextAvailable}</span></div></div></Link>
    <div className="px-4 pb-4 sm:px-5 sm:pb-5"><Link href={`/student/bookings/new?equipment=${encodeURIComponent(equipmentId)}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#176b50] px-3 py-2 text-sm font-bold text-[#145a42] hover:bg-[#edf6f0]">Book equipment</Link></div>
  </article>;
}
