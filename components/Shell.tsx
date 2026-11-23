import Link from "next/link";
import { Sidebar } from "./Sidebar";

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <Sidebar/>
    <div className="main-area">
      <header className="topbar">
        <p className="hidden text-sm font-medium text-[#52665c] md:block">LabLink <span aria-hidden="true" className="mx-2 text-[#7b8b82]">/</span> Research workspace</p>
        <Link href="/sign-in" className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#145a42] hover:bg-[#edf6f0]">Sign in <span aria-hidden="true">→</span></Link>
      </header>
      {children}
    </div>
  </div>;
}
