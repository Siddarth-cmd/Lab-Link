"use client";

import Image from "next/image";
import { useState } from "react";
import { Activity, Microscope, Printer, ScanSearch } from "lucide-react";
import type { Equipment } from "@/lib/data";

function CategoryIcon({ category }: { category: string }) {
  const normalized = category.toLowerCase();
  if (normalized.includes("fabrication") || normalized.includes("printer")) return <Printer size={38} strokeWidth={1.5}/>;
  if (normalized.includes("imaging")) return <ScanSearch size={38} strokeWidth={1.5}/>;
  if (normalized.includes("molecular")) return <Activity size={38} strokeWidth={1.5}/>;
  return <Microscope size={38} strokeWidth={1.5}/>;
}

export function EquipmentArtwork({ item, className = "", showBadges = false }: { item: Equipment; className?: string; showBadges?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <div className={`equipment-art ${className}`} style={{ backgroundColor: item.color }}>
    <div className="equipment-art__fallback" aria-hidden="true">
      <div className="equipment-art__fallback-mark"><CategoryIcon category={item.category}/></div>
      <span className="absolute bottom-3 left-3 z-[1] text-xs font-semibold text-[#284638]">Shared lab equipment</span>
    </div>
    {item.image && !imageFailed && <Image src={item.image} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw" className="equipment-art__photo" onError={() => setImageFailed(true)}/>}
    {showBadges && <>
      <span className="absolute left-3 top-3 z-[2] max-w-[55%] truncate rounded-full bg-white px-3 py-1 text-xs font-bold text-[#344e40] shadow-sm">{item.category}{item.isDemo ? " · Demo" : ""}</span>
      <span className={`absolute right-3 top-3 z-[2] rounded-full px-3 py-1 text-xs font-bold shadow-sm ${item.status === "Available" ? "bg-[#e3f4e9] text-[#24613b]" : item.status === "In use" ? "bg-[#fff2d9] text-[#80520d]" : "bg-white text-[#4f5e56]"}`}>{item.status}</span>
      <span className="absolute bottom-3 right-3 z-[2] rounded-full bg-[#173a2e]/85 px-2.5 py-1 text-xs font-bold text-white">★ {item.rating}</span>
    </>}
  </div>;
}
