import { useAuthStore } from '../store/useAuthStore';
import { downloadBackup, type NotebookData } from '../lib/sync';

function describe(d: NotebookData) {
  const n = (k: string) => (Array.isArray(d[k]) ? (d[k] as unknown[]).length : 0);
  const bits = [
    [n('journalEntries'), 'journal entries'],
    [n('todos'), 'to-dos'],
    [n('schedule'), 'scheduled items'],
    [n('stickyNotes'), 'sticky notes'],
    [n('mindMapNodes'), 'mind map bubbles'],
  ] as [number, string][];
  const parts = bits.filter(([c]) => c > 0).map(([c, label]) => `${c} ${label}`);
  return parts.length ? parts.join(' · ') : 'nothing much';
}

/**
 * Shown once, when signing in on a device that already has work AND the
 * account already holds work. Rather than guessing, the user picks.
 */
export default function MergeDialog() {
  const conflict = useAuthStore((s) => s.conflict);
  const resolve = useAuthStore((s) => s.resolveConflict);
  if (!conflict) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4">
      <div
        className="w-full max-w-md bg-[#fffdf8] border-[3px] border-[var(--color-ink)] shadow-2xl p-6"
        style={{ borderRadius: '4px 22px 6px 20px / 14px 5px 18px 6px' }}
      >
        <h2 className="font-hand text-3xl mb-1">Two notebooks</h2>
        <p className="font-note text-sm text-[var(--color-ink-soft)] mb-4">
          This device and your account both have writing in them. Pick which one to keep — the other
          is replaced, so grab a backup first if you are unsure.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => void resolve('local')}
            className="text-left font-note border border-[var(--color-paper-line)] rounded-sm px-4 py-3 hover:bg-[var(--color-paper-deep)] transition-colors"
          >
            <span className="block text-[var(--color-ink)]">Keep what is on this device</span>
            <span className="block text-xs text-[var(--color-ink-soft)] mt-0.5">
              {describe(conflict.local)}
            </span>
          </button>

          <button
            onClick={() => void resolve('cloud')}
            className="text-left font-note border border-[var(--color-paper-line)] rounded-sm px-4 py-3 hover:bg-[var(--color-paper-deep)] transition-colors"
          >
            <span className="block text-[var(--color-ink)]">Keep what is in the account</span>
            <span className="block text-xs text-[var(--color-ink-soft)] mt-0.5">
              {describe(conflict.cloud)}
            </span>
          </button>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => downloadBackup(conflict.local)}
            className="font-note text-xs underline text-[var(--color-ink-soft)]"
          >
            back up this device
          </button>
          <button
            onClick={() => downloadBackup(conflict.cloud)}
            className="font-note text-xs underline text-[var(--color-ink-soft)]"
          >
            back up the account
          </button>
        </div>
      </div>
    </div>
  );
}
