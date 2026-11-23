import Link from "next/link";

export function SessionSetupLink({ next, role }: { next: string; role: "student" | "faculty" }) {
  const label = role === "student" ? "Continue with an existing student account" : "Continue with an existing faculty account";
  return <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-[#176b50] px-3 py-2 text-sm font-bold text-[#145a42] hover:bg-[#edf6f0]">{label}</Link>;
}
