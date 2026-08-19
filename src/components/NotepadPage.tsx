import { useState } from 'react';
import type { ReactNode } from 'react';
import SpiralRings from './SpiralRings';

export interface DragHandle {
  id: string;
  onDrop: (draggedId: string) => void;
}

export default function NotepadPage({
  title,
  emoji,
  rotate = 0,
  onClose,
  children,
  className = '',
  ringCount = 8,
  fill = false,
  dragHandle,
}: {
  title?: string;
  emoji?: string;
  rotate?: number;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  ringCount?: number;
  fill?: boolean;
  dragHandle?: DragHandle;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`relative ${fill ? 'w-full h-full' : 'shrink-0'}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <SpiralRings count={ringCount} />
      <div
        onDragOver={
          dragHandle
            ? (e) => {
                e.preventDefault();
                setDragOver(true);
              }
            : undefined
        }
        onDragLeave={dragHandle ? () => setDragOver(false) : undefined}
        onDrop={
          dragHandle
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
                const draggedId = e.dataTransfer.getData('text/plain');
                if (draggedId && draggedId !== dragHandle.id) dragHandle.onDrop(draggedId);
              }
            : undefined
        }
        className={`relative bg-[#fffdf8] border-[3px] pt-7 px-5 pb-5 shadow-[5px_6px_0_rgba(51,41,31,0.10)] transition-colors ${
          dragOver ? 'border-[var(--color-tab-sky)]' : 'border-[var(--color-ink)]'
        } ${fill ? 'w-full h-full flex flex-col' : ''} ${className}`}
        style={{ borderRadius: '4px 22px 6px 20px / 14px 5px 18px 6px' }}
      >
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close page"
            className="absolute top-2 right-3 font-sans font-bold text-[var(--color-ink-soft)] hover:text-red-500 text-lg leading-none"
          >
            ×
          </button>
        )}
        <div
          draggable={!!dragHandle}
          onDragStart={
            dragHandle
              ? (e) => {
                  e.dataTransfer.setData('text/plain', dragHandle.id);
                  e.dataTransfer.effectAllowed = 'move';
                }
              : undefined
          }
          className={`-mx-5 mb-4 py-1.5 border-b-2 border-dotted border-[var(--color-ink-soft)]/40 ${
            dragHandle ? 'cursor-grab active:cursor-grabbing hover:border-[var(--color-ink)]' : ''
          }`}
        />
        {title && (
          <h2 className="font-sans font-extrabold text-2xl text-[var(--color-ink)] mb-3 flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
