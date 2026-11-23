import Link from "next/link";
import { DemoShell } from "@/components/demo/DemoShell";
import { PageHeader } from "@/components/PageHeader";
import { StudentEquipmentCatalog } from "@/components/student/StudentEquipmentCatalog";

export const instant = false;
export default function StudentCatalogPage() {
  return <DemoShell role="student"><main id="main-content" className="page-content"><PageHeader eyebrow="STUDENT WORKSPACE · LIVE CATALOG" title="Equipment catalog" description="Search active Supabase equipment, inspect specifications, and start a project-linked booking request." action={<Link href="/student/bookings/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#176b50] px-4 py-2.5 text-sm font-bold text-white">New booking</Link>}/><StudentEquipmentCatalog/></main></DemoShell>;
}
