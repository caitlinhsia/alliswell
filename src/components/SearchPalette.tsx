import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { searchEverything, type Hit, type SearchPage } from '../lib/search';

/**
 * One box that looks in every page at once. The notebook gets harder to hold
 * in your head the longer you use it, so the answer to "where did I write
 * that" should not be "try each page in turn".
 */
export default function SearchPalette({
  open,
  onClose,
  onGo,
}: {
  open: boolean;
  onClose: () => void;
  onGo: (page: SearchPage, hit: Hit) => void;
}) {
  const state = useAppStore();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const hits = useMemo(() => searchEverything(state, query), [state, query]);

  useEffect(() => setCursor(0), [query]);
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // keep the highlighted row in view while arrowing through
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  function choose(hit: Hit) {
    onGo(hit.page, hit);
    onClose();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(hits.length - 1, c + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    }
    if (e.key === 'Enter' && hits[cursor]) {
      e.preventDefault();
      choose(hits[cursor]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center pt-[12vh] px-4 bg-[var(--color-ink)]/25 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-sm shadow-[0_24px_70px_-28px_rgba(38,35,29,0.6)] overflow-hidden"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder="Search the whole notebook…"
          className="w-full bg-transparent px-4 py-3.5 text-[0.95rem] outline-none border-b border-[var(--color-paper-line)] placeholder:text-[var(--color-ink-faint)]"
        />

        {query.trim().length < 2 ? (
          <p className="px-4 py-6 text-[0.8rem] text-[var(--color-ink-faint)]">
            Type at least two letters. Looks through to-dos, the schedule, notes, journal
            entries, sticky notes, mind maps and subjects.
          </p>
        ) : hits.length === 0 ? (
          <p className="px-4 py-6 text-[0.8rem] text-[var(--color-ink-faint)]">
            Nothing matches “{query.trim()}”.
          </p>
        ) : (
          <ul ref={listRef} className="max-h-[52vh] overflow-y-auto py-1">
            {hits.map((h, i) => (
              <li key={`${h.group}-${h.id}`}>
                <button
                  data-active={i === cursor}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => choose(h)}
                  className={`w-full text-left px-4 py-2 flex items-baseline gap-3 transition-colors ${
                    i === cursor ? 'bg-[var(--color-paper-deep)]' : ''
                  }`}
                >
                  <span className="label w-[4.4rem] shrink-0 whitespace-nowrap">{h.group}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[0.88rem]">{h.title}</span>
                    {h.detail && (
                      <span className="block truncate text-[0.72rem] text-[var(--color-ink-faint)]">
                        {h.detail}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--color-paper-line)]">
          <span className="label">↑↓ move</span>
          <span className="label">↵ open</span>
          <span className="label">esc close</span>
        </div>
      </div>
    </div>
  );
}
