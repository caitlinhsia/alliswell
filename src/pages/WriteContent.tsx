import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import StickyNoteItem from '../components/StickyNoteItem';
import MindMap from '../components/MindMap';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';
import type { Note } from '../types';

type Tab = 'write' | 'mindmap';

/** First line of the body, for the list preview and the fallback title. */
function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function WriteContent() {
  const [tab, setTab] = useState<Tab>('write');
  const notes = useAppStore((s) => s.notes);
  const activeNoteId = useAppStore((s) => s.activeNoteId);
  const addNote = useAppStore((s) => s.addNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const removeNote = useAppStore((s) => s.removeNote);
  const setActiveNote = useAppStore((s) => s.setActiveNote);

  const stickyNotes = useAppStore((s) => s.stickyNotes);
  const addStickyNote = useAppStore((s) => s.addStickyNote);
  const updateStickyNote = useAppStore((s) => s.updateStickyNote);
  const removeStickyNote = useAppStore((s) => s.removeStickyNote);
  const bringStickyNoteToFront = useAppStore((s) => s.bringStickyNoteToFront);
  const writeStickyNotes = stickyNotes.filter((n) => n.page === 'write');

  const [query, setQuery] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const saveTimeout = useRef<number | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const sorted = useMemo(
    () =>
      [...notes].sort(
        (a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt
      ),
    [notes]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (n) => n.title.toLowerCase().includes(q) || plainText(n.html).toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const active = notes.find((n) => n.id === activeNoteId) ?? sorted[0] ?? null;

  // the editor owns its DOM while a note is open, so only load on a note change
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = active?.html ?? '';
  }, [active?.id]);

  function scheduleSave() {
    if (!active) return;
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    const id = active.id;
    saveTimeout.current = window.setTimeout(() => {
      if (editorRef.current) updateNote(id, { html: editorRef.current.innerHTML });
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1200);
    }, 500);
  }

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    scheduleSave();
  }

  function handleAddSticky(color: (typeof NOTE_COLOR_LIST)[number]) {
    const board = boardRef.current;
    const x = board ? board.scrollLeft + 60 + Math.random() * 200 : 60;
    const y = board ? board.scrollTop + 60 + Math.random() * 200 : 60;
    addStickyNote('write', color, x, y);
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0 mb-3">
        <div className="flex items-center gap-4">
          {(['write', 'mindmap'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`label pb-1 border-b transition-colors ${
                tab === t
                  ? 'text-[var(--color-ink)] border-[var(--color-accent)]'
                  : 'text-[var(--color-ink-faint)] border-transparent hover:text-[var(--color-ink-soft)]'
              }`}
            >
              {t === 'write' ? 'Notes' : 'Mind map'}
            </button>
          ))}
        </div>
        {tab === 'write' && (
          <span className="label">{justSaved ? 'saved' : ''}</span>
        )}
      </div>

      {tab === 'mindmap' ? (
        <MindMap />
      ) : (
        <div className="flex-1 min-h-0 flex gap-0">
          {/* the list of saved notes */}
          <aside className="w-[210px] shrink-0 hidden md:flex flex-col border-r border-[var(--color-paper-line)] pr-3 mr-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="flex-1 min-w-0 bg-transparent text-[0.8rem] border-b border-[var(--color-paper-line)] py-1 outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-ink-faint)] transition-colors"
              />
              <button
                onClick={() => addNote()}
                title="New note"
                className="w-6 h-6 rounded-full border border-[var(--color-paper-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shrink-0"
              >
                +
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto -mr-1 pr-1">
              {filtered.length === 0 ? (
                <button
                  onClick={() => addNote()}
                  className="label py-3 hover:text-[var(--color-accent)] transition-colors"
                >
                  + write your first note
                </button>
              ) : (
                <ul>
                  {filtered.map((n) => (
                    <NoteRow
                      key={n.id}
                      note={n}
                      active={n.id === active?.id}
                      onOpen={() => setActiveNote(n.id)}
                      onPin={() => updateNote(n.id, { pinned: !n.pinned })}
                      onRemove={() => removeNote(n.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* the open note */}
          {active ? (
            <div className="flex-1 min-w-0 flex flex-col">
              <input
                value={active.title}
                onChange={(e) => updateNote(active.id, { title: e.target.value })}
                placeholder="Untitled"
                className="shrink-0 font-display text-xl bg-transparent outline-none mb-1 placeholder:text-[var(--color-ink-faint)]"
              />
              <p className="shrink-0 label mb-2">
                {format(new Date(active.updatedAt), "d MMM yyyy 'at' HH:mm")}
              </p>

              <div className="flex items-center gap-1 flex-wrap mb-2 shrink-0">
                <ToolBtn label="B" title="Bold" onClick={() => exec('bold')} className="font-bold" />
                <ToolBtn label="I" title="Italic" onClick={() => exec('italic')} className="italic" />
                <ToolBtn label="U" title="Underline" onClick={() => exec('underline')} className="underline" />
                <ToolBtn
                  label="H"
                  title="Highlight"
                  onClick={() => exec('hiliteColor', 'var(--color-note-ochre)')}
                  className="bg-[var(--color-note-ochre)]/45"
                />
                <ToolBtn label="•⁠—" title="Bullet list" onClick={() => exec('insertUnorderedList')} />
                <span className="w-px h-5 bg-[var(--color-paper-line)] mx-1" />
                <span className="label mr-1">sticky</span>
                {NOTE_COLOR_LIST.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    onClick={() => handleAddSticky(c)}
                    title="Add sticky note"
                    aria-label={`Add ${c} sticky note`}
                    className="w-5 h-5 rounded-full border border-[var(--color-paper-line)] hover:scale-110 transition-transform"
                    style={{ background: NOTE_COLORS[c] }}
                  />
                ))}
              </div>

              <div ref={boardRef} className="relative flex-1 min-h-0 overflow-auto">
                <div className="relative min-h-[800px] w-full lined-paper">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={scheduleSave}
                    onBlur={scheduleSave}
                    data-placeholder="Start writing…"
                    className="text-[0.95rem] outline-none px-1 pt-1 pb-40 leading-[31px] min-h-[800px]"
                  />
                  {writeStickyNotes.map((note) => (
                    <StickyNoteItem
                      key={note.id}
                      note={note}
                      onUpdate={updateStickyNote}
                      onRemove={removeStickyNote}
                      onBringToFront={bringStickyNoteToFront}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <button onClick={() => addNote()} className="btn-primary">
                Start a note
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NoteRow({
  note,
  active,
  onOpen,
  onPin,
  onRemove,
}: {
  note: Note;
  active: boolean;
  onOpen: () => void;
  onPin: () => void;
  onRemove: () => void;
}) {
  const preview = plainText(note.html);
  return (
    <li
      className={`group rounded-sm px-2 py-2 mb-0.5 cursor-pointer transition-colors ${
        active ? 'bg-[var(--color-paper-deep)]' : 'hover:bg-[var(--color-paper-deep)]/50'
      }`}
      onClick={onOpen}
    >
      <div className="flex items-baseline gap-1.5">
        <span
          className={`flex-1 min-w-0 truncate text-[0.85rem] ${
            active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'
          }`}
        >
          {note.title || preview.slice(0, 30) || 'Untitled'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          title={note.pinned ? 'Unpin' : 'Pin to the top'}
          className={`text-[0.7rem] shrink-0 transition-opacity ${
            note.pinned
              ? 'text-[var(--color-accent)]'
              : 'on-hover text-[var(--color-ink-faint)]'
          }`}
        >
          ●
        </button>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono-num text-[0.6rem] text-[var(--color-ink-faint)] shrink-0">
          {format(new Date(note.updatedAt), 'd MMM')}
        </span>
        <span className="flex-1 min-w-0 truncate text-[0.7rem] text-[var(--color-ink-faint)]">
          {preview || 'No text'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="action on-hover shrink-0"
        >
          del
        </button>
      </div>
    </li>
  );
}

function ToolBtn({
  label,
  title,
  onClick,
  className = '',
}: {
  label: string;
  title: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-sm border border-[var(--color-paper-line)] hover:bg-[var(--color-paper-deep)] text-sm flex items-center justify-center shrink-0 ${className}`}
    >
      {label}
    </button>
  );
}
