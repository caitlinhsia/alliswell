import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function UndoToast() {
  const pendingUndo = useAppStore((s) => s.pendingUndo);
  const undoDelete = useAppStore((s) => s.undoDelete);
  const clearUndo = useAppStore((s) => s.clearUndo);

  useEffect(() => {
    if (!pendingUndo) return;
    const id = setTimeout(clearUndo, 6000);
    return () => clearTimeout(id);
  }, [pendingUndo, clearUndo]);

  if (!pendingUndo) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-full pl-5 pr-2 py-2 shadow-xl">
      <span className="font-note text-sm">{pendingUndo.label}</span>
      <button
        onClick={undoDelete}
        className="font-note text-sm bg-[var(--color-paper)] text-[var(--color-ink)] rounded-full px-4 py-1.5 hover:opacity-90"
      >
        Undo
      </button>
      <button
        onClick={clearUndo}
        aria-label="Dismiss"
        className="w-8 h-8 rounded-full text-[var(--color-paper)]/60 hover:text-[var(--color-paper)] flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
}
