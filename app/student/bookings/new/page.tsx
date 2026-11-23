import { connection } from "next/server";
import { DemoShell } from "@/components/demo/DemoShell";
import { PageHeader } from "@/components/PageHeader";
import { NewBookingForm } from "@/components/student/NewBookingForm";
import { ShowcaseStudentPicker } from "@/components/showcase/ShowcaseStudentPicker";

export const instant = false;
export default async function NewStudentBookingPage({ searchParams }: { searchParams: Promise<{ equipment?: string }> }) {
  await connection();
  const { equipment } = await searchParams;
  return <DemoShell role="student"><main id="main-content" className="page-content"><PageHeader eyebrow="STUDENT WORKSPACE · SUPABASE" title="New equipment booking" description="Choose an active resource, a project, and a time slot. Your showcase request will be reviewed in the isolated public coordinator workspace; it is not a production reservation."/><div className="mx-auto max-w-3xl"><ShowcaseStudentPicker/><NewBookingForm initialEquipmentId={equipment}/></div></main></DemoShell>;
}
