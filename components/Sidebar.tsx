"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, CalendarDays, CheckCheck, FlaskConical, LayoutDashboard, MessagesSquare, Microscope } from "lucide-react";

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Equipment catalog", href: "/catalog", icon: Microscope },
  { label: "My bookings", href: "/bookings", icon: CalendarDays },
  { label: "Project requests", href: "/requests", icon: MessagesSquare },
  { label: "Faculty approvals", href: "/approvals", icon: CheckCheck },
];

export function Sidebar() {
  const path = usePathname();

  return <aside className="sidebar" aria-label="LabLink workspace">
    <Link href="/" className="brand-row mb-8 flex items-center gap-3 px-2" aria-label="LabLink home">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#176b50] text-white"><FlaskConical size={20} aria-hidden="true"/></span>
      <span><span className="block text-lg font-extrabold tracking-tight">lab<span className="text-[#176b50]">link</span></span><span className="block text-[11px] font-semibold tracking-wide text-[#61736a]">RESEARCH, CONNECTED</span></span>
    </Link>
    <p className="nav-section-label mb-2 px-3 text-[11px] font-bold tracking-[.12em] text-[#61736a]">WORKSPACE</p>
    <nav className="nav-scroll" aria-label="Primary navigation">
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "active" : ""}`}>
          <Icon size={18} strokeWidth={1.9} aria-hidden="true"/><span>{label}</span>
        </Link>;
      })}
    </nav>
    <div className="sidebar-bottom mt-auto pt-6">
      <div className="rounded-2xl border border-[#dce8df] bg-[#f1f7f3] p-4">
        <p className="text-sm font-bold text-[#234c39]">Find a shared resource</p>
        <p className="mt-1 text-xs leading-5 text-[#52665c]">Explore equipment and request time for your research.</p>
        <Link href="/catalog" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#176b50] px-3 py-2 text-xs font-bold text-white hover:bg-[#11573f]">Open catalog <ArrowRight size={14} aria-hidden="true"/></Link>
      </div>
    </div>
  </aside>;
}
