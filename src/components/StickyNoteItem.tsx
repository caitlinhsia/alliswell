import { useRef, useState } from 'react';
import { NOTE_COLORS } from '../lib/colors';
import ColorPicker from './ColorPicker';
import StickyDrawCanvas from './StickyDrawCanvas';
import type { StickyNote } from '../types';

export default function StickyNoteItem({
  note,
  onUpdate,
  onRemove,
  onBringToFront,
}: {
  note: StickyNote;
  onUpdate: (id: string, patch: Partial<StickyNote>) => void;
  onRemove: (id: string) => void;
  onBringToFront: (id: string) => void;
}) {
  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number } | null>(
    null
  );
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<'text' | 'draw'>('text');

  function onHandlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, noteX: note.x, noteY: note.y };
    setDragging(true);
    onBringToFront(note.id);
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onUpdate(note.id, {
      x: Math.max(0, dragRef.current.noteX + dx),
      y: Math.max(0, dragRef.current.noteY + dy),
    });
  }

  function onHandlePointerUp() {
    dragRef.current = null;
    setDragging(false);
  }

  return (
    <div
      className="absolute w-52 shadow-lg flex flex-col select-none"
      style={{
        left: note.x,
        top: note.y,
        zIndex: note.z,
        background: `color-mix(in srgb, ${NOTE_COLORS[note.color]} var(--sticky-mix), var(--color-paper))`,
        transform: `rotate(${dragging ? 0 : note.rotation}deg)`,
        transition: dragging ? 'none' : 'transform 0.15s',
      }}
      onPointerDown={() => onBringToFront(note.id)}
    >
      <div className="h-7 flex items-center justify-between px-1">
        <span
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          className="text-[var(--color-ink)]/60 text-xs cursor-grab active:cursor-grabbing px-2 py-2 -m-2"
        >
          ⠿⠿
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode((m) => (m === 'text' ? 'draw' : 'text'))}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={mode === 'text' ? 'Switch to drawing' : 'Switch to text'}
            title={mode === 'text' ? 'Draw' : 'Write'}
            className="font-note text-[10px] text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] leading-none px-1.5 py-1.5 -m-1.5"
          >
            {mode === 'text' ? 'draw' : 'text'}
          </button>
          <button
            onClick={() => onRemove(note.id)}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] text-base leading-none px-1.5 py-1.5 -m-1.5"
            aria-label="Delete note"
          >
            ×
          </button>
        </div>
      </div>

      {mode === 'text' ? (
        <textarea
          value={note.text}
          onChange={(e) => onUpdate(note.id, { text: e.target.value })}
          placeholder="write something..."
          rows={5}
          className="font-note text-sm bg-transparent resize-none focus:outline-none px-3 pb-2 flex-1"
        />
      ) : (
        <StickyDrawCanvas
          value={note.drawing}
          onChange={(dataUrl) => onUpdate(note.id, { drawing: dataUrl })}
        />
      )}

      <div className="flex items-center gap-2 px-3 pb-2">
        <ColorPicker
          size="sm"
          value={note.color}
          onChange={(c) => onUpdate(note.id, { color: c })}
          label="Note color"
        />
        <span className="font-note text-[10px] text-[var(--color-ink)]/60">color</span>
      </div>
    </div>
  );
}
