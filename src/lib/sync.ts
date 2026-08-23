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
