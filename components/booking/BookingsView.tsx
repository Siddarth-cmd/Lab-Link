"use client";

import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";
import type { bookings as demoBookings } from "@/lib/data";

type BookingRow = { id: string; equipment: string; lab: string; project: string; date: string; time: string; status: string; purpose: string };
type Props = { configured: boolean; signedIn: boolean; rows: BookingRow[]; error?: string; demoBookings: typeof demoBookings };

export function BookingsView({ configured, signedIn, rows, error, demoBookings: samples }: Props) {
  const visibleRows: BookingRow[] = configured ? rows : samples.map((item) => ({ id: item.equipment, equipment: item.equipment, lab: item.lab, project: "Demo project", date: item.date, time: item.time, status: item.status.toLowerCase(), purpose: "Demo request record" }));
  return <>
    {!configured && <div role="status" className="mb-5 rounded-xl border border-[#e5d6b6] bg-[#fff9ed] p-4 text-sm leading-6 text-[#735b34]">Demo schedule: these sample booking records are placeholders. Connect Supabase and sign in to see persistent requests.</div>}
    {error && <div role="alert" className="mb-5 rounded-xl border border-[#efd4ce] bg-[#fff4f1] p-4 text-sm leading-6 text-[#843f34]">{error}</div>}
    {configured && !signedIn && <div role="status" className="mb-5 rounded-xl border border-[#dcebe1] bg-[#f2f8f3] p-4 text-sm leading-6 text-[#405c4a]">Sign in to see your booking requests. <Link href="/sign-in" className="ml-1 font-bold text-[#145a42] underline underline-offset-2">Sign in</Link></div>}
    <section className="card overflow-hidden" aria-labelledby="booking-list-heading">
      <div className="flex items-center gap-3 border-b border-[#e5ece7] p-4 sm:p-5"><CalendarDays size={19} aria-hidden="true" className="text-[#28553e]"/><h2 id="booking-list-heading" className="text-lg font-extrabold">{configured ? "Your requests" : "Upcoming · demo data"}</h2></div>
      {visibleRows.length ? visibleRows.map((booking) => <article key={booking.id} className="flex min-w-0 flex-col gap-3 border-b border-[#e5ece7] p-4 last:border-0 sm:flex-row sm:items-center sm:p-5">
        <div aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eff5f0] text-[#28553e]"><Clock3 size={19}/></div>
        <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-bold">{booking.equipment}</h3><p className="mt-1 break-words text-sm text-[#52665c]">{booking.lab} · {booking.project}</p><p className="mt-2 break-words text-sm leading-6 text-[#52665c]">{booking.purpose}</p></div>
        <div className="text-sm sm:w-48 sm:shrink-0"><p className="font-semibold">{booking.date}</p><p className="mt-1 text-[#52665c]">{booking.time}</p></div>
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${booking.status === "approved" || booking.status === "confirmed" ? "bg-[#e5f3e9] text-[#28553e]" : booking.status === "rejected" || booking.status === "cancelled" ? "bg-[#f5e9e7] text-[#843f34]" : "bg-[#fff3df] text-[#735b34]"}`}>{booking.status.replaceAll("_", " ")}</span>
      </article>) : <div className="px-5 py-10 text-center" role={error ? "status" : undefined}>
        <p className="text-base font-bold text-[#344e40]">{error ? "Booking requests could not be loaded" : configured && !signedIn ? "Sign in to view your bookings" : "No booking requests yet"}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#52665c]">{error ? "Try again when your connection is restored." : configured && !signedIn ? "Your personal requests appear after you sign in." : "Browse the equipment catalog to request a time for your project."}</p>
        {configured && !signedIn ? <Link href="/sign-in" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#176b50] px-4 py-2 text-sm font-bold text-white">Sign in</Link> : <Link href="/catalog" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#176b50] px-4 py-2 text-sm font-bold text-[#145a42] hover:bg-[#edf6f0]">Discover equipment →</Link>}
      </div>}
    </section>
  </>;
}
