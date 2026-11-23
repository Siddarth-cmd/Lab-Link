"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardCheck, FlaskConical, FolderKanban, Home, Lightbulb, Microscope, PackagePlus, ShieldCheck } from "lucide-react";

type WorkspaceRole = "student" | "faculty";

const studentNavigation = [
  { label: "Overview", href: "/student", icon: Home },
  { label: "Equipment Catalog", href: "/student/catalog", icon: Microscope },
  { label: "My Projects", href: "/student/projects", icon: FolderKanban },
  { label: "New Equipment Booking", href: "/student/bookings/new", icon: PackagePlus },
  { label: "My Bookings", href: "/student/bookings", icon: CalendarDays },
];

const facultyNavigation = [
  { label: "Overview", href: "/faculty", icon: Home },
  { label: "Pending Approvals", href: "/faculty#pending-approvals", icon: ClipboardCheck },
  { label: "Booking Requests", href: "/faculty#booking-requests", icon: CalendarDays },
  { label: "Equipment Overview", href: "/faculty#equipment-overview", icon: Microscope },
  { label: "Add Equipment", href: "/faculty#equipment-submissions", icon: PackagePlus },
  { label: "Scheduling Recommendations", href: "/faculty#scheduling-recommendations", icon: Lightbulb },
];

export function DemoShell({ role, children }: { role: WorkspaceRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const navigation = role === "student" ? studentNavigation : facultyNavigation;
  const roleLabel = role === "student" ? "Student Workspace" : "Faculty Workspace";

  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <aside className="sidebar" aria-label={`${roleLabel} navigation`}>
      <Link href="/" className="brand-row mb-8 flex items-center gap-3 px-2" aria-label="LabLink home">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#176b50] text-white"><FlaskConical size={20} aria-hidden="true"/></span>
        <span><span className="block text-lg font-extrabold tracking-tight">lab<span className="text-[#176b50]">link</span></span><span className="block text-[11px] font-semibold tracking-wide text-[#61736a]">RESEARCH, CONNECTED</span></span>
      </Link>
      <p className="nav-section-label mb-2 px-3 text-[11px] font-bold tracking-[.12em] text-[#61736a]">{role === "student" ? "STUDENT TOOLS" : "FACULTY TOOLS"}</p>
      <nav className="nav-scroll" aria-label="Primary navigation">
        {navigation.map(({ label, href, icon: Icon }) => {
          const isAnchor = href.includes("#");
          const active = isAnchor ? false : href === "/student/bookings" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "active" : ""}`}>
            <Icon size={18} strokeWidth={1.9} aria-hidden="true"/><span>{label}</span>
          </Link>;
        })}
      </nav>
      <div className="sidebar-bottom mt-auto pt-6">
        <div className="rounded-2xl border border-[#dce8df] bg-[#f1f7f3] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-[#234c39]"><ShieldCheck size={16} aria-hidden="true"/> Public showcase</p>
          <p className="mt-1 text-xs leading-5 text-[#52665c]">Showcase submissions are isolated. Production changes require verified access.</p>
        </div>
      </div>
    </aside>
    <div className="main-area">
      <header className="topbar">
        <p className="hidden min-w-0 truncate text-sm font-medium text-[#52665c] md:block">LabLink <span aria-hidden="true" className="mx-2 text-[#7b8b82]">/</span>{roleLabel}</p>
        <span className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-full border border-[#cfe3d4] bg-[#eff8f1] px-3 py-1 text-xs font-bold text-[#28553e]"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#287b5d]"/> Live workspace</span>
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#145a42] hover:bg-[#edf6f0]"><ArrowLeft size={16} aria-hidden="true"/><span className="hidden sm:inline">Choose workspace</span><span className="sm:hidden">Home</span></Link>
      </header>
      {children}
    </div>
  </div>;
}
