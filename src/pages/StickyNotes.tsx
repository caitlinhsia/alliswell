import { useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import StickyNoteItem from '../components/StickyNoteItem';
import { NOTE_COLOR_LIST, NOTE_COLORS } from '../lib/colors';

export default function StickyNotes() {
  const stickyNotes = useAppStore((s) => s.stickyNotes);
  const addStickyNote = useAppStore((s) => s.addStickyNote);
  const boardRef = useRef<HTMLDivElement>(null);

  function handleAdd(color: (typeof NOTE_COLOR_LIST)[number]) {
    const board = boardRef.current;
    const x = board ? board.scrollLeft + 60 + Math.random() * 200 : 60 + Math.random() * 200;
    const y = board ? board.scrollTop + 60 + Math.random() * 200 : 60 + Math.random() * 200;
    addStickyNote(color, x, y);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 md:px-10 pt-6 pb-3 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <h2 className="font-sans font-extrabold text-3xl md:text-4xl text-[var(--color-ink)] flex items-center gap-3">
          <span className="text-2xl md:text-3xl">📌</span>
          Sticky Notes
        </h2>
        <div className="flex gap-1.5">
          {NOTE_COLOR_LIST.map((c) => (
            <button
              key={c}
              onClick={() => handleAdd(c)}
              className="w-7 h-7 rounded-full border border-[var(--color-paper-line)] hover:scale-110 transition-transform"
              style={{ background: NOTE_COLORS[c] }}
              aria-label={`Add ${c} note`}
              title="Add note"
            />
          ))}
        </div>
      </div>
      <p className="font-note text-sm text-[var(--color-ink-soft)] px-6 md:px-10 pb-2 shrink-0">
        Click a color to drop a note, then drag it anywhere on the board.
      </p>
      <div
        ref={boardRef}
        className="relative flex-1 overflow-auto paper-texture bg-[var(--color-paper-deep)]/40"
      >
        <div className="relative" style={{ width: 2400, height: 1600 }}>
          {stickyNotes.length === 0 && (
            <p className="absolute top-10 left-10 font-note text-[var(--color-ink-soft)]">
              Your corkboard is empty — add a note above to get started.
            </p>
          )}
          {stickyNotes.map((note) => (
            <StickyNoteItem key={note.id} note={note} />
          ))}
        </div>
      </div>
    </div>
  );
}
