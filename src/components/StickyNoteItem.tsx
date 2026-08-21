import { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';
import type { StickyNote } from '../types';

export default function StickyNoteItem({ note }: { note: StickyNote }) {
  const updateStickyNote = useAppStore((s) => s.updateStickyNote);
  const removeStickyNote = useAppStore((s) => s.removeStickyNote);
  const bringToFront = useAppStore((s) => s.bringStickyNoteToFront);

  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number } | null>(
    null
  );
  const [dragging, setDragging] = useState(false);

  function onHandlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, noteX: note.x, noteY: note.y };
    setDragging(true);
    bringToFront(note.id);
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    updateStickyNote(note.id, {
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
        background: NOTE_COLORS[note.color],
        transform: `rotate(${dragging ? 0 : note.rotation}deg)`,
        transition: dragging ? 'none' : 'transform 0.15s',
      }}
      onPointerDown={() => bringToFront(note.id)}
    >
      <div
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        className="h-6 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing"
      >
        <span className="text-[var(--color-ink-soft)] text-xs">⠿⠿</span>
        <button
          onClick={() => removeStickyNote(note.id)}
          className="text-[var(--color-ink-soft)] hover:text-red-600 text-base leading-none px-2 py-2 -m-2"
          aria-label="Delete note"
        >
          ×
        </button>
      </div>
      <textarea
        value={note.text}
        onChange={(e) => updateStickyNote(note.id, { text: e.target.value })}
        placeholder="write something..."
        rows={5}
        className="font-note text-sm bg-transparent resize-none focus:outline-none px-3 pb-2 flex-1"
      />
      <div className="flex gap-1 px-2 pb-2">
        {NOTE_COLOR_LIST.map((c) => (
          <button
            key={c}
            onClick={() => updateStickyNote(note.id, { color: c })}
            className={`w-3.5 h-3.5 rounded-full border ${
              note.color === c ? 'border-[var(--color-ink)]' : 'border-transparent'
            }`}
            style={{ background: NOTE_COLORS[c] }}
            aria-label={`Set color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
