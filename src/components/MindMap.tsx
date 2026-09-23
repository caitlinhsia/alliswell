import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';
import ColorPicker from './ColorPicker';
import StickyLayer from './StickyLayer';
import type { MindMapNode } from '../types';

const DEFAULT_W = 150;
const DEFAULT_H = 46;

export default function MindMap() {
  const nodes = useAppStore((s) => s.mindMapNodes);
  const addNode = useAppStore((s) => s.addMindMapNode);
  const updateNode = useAppStore((s) => s.updateMindMapNode);
  const removeNode = useAppStore((s) => s.removeMindMapNode);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const journalEntries = useAppStore((s) => s.journalEntries);
  const stickyNotes = useAppStore((s) => s.stickyNotes);
  const todos = useAppStore((s) => s.todos);
  const writeNoteHtml = useAppStore((s) => s.writeNoteHtml);

  // everything already written elsewhere in the notebook, offered for reuse here
  const library = useMemo(() => {
    const trim = (s: string, n = 70) =>
      s.replace(/\s+/g, ' ').trim().slice(0, n) + (s.trim().length > n ? '…' : '');

    const groups: { label: string; items: string[] }[] = [];

    const notes = stickyNotes.map((n) => n.text).filter((t) => t.trim());
    if (notes.length) groups.push({ label: 'sticky notes', items: notes.map((t) => trim(t)) });

    const open = todos.filter((t) => !t.done).map((t) => t.text);
    if (open.length) groups.push({ label: 'to-dos', items: open.map((t) => trim(t)) });

    const entries = [...journalEntries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
      .map((e) => trim(e.text))
      .filter(Boolean);
    if (entries.length) groups.push({ label: 'journal', items: entries });

    const lines = writeNoteHtml
      .replace(/<(li|div|p|br)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 1)
      .slice(0, 10);
    if (lines.length) groups.push({ label: 'notes page', items: lines.map((l) => trim(l)) });

    return groups;
  }, [stickyNotes, todos, journalEntries, writeNoteHtml]);

  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const dragNodeRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    moved: boolean;
  } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; w: number; h: number } | null>(
    null
  );

  const root = nodes.find((n) => n.parentId === null);

  // Delete / Backspace removes the selected bubble (never while typing in a field)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing || !selectedId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeNode(selectedId);
        setSelectedId(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const parent = nodes.find((n) => n.id === selectedId);
        if (parent) addChild(parent);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, nodes, removeNode]);

  function startRoot() {
    const id = addNode(null, 'main idea', 0, 0, NOTE_COLOR_LIST[0]);
    setSelectedId(id);
    setEditingId(id);
    setEditText('main idea');
  }

  function addChild(parent: MindMapNode) {
    const siblings = nodes.filter((n) => n.parentId === parent.id).length;
    const angle = (siblings * 0.9 + Math.random() * 0.4) % (Math.PI * 2);
    const dist = 165 + siblings * 8;
    const color = NOTE_COLOR_LIST[nodes.length % NOTE_COLOR_LIST.length];
    const id = addNode(
      parent.id,
      'idea',
      parent.x + Math.cos(angle) * dist,
      parent.y + Math.sin(angle) * dist,
      color
    );
    setSelectedId(id);
    setEditingId(id);
    setEditText('idea');
  }

  /** Drop a line of existing writing onto the canvas as its own bubble. */
  function pasteFromLibrary(text: string) {
    const parent = nodes.find((n) => n.id === selectedId) ?? root;
    const color = NOTE_COLOR_LIST[nodes.length % NOTE_COLOR_LIST.length];
    if (parent) {
      const siblings = nodes.filter((n) => n.parentId === parent.id).length;
      const angle = (siblings * 0.9 + 0.4) % (Math.PI * 2);
      const dist = 175 + siblings * 8;
      const id = addNode(
        parent.id,
        text,
        parent.x + Math.cos(angle) * dist,
        parent.y + Math.sin(angle) * dist,
        color
      );
      setSelectedId(id);
    } else {
      setSelectedId(addNode(null, text, 0, 0, color));
    }
  }

  function handleBgPointerDown(e: React.PointerEvent) {
    // Don't pan (or capture the pointer) when the press landed on an overlaid
    // control — capturing here would swallow that control's click.
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    setSelectedId(null);
  }

  function handleNodePointerDown(e: React.PointerEvent, n: MindMapNode) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedId(n.id);
    dragNodeRef.current = {
      id: n.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeX: n.x,
      nodeY: n.y,
      moved: false,
    };
  }

  function handleResizePointerDown(e: React.PointerEvent, n: MindMapNode) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = {
      id: n.id,
      startX: e.clientX,
      startY: e.clientY,
      w: n.w ?? DEFAULT_W,
      h: n.h ?? DEFAULT_H,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (resizeRef.current) {
      const r = resizeRef.current;
      updateNode(r.id, {
        w: Math.max(90, r.w + (e.clientX - r.startX) / zoom),
        h: Math.max(38, r.h + (e.clientY - r.startY) / zoom),
      });
      return;
    }
    if (dragNodeRef.current) {
      const d = dragNodeRef.current;
      d.moved = true;
      updateNode(d.id, {
        x: d.nodeX + (e.clientX - d.startX) / zoom,
        y: d.nodeY + (e.clientY - d.startY) / zoom,
      });
      return;
    }
    if (panRef.current) {
      const p = panRef.current;
      setPan({ x: p.panX + (e.clientX - p.startX), y: p.panY + (e.clientY - p.startY) });
    }
  }

  function handlePointerUp() {
    dragNodeRef.current = null;
    panRef.current = null;
    resizeRef.current = null;
  }

  function commitEdit(id: string) {
    if (editText.trim()) updateNode(id, { text: editText.trim() });
    setEditingId(null);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 -mx-5 -mb-5">
      <div
        onPointerDown={handleBgPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative flex-1 overflow-hidden bg-[var(--color-paper-deep)] paper-texture cursor-grab active:cursor-grabbing touch-none"
      >
        {!root ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={startRoot}
              onPointerDown={(e) => e.stopPropagation()}
              className="font-note text-sm px-4 py-2 rounded-full border border-dashed border-[var(--color-ink-soft)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
            >
              + start a mind map
            </button>
          </div>
        ) : (
          <div
            className="absolute left-1/2 top-1/2"
            style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px)` }}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
              <svg
                width="1"
                height="1"
                style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
              >
                {nodes
                  .filter((n) => n.parentId)
                  .map((n) => {
                    const parent = nodes.find((p) => p.id === n.parentId);
                    if (!parent) return null;
                    return (
                      <line
                        key={n.id}
                        x1={parent.x}
                        y1={parent.y}
                        x2={n.x}
                        y2={n.y}
                        stroke="var(--color-ink-soft)"
                        strokeWidth={2}
                        strokeOpacity={0.5}
                      />
                    );
                  })}
              </svg>

              {nodes.map((n) => {
                const isSelected = selectedId === n.id;
                const isRoot = n.parentId === null;
                return (
                  <div
                    key={n.id}
                    className="absolute select-none"
                    style={{
                      left: n.x,
                      top: n.y,
                      width: n.w ?? DEFAULT_W,
                      height: n.h ?? DEFAULT_H,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onPointerDown={(e) => handleNodePointerDown(e, n)}
                  >
                    <div
                      className={`w-full h-full flex items-center gap-1.5 rounded-sm shadow px-2.5 overflow-hidden ${
                        isSelected ? 'ring-2 ring-offset-1 ring-[var(--color-ink)]' : ''
                      } ${isRoot ? 'border-2 font-bold' : 'border'}`}
                      style={{
                        background: `color-mix(in srgb, ${NOTE_COLORS[n.color]} var(--sticky-mix), var(--color-paper))`,
                        borderColor: 'var(--color-ink)',
                      }}
                    >
                      {editingId === n.id ? (
                        <input
                          autoFocus
                          onFocus={(e) => e.currentTarget.select()}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onBlur={() => commitEdit(n.id)}
                          onPointerDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(n.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="flex-1 min-w-0 bg-transparent outline-none border-b border-dashed border-[var(--color-ink-soft)] font-note text-sm"
                        />
                      ) : (
                        <span
                          onClick={() => {
                            if (dragNodeRef.current?.moved) return;
                            setEditingId(n.id);
                            setEditText(n.text);
                          }}
                          title="Click to rename"
                          className={`flex-1 min-w-0 truncate cursor-text font-note ${
                            isRoot ? 'text-base' : 'text-sm'
                          }`}
                        >
                          {n.text}
                        </span>
                      )}

                      {isSelected && (
                        <span className="flex items-center gap-1 shrink-0">
                          <ColorPicker
                            size="sm"
                            value={n.color}
                            onChange={(c) => updateNode(n.id, { color: c })}
                            label="Bubble color"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addChild(n);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Add connected idea (Enter)"
                            className="w-5 h-5 rounded-full border border-[var(--color-ink)]/30 text-xs leading-none flex items-center justify-center hover:bg-[var(--color-paper-deep)]"
                          >
                            +
                          </button>
                          {!isRoot && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNode(n.id);
                                setSelectedId(null);
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                              title="Delete (Del)"
                              className="w-5 h-5 rounded-full text-xs leading-none flex items-center justify-center hover:text-red-600 hover:bg-[var(--color-paper-deep)]"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span
                        onPointerDown={(e) => handleResizePointerDown(e, n)}
                        title="Drag to resize"
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-sm bg-[var(--color-paper)] border-b-2 border-r-2 border-[var(--color-ink)]/50 cursor-nwse-resize"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {root && (
          <div data-no-pan className="absolute top-3 right-3 z-30">
            <button
              onClick={() => setLibraryOpen((o) => !o)}
              className="font-note text-xs px-3 py-1.5 rounded-full bg-[var(--color-paper)] border border-[var(--color-paper-line)] shadow-sm hover:border-[var(--color-ink-soft)] transition-colors"
            >
              {libraryOpen ? 'close notes' : 'previous notes'}
            </button>

            {libraryOpen && (
              <div className="absolute right-0 top-10 w-72 max-h-[320px] overflow-y-auto bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-sm shadow-xl p-2">
                <p className="font-note text-[11px] text-[var(--color-ink-soft)] px-1.5 pb-1.5">
                  {selectedId
                    ? 'click one to branch it off the selected bubble'
                    : 'click one to drop it on the canvas'}
                </p>
                {library.length === 0 ? (
                  <p className="font-note text-xs text-[var(--color-ink-soft)] px-1.5 py-2">
                    Nothing written elsewhere yet — journal entries, sticky notes and to-dos show up
                    here.
                  </p>
                ) : (
                  library.map((group) => (
                    <div key={group.label} className="mb-2 last:mb-0">
                      <p className="font-note text-[10px] uppercase tracking-wide text-[var(--color-ink-soft)]/70 px-1.5 mb-0.5">
                        {group.label}
                      </p>
                      {group.items.map((entry, i) => (
                        <button
                          key={group.label + i}
                          onClick={() => pasteFromLibrary(entry)}
                          className="w-full text-left font-note text-xs px-1.5 py-1.5 rounded-sm hover:bg-[var(--color-paper-deep)] truncate"
                          title={entry}
                        >
                          {entry}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <StickyLayer page="mindmap" />

        <div
          data-no-pan
          className="absolute bottom-3 right-16 flex flex-col gap-1 bg-[var(--color-paper)]/90 rounded-sm border border-[var(--color-paper-line)] p-1 z-30"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))}
            className="w-8 h-8 rounded-sm hover:bg-[var(--color-paper-deep)] font-note text-lg leading-none flex items-center justify-center"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="font-note text-[10px] text-[var(--color-ink-soft)] leading-none py-1"
            title="Reset view"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)))}
            className="w-8 h-8 rounded-sm hover:bg-[var(--color-paper-deep)] font-note text-lg leading-none flex items-center justify-center"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        <p className="absolute top-3 left-3 font-note text-xs text-[var(--color-ink-soft)] bg-[var(--color-paper)]/80 px-2 py-1 rounded-full pointer-events-none">
          click a bubble to select · Enter adds a branch · Del removes it · drag the corner to resize
        </p>
      </div>
    </div>
  );
}
