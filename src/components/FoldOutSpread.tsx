import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import SpiralRings from './SpiralRings';
import Icon, { type IconName } from './Icon';

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
  icon,
  isFirst,
  onClose,
  size,
  onResize,
  children,
}: {
  id: string;
  title: string;
  icon: IconName;
  isFirst: boolean;
  onClose: () => void;
  size?: { w: number; h: number };
  onResize?: (size: { w: number; h: number }) => void;
  children: ReactNode;
}) {
  const resizeRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  function onResizeDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = { x: e.clientX, y: e.clientY, w: size?.w ?? 256, h: size?.h ?? 320 };
  }
  function onResizeMove(e: React.PointerEvent) {
    const r = resizeRef.current;
    if (!r || !onResize) return;
    onResize({
      w: Math.max(190, r.w + (e.clientX - r.x)),
      h: Math.max(180, r.h + (e.clientY - r.y)),
    });
  }
  function onResizeUp() {
    resizeRef.current = null;
  }

  return (
    <div
      className={`relative pt-7 px-5 pb-5 overflow-hidden flex flex-col ${
        !isFirst ? 'border-l-2 border-dashed border-[var(--color-paper-line)]' : ''
      }`}
      style={{ width: size?.w ?? 256, height: size?.h ?? 320 }}
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
      <h2 className="font-sans font-semibold tracking-tight text-2xl text-[var(--color-ink)] mb-3 flex items-center gap-2">
        <Icon name={icon} size={19} className="text-[var(--color-ink-soft)]" />
        {title}
      </h2>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>

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
    </div>
  );
}
