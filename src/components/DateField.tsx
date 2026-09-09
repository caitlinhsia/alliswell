import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Date input styled to match the notebook. Replaces <input type="date">, whose
 * native popup uses the OS font and colours and looks foreign here.
 */
export default function DateField({
  value,
  onChange,
  placeholder = 'pick a date',
  className = '',
  allowClear = true,
  compact = false,
}: {
  value?: string; // yyyy-MM-dd
  onChange: (v: string | undefined) => void;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => (value ? parseISO(value) : new Date()));
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const POP_W = 236;
  const POP_H = 300;

  // The popup is portalled to <body> so page-level overflow can't clip it;
  // position it under the field, nudged back on screen near the edges.
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left), window.innerWidth - POP_W - 8);
    const below = r.bottom + 6;
    const top = below + POP_H > window.innerHeight ? Math.max(8, r.top - POP_H - 6) : below;
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (open && value) setCursor(parseISO(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = value ? parseISO(value) : undefined;
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });

  return (
    <span ref={wrapRef} className="relative inline-flex" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          className ||
          `font-note border border-[var(--color-paper-line)] rounded-sm bg-[var(--color-paper)] text-left hover:border-[var(--color-ink-soft)] transition-colors ${
            compact ? 'text-xs px-2 py-1' : 'px-3 py-2'
          } ${!selected ? 'text-[var(--color-ink-soft)]/70' : ''}`
        }
      >
        {selected ? format(selected, compact ? 'MMM d' : 'MMM d, yyyy') : placeholder}
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: POP_W }}
          className="z-[60] bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-sm shadow-xl p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setCursor((c) => addMonths(c, -1))}
              aria-label="Previous month"
              className="w-7 h-7 rounded-sm hover:bg-[var(--color-paper-deep)] flex items-center justify-center text-[var(--color-ink-soft)]"
            >
              ‹
            </button>
            <span className="font-hand text-lg">{format(cursor, 'MMMM yyyy')}</span>
            <button
              type="button"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              aria-label="Next month"
              className="w-7 h-7 rounded-sm hover:bg-[var(--color-paper-deep)] flex items-center justify-center text-[var(--color-ink-soft)]"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DOW.map((d, i) => (
              <span
                key={i}
                className="font-note text-[10px] text-[var(--color-ink-soft)]/70 text-center py-0.5"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d) => {
              const isSel = selected && isSameDay(d, selected);
              const inMonth = isSameMonth(d, cursor);
              const isToday = isSameDay(d, new Date());
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(format(d, 'yyyy-MM-dd'));
                    setOpen(false);
                  }}
                  className={`font-note text-xs h-7 rounded-sm transition-colors ${
                    isSel
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)]'
                      : inMonth
                      ? 'hover:bg-[var(--color-paper-deep)]'
                      : 'text-[var(--color-ink-soft)]/35 hover:bg-[var(--color-paper-deep)]/50'
                  } ${isToday && !isSel ? 'ring-1 ring-[var(--color-ink-soft)]/40' : ''}`}
                >
                  {format(d, 'd')}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-paper-line)]">
            {allowClear ? (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
                className="font-note text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                clear
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => {
                onChange(format(new Date(), 'yyyy-MM-dd'));
                setOpen(false);
              }}
              className="font-note text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              today
            </button>
          </div>
        </div>,
        document.body
      )}
    </span>
  );
}
