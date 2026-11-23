import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";

export async function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. The Next.js proxy refreshes sessions.
        }
      },
    },
  });
}

/** A cookie-free server client for explicitly public reads and isolated showcase RPCs.
 * It always uses the publishable key as the anonymous role, even if an institutional
 * session cookie happens to be present on the incoming request. RLS remains active.
 */
export async function createSupabasePublicServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() { return []; },
      setAll() { /* public requests never persist or refresh a user session */ },
    },
  });
}
