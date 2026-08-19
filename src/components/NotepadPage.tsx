import type { ReactNode } from 'react';
import SpiralRings from './SpiralRings';

export default function NotepadPage({
  title,
  emoji,
  rotate = 0,
  onClose,
  children,
  className = '',
  ringCount = 8,
}: {
  title?: string;
  emoji?: string;
  rotate?: number;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  ringCount?: number;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <SpiralRings count={ringCount} />
      <div
        className={`relative bg-[#fffdf8] border-[3px] border-[var(--color-ink)] pt-8 px-5 pb-5 shadow-[5px_6px_0_rgba(51,41,31,0.10)] ${className}`}
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
