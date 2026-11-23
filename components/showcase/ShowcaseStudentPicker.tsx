"use client";

import { useShowcaseStudent } from "@/components/showcase/ShowcaseStudentProvider";
import { SHOWCASE_STUDENT_PROFILES } from "@/lib/showcase/profiles";

export function ShowcaseStudentPicker() {
  const { studentId, selectStudent, profile } = useShowcaseStudent();
  return <section className="card mb-5 p-4 sm:p-5" aria-labelledby="showcase-profile-heading"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,.8fr)] sm:items-end"><div><h2 id="showcase-profile-heading" className="text-base font-extrabold">Choose a showcase student</h2><p className="mt-1 text-sm leading-6 text-[#52665c]">Fictional profiles label public showcase records. Selection grants no production access.</p></div><label className="block text-sm font-semibold">Student profile<select value={studentId ?? ""} onChange={(event) => selectStudent((SHOWCASE_STUDENT_PROFILES.find((item) => item.id === event.target.value)?.id as typeof studentId) ?? null)} className="mt-1.5 min-h-11 w-full rounded-lg border border-[#cddbd1] bg-white px-3 text-sm"><option value="">Select a fictional student</option>{SHOWCASE_STUDENT_PROFILES.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.department} · {item.focus}</option>)}</select></label></div>{profile && <p className="mt-3 text-xs font-semibold text-[#28553e]" role="status">Selected: {profile.name}, {profile.department} · {profile.focus}</p>}</section>;
}
