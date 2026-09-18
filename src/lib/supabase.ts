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

/** The query string, snapshotted at the same moment and for the same reason. */
export const entryQuery: URLSearchParams = new URLSearchParams(
  typeof window === 'undefined' ? '' : window.location.search
);

/**
 * Supabase can land a recovery in three shapes depending on the project's
 * flow: tokens in the fragment, a PKCE code in the query, or just type=
 * recovery. Treat any of them as "this person came here to set a password".
 */
export const arrivedForRecovery =
  entryHash.get('type') === 'recovery' ||
  entryQuery.get('type') === 'recovery' ||
  (entryHash.has('access_token') && entryHash.get('type') !== 'signup');

/** A PKCE link puts a code in the query that must be exchanged by hand. */
export const entryCode = entryQuery.get('code');

/**
 * A token_hash link points at this app rather than at Supabase's verify
 * endpoint, and is only redeemed once this code calls verifyOtp. That matters
 * because mail providers pre-fetch links to scan them: a link that redeems
 * itself on GET is spent before the person ever clicks it, which is what
 * "this link has expired" usually means. Scanners do not run our JavaScript,
 * so this survives them.
 */
export const entryTokenHash = entryQuery.get('token_hash');

export const supabase: SupabaseClient | null = isCloudEnabled
  ? createClient(url!, anonKey!, {
      // detectSessionInUrl is what picks the recovery token out of the link
      // the reset email sends you to.
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
