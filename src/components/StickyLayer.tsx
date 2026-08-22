import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import StickyNoteItem from './StickyNoteItem';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';
import type { StickyPage } from '../types';

/**
 * Floating sticky-note layer. Renders this page's notes plus a corner
 * "add note" affordance, so any page can be marked up like real paper.
 */
export default function StickyLayer({ page }: { page: StickyPage }) {
  const stickyNotes = useAppStore((s) => s.stickyNotes);
  const addStickyNote = useAppStore((s) => s.addStickyNote);
  const updateStickyNote = useAppStore((s) => s.updateStickyNote);
  const removeStickyNote = useAppStore((s) => s.removeStickyNote);
  const bringToFront = useAppStore((s) => s.bringStickyNoteToFront);
  const [pickerOpen, setPickerOpen] = useState(false);

  const notes = stickyNotes.filter((n) => n.page === page);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-20">
        {notes.map((note) => (
          <div key={note.id} className="pointer-events-auto">
            <StickyNoteItem
              note={note}
              onUpdate={updateStickyNote}
              onRemove={removeStickyNote}
              onBringToFront={bringToFront}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 z-30">
        {pickerOpen && (
          <>
            <span className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
            <div className="absolute bottom-12 right-0 z-40 bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-xl shadow-lg p-2 grid grid-cols-6 gap-1.5 w-[168px]">
              {NOTE_COLOR_LIST.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    addStickyNote(page, c, 60 + Math.random() * 180, 90 + Math.random() * 160);
                    setPickerOpen(false);
                  }}
                  aria-label={`Add ${c} sticky note`}
                  title={c}
                  className="w-5 h-5 rounded-full border border-black/15 hover:scale-110 transition-transform"
                  style={{ background: NOTE_COLORS[c] }}
                />
              ))}
            </div>
          </>
        )}
        <button
          onClick={() => setPickerOpen((o) => !o)}
          aria-label="Add sticky note to this page"
          title="Add a sticky note"
          className="w-11 h-11 rounded-full bg-[var(--color-paper)] border border-[var(--color-paper-line)] shadow-md hover:shadow-lg hover:border-[var(--color-ink-soft)] transition-all flex items-center justify-center text-lg"
        >
          🗒️
        </button>
      </div>
    </>
  );
}
