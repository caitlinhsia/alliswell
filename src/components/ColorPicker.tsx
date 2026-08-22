import { useState } from 'react';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';
import type { NoteColor } from '../types';

export default function ColorPicker({
  value,
  onChange,
  size = 'md',
  label = 'Change color',
}: {
  value: NoteColor;
  onChange: (c: NoteColor) => void;
  size?: 'sm' | 'md';
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const dot = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={label}
        title={label}
        className={`${dot} rounded-full border border-black/20 shrink-0 hover:scale-110 transition-transform`}
        style={{ background: NOTE_COLORS[value] }}
      />
      {open && (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <span
            className="absolute z-40 top-full left-1/2 -translate-x-1/2 mt-1.5 bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-xl shadow-lg p-2 grid grid-cols-6 gap-1.5 w-[168px]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {NOTE_COLOR_LIST.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                aria-label={c}
                title={c}
                className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${
                  value === c ? 'border-[var(--color-ink)] border-2' : 'border-black/15'
                }`}
                style={{ background: NOTE_COLORS[c] }}
              />
            ))}
          </span>
        </>
      )}
    </span>
  );
}
