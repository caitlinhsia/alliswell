import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import SpiralRings from './SpiralRings';
import Icon, { type IconName } from './Icon';

export interface DragHandle {
  id: string;
  onDrop: (draggedId: string) => void;
}

export default function NotepadPage({
  title,
  icon,
  rotate = 0,
  onClose,
  children,
  className = '',
  ringCount = 8,
  fill = false,
  dragHandle,
  size,
  onResize,
}: {
  title?: string;
  icon?: IconName;
  rotate?: number;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  ringCount?: number;
  fill?: boolean;
  dragHandle?: DragHandle;
  size?: { w: number; h: number };
  onResize?: (size: { w: number; h: number }) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const resizeRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  function onResizeDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = boxRef.current?.getBoundingClientRect();
    resizeRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: size?.w ?? rect?.width ?? 288,
      h: size?.h ?? rect?.height ?? 320,
    };
  }

  function onResizeMove(e: React.PointerEvent) {
    const r = resizeRef.current;
    if (!r || !onResize) return;
    onResize({
      w: Math.max(200, r.w + (e.clientX - r.x)),
      h: Math.max(180, r.h + (e.clientY - r.y)),
    });
  }

  function onResizeUp() {
    resizeRef.current = null;
  }

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
        } ${fill ? 'w-full h-full flex flex-col overflow-hidden lined-paper' : ''} ${
          onResize ? 'overflow-hidden flex flex-col' : ''
        } ${className}`}
        ref={boxRef}
        style={{
          borderRadius: '4px 22px 6px 20px / 14px 5px 18px 6px',
          ...(onResize ? { width: size?.w ?? 288, height: size?.h ?? 320 } : {}),
        }}
      >
        {/* perforation: the tear-off strip sits flush under the rings */}
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
          title={dragHandle ? 'Drag this edge onto another page to fold them together' : undefined}
          className={`absolute top-0 left-0 right-0 h-7 flex items-center justify-center border-b-2 border-dashed border-[var(--color-ink-soft)]/40 ${
            dragHandle
              ? 'cursor-grab active:cursor-grabbing hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]/40'
              : ''
          }`}
        >
          {dragHandle && (
            <span className="text-[var(--color-ink-soft)]/50 text-[10px] tracking-[0.3em] leading-none select-none">
              ⠿⠿⠿
            </span>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close page"
            className="absolute top-0 right-0 z-20 w-7 h-7 font-sans font-bold text-[var(--color-ink-soft)] hover:text-red-500 hover:bg-[var(--color-paper-deep)] text-base leading-none flex items-center justify-center transition-colors"
          >
            ×
          </button>
        )}

        {onResize && (
          <span
            onPointerDown={onResizeDown}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            onPointerCancel={onResizeUp}
            title="Drag to resize"
            className="absolute bottom-0 right-0 z-30 w-5 h-5 cursor-nwse-resize touch-none flex items-end justify-end p-[3px]"
          >
            <span className="w-2.5 h-2.5 border-b-2 border-r-2 border-[var(--color-ink-soft)]/50 rounded-br-sm" />
          </span>
        )}
        {title && (
          <h2 className="font-sans font-semibold tracking-tight text-2xl text-[var(--color-ink)] mb-3 flex items-center gap-2">
            {icon && <Icon name={icon} size={19} className="text-[var(--color-ink-soft)]" />}
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
