import { connection } from "next/server";
import { RequestWorkspace } from "@/components/requests/RequestWorkspace";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";
import { requests as demoRequests } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const instant = false;

type ProjectData = { id: string; title: string; description: string; status: string; created_at: string; department: { name: string } | { name: string }[] | null };
type BookingData = { id: string; purpose: string; status: string; starts_at: string; ends_at: string; equipment: { name: string } | { name: string }[] | null; project: { title: string } | { title: string }[] | null };

export default async function RequestsPage() {
  await connection();
  const configured = isSupabaseConfigured();
  let signedIn = false;
  let departments: { id: string; name: string }[] = [];
  let projects: { id: string; title: string; description: string; status: string; created_at: string; department: string }[] = [];
  let bookings: { id: string; purpose: string; status: string; starts_at: string; ends_at: string; equipment: string; project: string }[] = [];
  let requestsError: string | undefined;
  if (configured) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      signedIn = Boolean(authData.user);
      const departmentResult = await supabase.from("departments").select("id,name").eq("is_active", true).order("name");
      if (departmentResult.error) requestsError = "Could not load departments. Check that Supabase migrations are applied and RLS read access is enabled.";
      else departments = departmentResult.data ?? [];
      if (authData.user) {
        const [projectResult, bookingResult] = await Promise.all([
          supabase.from("projects").select("id,title,description,status,created_at,department:departments(name)").eq("owner_id", authData.user.id).order("created_at", { ascending: false }),
          supabase.from("booking_requests").select("id,purpose,status,starts_at,ends_at,equipment:equipment(name),project:projects(title)").eq("requested_by", authData.user.id).order("created_at", { ascending: false }),
        ]);
        if (projectResult.error || bookingResult.error) requestsError = "Could not load your projects or booking requests. Check that migrations are applied and your department membership is active.";
        else {
          const projectRows = (projectResult.data ?? []) as unknown as ProjectData[];
          const bookingRows = (bookingResult.data ?? []) as unknown as BookingData[];
          projects = projectRows.map((row) => ({ id: row.id, title: row.title, description: row.description, status: row.status, created_at: row.created_at, department: Array.isArray(row.department) ? row.department[0]?.name ?? "Department" : row.department?.name ?? "Department" }));
          bookings = bookingRows.map((row) => ({ id: row.id, purpose: row.purpose, status: row.status, starts_at: row.starts_at, ends_at: row.ends_at, equipment: Array.isArray(row.equipment) ? row.equipment[0]?.name ?? "Equipment" : row.equipment?.name ?? "Equipment", project: Array.isArray(row.project) ? row.project[0]?.title ?? "Project" : row.project?.title ?? "Project" }));
        }
      }
    }
  }
  return <Shell><main id="main-content" className="page-content"><PageHeader eyebrow="RESEARCH ACCESS" title="Project requests" description="Create research projects and track equipment access requests."/><RequestWorkspace configured={configured} signedIn={signedIn} departments={departments} projects={projects} bookings={bookings} requestsError={requestsError} demoRequests={demoRequests}/></main></Shell>;
}
