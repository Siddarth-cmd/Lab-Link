"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LoaderCircle, Mail } from "lucide-react";

export function SignInForm({ next = "/student", initialError = "" }: { next?: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError("");
    const client = createSupabaseBrowserClient();
    if (!client) { setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local."); return; }
    setLoading(true);
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    const { error: authError } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo.toString(), shouldCreateUser: false },
    });
    setLoading(false);
    if (authError) setError("We couldn't send a sign-in link. Check the Supabase Auth email and redirect URL settings.");
    else setMessage("If this email belongs to a pre-provisioned LabLink account, check its inbox for a secure sign-in link.");
  }

  return <form onSubmit={submit} className="card p-5 md:p-6 max-w-md w-full">
    <label className="block text-xs font-bold mb-2" htmlFor="email">Institutional email</label>
    <div className="flex gap-2 items-center border border-[#dfe7e1] rounded-lg px-3"><Mail size={15} className="text-[#52665c]"/><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@university.edu" className="w-full py-3 outline-none text-sm"/></div>
    <button disabled={loading} className="w-full rounded-lg bg-[#176b50] text-white text-xs font-bold px-4 py-3 mt-4 disabled:opacity-60 flex justify-center items-center gap-2">{loading && <LoaderCircle size={15} className="animate-spin"/>}Send sign-in link</button>
    {message && <p role="status" className="mt-3 text-xs text-[#347751]">{message}</p>}{error && <p role="alert" className="mt-3 text-xs text-[#843f34]">{error}</p>}
    <p className="mt-4 text-[10px] leading-5 text-[#52665c]">Access depends on department membership assigned by a LabLink administrator.</p>
  </form>;
}
