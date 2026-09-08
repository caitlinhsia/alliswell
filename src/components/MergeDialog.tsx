import { useAuthStore } from '../store/useAuthStore';
import type { NotebookData } from '../lib/sync';

function describe(d: NotebookData) {
  const n = (k: string) => (Array.isArray(d[k]) ? (d[k] as unknown[]).length : 0);
  const bits = [
    [n('journalEntries'), 'journal'],
    [n('todos'), 'to-dos'],
    [n('schedule'), 'scheduled'],
    [n('stickyNotes'), 'stickies'],
    [n('mindMapNodes'), 'bubbles'],
  ] as [number, string][];
  const parts = bits.filter(([c]) => c > 0).map(([c, label]) => `${c} ${label}`);
  return parts.length ? parts.join(' · ') : 'empty';
}

/**
 * Only ever shown when this device and the account have genuinely drifted
 * apart — same content, or a difference on one side only, is reconciled
 * silently. The losing copy is stashed on the device, so this is not a
 * one-way door and needs no download ritual.
 */
export default function MergeDialog() {
  const conflict = useAuthStore((s) => s.conflict);
  const resolve = useAuthStore((s) => s.resolveConflict);
  if (!conflict) return null;

  const options: [Parameters<typeof resolve>[0], string, NotebookData][] = [
    ['local', 'This device', conflict.local],
    ['cloud', 'Your account', conflict.cloud],
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-ink)]/20 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-sm shadow-[0_20px_60px_-24px_rgba(43,42,39,0.45)] p-7">
        <p className="label mb-3">Two versions</p>
        <h2 className="font-display text-2xl leading-snug mb-2">
          This notebook drifted <em className="italic text-[var(--color-accent)]">apart</em>.
        </h2>
        <p className="text-sm text-[var(--color-ink-soft)] mb-6 leading-relaxed">
          Pick the one to carry forward. The other stays tucked away on this device — nothing is
          thrown out.
        </p>

        <div className="flex flex-col">
          {options.map(([choice, label, data]) => (
            <button
              key={choice}
              onClick={() => void resolve(choice)}
              className="group text-left border-t border-[var(--color-paper-line)] last:border-b py-3.5 flex items-baseline gap-3 transition-colors hover:text-[var(--color-accent)]"
            >
              <span className="text-[0.95rem]">{label}</span>
              <span className="flex-1 h-px bg-[var(--color-paper-line)] translate-y-[-3px]" />
              <span className="font-mono text-[0.68rem] text-[var(--color-ink-faint)]">
                {describe(data)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
