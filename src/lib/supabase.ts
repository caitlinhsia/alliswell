import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Accounts are optional. With no keys configured the notebook runs exactly as
 * it always has — everything in this browser — so the app never hard-depends
 * on a backend being reachable.
 */
export const isCloudEnabled = Boolean(url && anonKey);

/**
 * Snapshot of the URL fragment, taken before createClient runs.
 *
 * detectSessionInUrl consumes and clears the hash as soon as the client is
 * constructed, which is at module load — so anything reading
 * window.location.hash from a React effect is racing it and usually loses.
 * Everything that needs to know how we arrived (a recovery token, or the
 * error a dead link comes back with) reads this instead.
 */
export const entryHash: URLSearchParams = new URLSearchParams(
  typeof window === 'undefined' ? '' : window.location.hash.replace(/^#/, '')
);

export const supabase: SupabaseClient | null = isCloudEnabled
  ? createClient(url!, anonKey!, {
      // detectSessionInUrl is what picks the recovery token out of the link
      // the reset email sends you to.
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
