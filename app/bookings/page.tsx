import { connection } from "next/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BookingsView } from "@/components/booking/BookingsView";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";
import { bookings as demoBookings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const instant = false;

export default async function BookingsPage() {
  await connection();
  const configured = isSupabaseConfigured();
  let signedIn = false;
  let rows: { id: string; equipment: string; lab: string; project: string; date: string; time: string; status: string; purpose: string }[] = [];
  let error: string | undefined;
  if (configured) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      signedIn = Boolean(authData.user);
      if (authData.user) {
        const { data, error: queryError } = await supabase.from("booking_requests").select("id,purpose,status,starts_at,ends_at,equipment:equipment(name,lab_name),project:projects(title)").eq("requested_by", authData.user.id).order("starts_at", { ascending: true });
        if (queryError) error = "Could not load booking requests. Check that migrations are applied and your department membership is active.";
        else rows = (data ?? []).map((row) => {
          const equipment = Array.isArray(row.equipment) ? row.equipment[0] : row.equipment;
          const project = Array.isArray(row.project) ? row.project[0] : row.project;
          const starts = new Date(row.starts_at); const ends = new Date(row.ends_at);
          return { id: row.id, equipment: equipment?.name ?? "Equipment", lab: equipment?.lab_name ?? "Shared lab", project: project?.title ?? "Project", date: starts.toLocaleDateString(), time: `${starts.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${ends.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`, status: row.status, purpose: row.purpose };
        });
      }
    }
  }
  return <Shell><main id="main-content" className="page-content"><PageHeader eyebrow="YOUR SCHEDULE" title="My bookings" description="Keep track of equipment requests and faculty decisions." action={<Link href="/catalog" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#176b50] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#11573f] sm:w-auto"><Plus size={17} aria-hidden="true"/> New booking</Link>}/><div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="stat-card"><div className="text-xs font-bold tracking-wide text-[#52665c]">BOOKING REQUESTS</div><div className="mt-2 text-2xl font-extrabold">{configured ? signedIn ? rows.length : "—" : demoBookings.length}</div></div><div className="stat-card"><div className="text-xs font-bold tracking-wide text-[#52665c]">PENDING REVIEW</div><div className="mt-2 text-2xl font-extrabold">{configured ? signedIn ? rows.filter((row) => row.status === "pending").length : "—" : 1}</div></div></div><BookingsView configured={configured} signedIn={signedIn} rows={rows} error={error} demoBookings={demoBookings}/></main></Shell>;
}
