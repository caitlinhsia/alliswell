import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase, isCloudEnabled } from '../lib/supabase';
import {
  applyState,
  fingerprint,
  isSubstantial,
  lastSynced,
  pullNotebook,
  pushNotebook,
  rememberSynced,
  snapshotState,
  stashReplaced,
  type NotebookData,
} from '../lib/sync';
import { useAppStore } from './useAppStore';

type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error';

interface AuthState {
  ready: boolean;
  session: Session | null;
  status: SyncStatus;
  error: string | null;
  /** Set when local and cloud both hold real data and the user must choose. */
  conflict: { local: NotebookData; cloud: NotebookData } | null;

  init: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resolveConflict: (choice: 'local' | 'cloud') => Promise<void>;
  saveNow: () => Promise<void>;
}

let unsubStore: (() => void) | null = null;
let saveTimer: number | null = null;
let started = false;

/** Supabase surfaces raw fetch/network wording; say something usable instead. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
    return "Couldn't reach the server. Check your connection, or that the account keys are set up.";
  }
  if (m.includes('invalid login credentials')) return 'That email and password do not match an account.';
  if (m.includes('email not confirmed')) return 'Confirm your email address first, then sign in.';
  if (m.includes('user already registered')) return 'That email already has an account — sign in instead.';
  if (m.includes('password should be')) return 'Password needs to be at least 6 characters.';
  return message;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  ready: !isCloudEnabled,
  session: null,
  status: 'idle',
  error: null,
  conflict: null,

  init: () => {
    if (started || !supabase) return;
    started = true;

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, ready: true });
      if (data.session) void afterSignIn(set, get);
    });

    supabase.auth.onAuthStateChange((event, session) => {
      set({ session });
      if (event === 'SIGNED_IN' && session) void afterSignIn(set, get);
      if (event === 'SIGNED_OUT') stopWatching(set);
    });
  },

  signUp: async (email, password) => {
    if (!supabase) return;
    set({ error: null, status: 'syncing' });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ error: friendly(error.message), status: 'error' });
      throw error;
    }
    set({ status: 'idle' });
  },

  signIn: async (email, password) => {
    if (!supabase) return;
    set({ error: null, status: 'syncing' });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: friendly(error.message), status: 'error' });
      throw error;
    }
    set({ status: 'idle' });
  },

  signOut: async () => {
    if (!supabase) return;
    await get().saveNow().catch(() => {});
    stopWatching(set);
    await supabase.auth.signOut();
    set({ session: null, status: 'idle' });
  },

  resolveConflict: async (choice) => {
    const c = get().conflict;
    const userId = get().session?.user.id;
    if (!c || !userId) return;
    set({ conflict: null, status: 'syncing' });
    // Whichever copy loses is kept on this device, so the choice is undoable.
    stashReplaced(choice === 'cloud' ? c.local : c.cloud);
    const kept = choice === 'cloud' ? c.cloud : c.local;
    if (choice === 'cloud') {
      applyState(c.cloud);
    } else {
      await pushNotebook(userId, c.local).catch(() => {});
    }
    rememberSynced(userId, kept);
    startWatching(set, get);
    set({ status: 'saved' });
  },

  saveNow: async () => {
    const userId = get().session?.user.id;
    if (!userId || !supabase) return;
    set({ status: 'syncing' });
    try {
      const data = snapshotState();
      await pushNotebook(userId, data);
      rememberSynced(userId, data);
      set({ status: 'saved', error: null });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? friendly(e.message) : 'Could not save' });
    }
  },
}));

type SetFn = (partial: Partial<AuthState>) => void;
type GetFn = () => AuthState;

async function afterSignIn(set: SetFn, get: GetFn) {
  const userId = get().session?.user.id;
  if (!userId) return;
  set({ status: 'syncing', error: null });
  try {
    const cloud = await pullNotebook(userId);
    const local = snapshotState();
    const cloudFp = fingerprint(cloud);
    const localFp = fingerprint(local);
    const knownFp = lastSynced(userId);

    // Nothing in the account yet, or the two sides already agree: no question
    // worth asking. Same when only one side moved since we last synced — the
    // side that changed is plainly the newer one.
    if (!cloud || !isSubstantial(cloud)) {
      await pushNotebook(userId, local);
      rememberSynced(userId, local);
    } else if (cloudFp === localFp) {
      rememberSynced(userId, local);
    } else if (!isSubstantial(local) || (knownFp !== null && localFp === knownFp)) {
      applyState(cloud);
      rememberSynced(userId, cloud);
    } else if (knownFp !== null && cloudFp === knownFp) {
      await pushNotebook(userId, local);
      rememberSynced(userId, local);
    } else {
      // Genuinely divergent, and we have no record of reconciling them before.
      set({ conflict: { local, cloud }, status: 'idle' });
      return;
    }

    startWatching(set, get);
    set({ status: 'saved' });
  } catch (e) {
    set({ status: 'error', error: e instanceof Error ? friendly(e.message) : 'Could not sync' });
  }
}

function startWatching(set: SetFn, get: GetFn) {
  stopWatching(set, false);
  unsubStore = useAppStore.subscribe(() => {
    if (!get().session) return;
    if (saveTimer) window.clearTimeout(saveTimer);
    set({ status: 'syncing' });
    saveTimer = window.setTimeout(() => void get().saveNow(), 1200);
  });
}

function stopWatching(set: SetFn, resetStatus = true) {
  if (unsubStore) {
    unsubStore();
    unsubStore = null;
  }
  if (saveTimer) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (resetStatus) set({ status: 'idle' });
}
