import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import StickyNoteItem from '../components/StickyNoteItem';
import MindMap from '../components/MindMap';
import Icon from '../components/Icon';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';

type Tab = 'write' | 'mindmap';

export default function WriteContent() {
  const [tab, setTab] = useState<Tab>('write');
  const writeNoteHtml = useAppStore((s) => s.writeNoteHtml);
  const setWriteNoteHtml = useAppStore((s) => s.setWriteNoteHtml);
  const stickyNotes = useAppStore((s) => s.stickyNotes);
  const addStickyNote = useAppStore((s) => s.addStickyNote);
  const updateStickyNote = useAppStore((s) => s.updateStickyNote);
  const removeStickyNote = useAppStore((s) => s.removeStickyNote);
  const bringStickyNoteToFront = useAppStore((s) => s.bringStickyNoteToFront);
  const writeStickyNotes = stickyNotes.filter((n) => n.page === 'write');

  const editorRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const saveTimeout = useRef<number | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== writeNoteHtml) {
      editorRef.current.innerHTML = writeNoteHtml;
    }
    // only sync from store on mount, not on every store update (this editor owns its DOM while active)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scheduleSave() {
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      if (editorRef.current) setWriteNoteHtml(editorRef.current.innerHTML);
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
    const x = board ? board.scrollLeft + 80 + Math.random() * 220 : 80 + Math.random() * 220;
    const y = board ? board.scrollTop + 80 + Math.random() * 220 : 80 + Math.random() * 220;
    addStickyNote('write', color, x, y);
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0 mb-3">
        <div className="inline-flex rounded-full border border-[var(--color-paper-line)] p-1">
          <button
            onClick={() => setTab('write')}
            className={`font-note text-sm px-3 py-1 rounded-full transition-colors ${
              tab === 'write' ? 'bg-[var(--color-tab-lavender)] text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'
            }`}
          >
            <Icon name="pen" /> write
          </button>
          <button
            onClick={() => setTab('mindmap')}
            className={`font-note text-sm px-3 py-1 rounded-full transition-colors ${
              tab === 'mindmap' ? 'bg-[var(--color-tab-lavender)] text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'
            }`}
          >
            <Icon name="mindmap" /> mind map
          </button>
        </div>
        {tab === 'write' && (
          <span className="font-note text-xs text-[var(--color-ink-soft)]">{justSaved ? 'saved' : ''}</span>
        )}
      </div>

      {tab === 'write' ? (
        <>
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
            <span className="font-note text-xs text-[var(--color-ink-soft)] mr-1">sticky:</span>
            {NOTE_COLOR_LIST.map((c) => (
              <button
                key={c}
                onClick={() => handleAddSticky(c)}
                title="Add sticky note"
                aria-label={`Add ${c} sticky note`}
                className="w-6 h-6 rounded-full border border-[var(--color-paper-line)] hover:scale-110 transition-transform"
                style={{ background: NOTE_COLORS[c] }}
              />
            ))}
          </div>

          <div ref={boardRef} className="relative flex-1 overflow-auto -mx-5 -mb-5">
            <div className="relative min-h-[900px] w-full lined-paper">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={scheduleSave}
                onBlur={scheduleSave}
                data-placeholder="Start writing... select text and use the toolbar above to format it"
                className="font-note text-base outline-none px-6 pt-4 pb-40 leading-[31px] min-h-[900px]"
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
        </>
      ) : (
        <MindMap />
      )}
    </>
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
      className={`w-8 h-8 rounded-sm border border-[var(--color-paper-line)] hover:bg-[var(--color-paper-deep)] font-note text-sm flex items-center justify-center shrink-0 ${className}`}
    >
      {label}
    </button>
  );
}
