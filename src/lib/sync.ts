import { supabase } from './supabase';
import { useAppStore } from '../store/useAppStore';

export type NotebookData = Record<string, unknown>;

/** Plain-data slice of the store — actions and transient UI state excluded. */
export function snapshotState(): NotebookData {
  const state = useAppStore.getState() as unknown as Record<string, unknown>;
  const out: NotebookData = {};
  for (const [k, v] of Object.entries(state)) {
    if (typeof v === 'function') continue;
    if (k === 'pendingUndo') continue;
    out[k] = v;
  }
  return out;
}

export function applyState(data: NotebookData) {
  useAppStore.setState(data as never);
}

/** Rough "is there anything here worth keeping" check for the merge prompt. */
export function isSubstantial(data: NotebookData | null): boolean {
  if (!data) return false;
  const listKeys = [
    'schedule',
    'todos',
    'journalEntries',
    'stickyNotes',
    'mindMapNodes',
    'studySessions',
    'studyTodos',
  ];
  const anyList = listKeys.some((k) => Array.isArray(data[k]) && (data[k] as unknown[]).length > 0);
  const anyText = typeof data.writeNoteHtml === 'string' && data.writeNoteHtml.trim().length > 0;
  const customSubjects = Array.isArray(data.subjects) && (data.subjects as unknown[]).length > 1;
  return anyList || anyText || customSubjects;
}

export async function pullNotebook(userId: string): Promise<NotebookData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('notebooks')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as NotebookData) ?? null;
}

export async function pushNotebook(userId: string, data: NotebookData): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('notebooks')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}

/**
 * Content fingerprint of a notebook. Key order is normalised so two snapshots
 * of the same data always hash alike, whatever order the store enumerated in.
 */
export function fingerprint(data: NotebookData | null): string {
  if (!data) return '';
  const stable = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(stable);
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      return Object.keys(o)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => ((acc[k] = stable(o[k])), acc), {});
    }
    return v;
  };
  return JSON.stringify(stable(data));
}

const SYNCED_KEY = 'alliswell-last-synced';
const STASH_KEY = 'alliswell-replaced-copy';

/** Remembers the exact content we last agreed on with the account. */
export function rememberSynced(userId: string, data: NotebookData) {
  try {
    localStorage.setItem(SYNCED_KEY, JSON.stringify({ userId, fp: fingerprint(data) }));
  } catch {
    /* private mode — we simply lose the shortcut and may ask again */
  }
}

export function lastSynced(userId: string): string | null {
  try {
    const raw = localStorage.getItem(SYNCED_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { userId?: string; fp?: string };
    return v.userId === userId ? v.fp ?? null : null;
  } catch {
    return null;
  }
}

/** Keeps the copy we are about to overwrite, so 'replaced' never means 'gone'. */
export function stashReplaced(data: NotebookData) {
  try {
    localStorage.setItem(STASH_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* nothing we can do; the choice was explicit either way */
  }
}

export function readStashed(): { at: number; data: NotebookData } | null {
  try {
    const raw = localStorage.getItem(STASH_KEY);
    return raw ? (JSON.parse(raw) as { at: number; data: NotebookData }) : null;
  } catch {
    return null;
  }
}

export function downloadBackup(data: NotebookData = snapshotState()) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `allisw3ll-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
