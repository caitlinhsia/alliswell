import { useState } from 'react';
import type { ReactNode } from 'react';
import SpiralRings from './SpiralRings';

export default function FoldOutSpread({
  rotate = 0,
  ringCount = 12,
  onDropInto,
  children,
}: {
  rotate?: number;
  ringCount?: number;
  onDropInto: (draggedId: string) => void;
  children: ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="relative shrink-0" style={{ transform: `rotate(${rotate}deg)` }}>
      <SpiralRings count={ringCount} />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          const draggedId = e.dataTransfer.getData('text/plain');
          if (draggedId) onDropInto(draggedId);
        }}
        className={`relative flex bg-[#fffdf8] border-[3px] shadow-[5px_6px_0_rgba(51,41,31,0.10)] transition-colors ${
          dragOver ? 'border-[var(--color-tab-sky)]' : 'border-[var(--color-ink)]'
        }`}
        style={{ borderRadius: '4px 22px 6px 20px / 14px 5px 18px 6px' }}
      >
        {children}
      </div>
    </div>
  );
}

export function FoldPane({
  id,
  title,
  emoji,
  isFirst,
  onClose,
  children,
}: {
  id: string;
  title: string;
  emoji: string;
  isFirst: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative w-64 pt-7 px-5 pb-5 resize-x overflow-auto ${
        !isFirst ? 'border-l-2 border-dashed border-[var(--color-paper-line)]' : ''
      }`}
      style={{ minWidth: 200, minHeight: 220 }}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        title="Drag this edge onto another page to fold them together"
        className="absolute top-0 left-0 right-0 h-7 flex items-center justify-center border-b-2 border-dashed border-[var(--color-ink-soft)]/40 cursor-grab active:cursor-grabbing hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]/40"
      >
        <span className="text-[var(--color-ink-soft)]/50 text-[10px] tracking-[0.3em] leading-none select-none">
          ⠿⠿⠿
        </span>
      </div>

      <button
        onClick={onClose}
        aria-label="Close page"
        className="absolute top-0 right-0 z-20 w-7 h-7 font-sans font-bold text-[var(--color-ink-soft)] hover:text-red-500 hover:bg-[var(--color-paper-deep)] text-base leading-none flex items-center justify-center transition-colors"
      >
        ×
      </button>
      <h2 className="font-sans font-extrabold text-2xl text-[var(--color-ink)] mb-3 flex items-center gap-2">
        <span>{emoji}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}
