import { useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';

export default function MindMap() {
  const nodes = useAppStore((s) => s.mindMapNodes);
  const addNode = useAppStore((s) => s.addMindMapNode);
  const updateNode = useAppStore((s) => s.updateMindMapNode);
  const removeNode = useAppStore((s) => s.removeMindMapNode);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const dragNodeRef = useRef<{ id: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(
    null
  );

  const root = nodes.find((n) => n.parentId === null);

  function ensureRoot() {
    addNode(null, 'main idea', 0, 0, NOTE_COLOR_LIST[0]);
  }

  function addChild(parent: (typeof nodes)[number]) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 30;
    const color = NOTE_COLOR_LIST[nodes.length % NOTE_COLOR_LIST.length];
    const id = addNode(parent.id, 'idea', parent.x + Math.cos(angle) * dist, parent.y + Math.sin(angle) * dist, color);
    setEditingId(id);
    setEditText('idea');
  }

  function handleBgPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    panRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }

  function handleNodePointerDown(e: React.PointerEvent, n: (typeof nodes)[number]) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragNodeRef.current = { id: n.id, startX: e.clientX, startY: e.clientY, nodeX: n.x, nodeY: n.y };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (dragNodeRef.current) {
      const d = dragNodeRef.current;
      updateNode(d.id, {
        x: d.nodeX + (e.clientX - d.startX) / zoom,
        y: d.nodeY + (e.clientY - d.startY) / zoom,
      });
    } else if (panRef.current) {
      const p = panRef.current;
      setPan({ x: p.panX + (e.clientX - p.startX), y: p.panY + (e.clientY - p.startY) });
    }
  }

  function handlePointerUp() {
    dragNodeRef.current = null;
    panRef.current = null;
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
              onClick={ensureRoot}
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
              <svg width="1" height="1" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
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
              {nodes.map((n) => (
                <div
                  key={n.id}
                  className="absolute select-none"
                  style={{ left: n.x, top: n.y, transform: 'translate(-50%, -50%)' }}
                  onPointerDown={(e) => handleNodePointerDown(e, n)}
                >
                  <div
                    className={`flex items-center gap-1.5 rounded-xl border-2 shadow px-3 py-2 font-note whitespace-nowrap ${
                      n.parentId === null ? 'text-base font-bold' : 'text-sm'
                    }`}
                    style={{ background: NOTE_COLORS[n.color], borderColor: 'var(--color-ink)' }}
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
                        className="bg-transparent outline-none border-b border-dashed border-[var(--color-ink-soft)] min-w-[70px]"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => {
                          setEditingId(n.id);
                          setEditText(n.text);
                        }}
                        className="cursor-text"
                      >
                        {n.text}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addChild(n);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      title="Add connected idea"
                      className="w-5 h-5 rounded-full border border-[var(--color-ink)]/30 text-xs leading-none flex items-center justify-center hover:bg-white/50 shrink-0"
                    >
                      +
                    </button>
                    {n.parentId !== null && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNode(n.id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        title="Delete"
                        className="w-5 h-5 rounded-full text-xs leading-none flex items-center justify-center hover:text-red-500 hover:bg-white/50 shrink-0"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="absolute bottom-3 right-3 flex flex-col gap-1 bg-[var(--color-paper)]/90 rounded-xl border border-[var(--color-paper-line)] p-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))}
            className="w-8 h-8 rounded-lg hover:bg-[var(--color-paper-deep)] font-note text-lg leading-none flex items-center justify-center"
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
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)))}
            className="w-8 h-8 rounded-lg hover:bg-[var(--color-paper-deep)] font-note text-lg leading-none flex items-center justify-center"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        <p className="absolute top-3 left-3 font-note text-xs text-[var(--color-ink-soft)] bg-[var(--color-paper)]/80 px-2 py-1 rounded-full">
          drag the board to pan · double-click a bubble to rename
        </p>
      </div>
    </div>
  );
}
