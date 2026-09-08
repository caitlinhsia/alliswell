import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import SpiralRings from './SpiralRings';
import Icon, { type IconName } from './Icon';

export interface DragHandle {
  id: string;
  onDrop: (draggedId: string) => void;
}

/**
 * Ragged top edge, as if the sheet was ripped off the pad. Teeth are uneven —
 * a perfectly regular zigzag reads as a graphic, not as torn paper — but the
 * jitter is derived from the index so the shape is stable between renders.
 */
export function tornClip(teeth = 22, depth = 2.6) {
  const jitter = (i: number) => {
    const n = Math.sin(i * 12.9898) * 43758.5453;
    return n - Math.floor(n); // deterministic 0..1
  };
  const pts: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    const x = ((i / teeth) * 100 + (jitter(i) - 0.5) * 1.6).toFixed(2);
    const y = i % 2 === 0 ? (jitter(i + 7) * 0.5).toFixed(2) : (depth * (0.55 + jitter(i) * 0.75)).toFixed(2);
    pts.push(`${x}% ${y}%`);
  }
  pts.push('100% 100%', '0% 100%');
  return `polygon(${pts.join(',')})`;
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
  grabHandle,
  lifted = false,
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
  grabHandle?: (e: React.PointerEvent) => void;
  lifted?: boolean;
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
      {!lifted && <SpiralRings count={ringCount} />}
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
        className={`relative bg-[var(--color-paper)] border pt-8 px-7 pb-6 transition-colors ${
          dragOver ? 'border-[var(--color-accent)]' : 'border-[var(--color-paper-line)]'
        } ${fill ? 'w-full h-full flex flex-col overflow-hidden' : ''} ${
          onResize ? 'overflow-hidden flex flex-col' : ''
        } ${className}`}
        ref={boxRef}
        style={{
          borderRadius: 3,
          ...(onResize ? { width: size?.w ?? 288, height: size?.h ?? 320 } : {}),
          ...(lifted ? { clipPath: tornClip() } : {}),
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
          onPointerDown={grabHandle}
          title={grabHandle ? 'Tear it off and move it anywhere' : undefined}
          className={`absolute top-0 left-0 right-0 h-7 flex items-center justify-center border-b touch-none ${
            lifted ? 'border-transparent' : 'border-[var(--color-paper-line)]'
          } ${
            grabHandle
              ? 'cursor-grab active:cursor-grabbing hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]/40'
              : ''
          }`}
        >
          {(grabHandle || dragHandle) && (
            <span className="font-mono text-[var(--color-ink-faint)] text-[9px] tracking-[0.35em] leading-none select-none">
              ｜｜｜
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
          <h2 className="font-display font-normal text-[1.7rem] leading-tight text-[var(--color-ink)] mb-4 flex items-center gap-2.5">
            {icon && <Icon name={icon} size={17} className="text-[var(--color-ink-faint)]" />}
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
