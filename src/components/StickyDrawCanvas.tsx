import { useEffect, useRef, useState } from 'react';

type Tool = 'pen' | 'rect' | 'circle' | 'line';

const COLORS = ['#33291f', '#a8524c', '#4c72a0', '#4c7a52'];
const W = 208;
const H = 132;

export default function StickyDrawCanvas({
  value,
  onChange,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const snapshotRef = useRef<ImageData | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, W, H);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawingRef.current = true;
    const p = pos(e);
    startRef.current = p;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    } else {
      snapshotRef.current = ctx.getImageData(0, 0, W, H);
    }
  }

  function handleMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !startRef.current) return;
    const p = pos(e);
    if (tool === 'pen') {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      return;
    }
    if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
    const { x: sx, y: sy } = startRef.current;
    ctx.beginPath();
    if (tool === 'line') {
      ctx.moveTo(sx, sy);
      ctx.lineTo(p.x, p.y);
    } else if (tool === 'rect') {
      ctx.strokeRect(sx, sy, p.x - sx, p.y - sy);
    } else if (tool === 'circle') {
      const rx = Math.abs(p.x - sx) / 2;
      const ry = Math.abs(p.y - sy) / 2;
      ctx.ellipse((sx + p.x) / 2, (sy + p.y) / 2, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.stroke();
  }

  function handleUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    startRef.current = null;
    snapshotRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    onChange('');
  }

  return (
    <div className="px-2 pb-2 flex-1 flex flex-col">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
        className="bg-[var(--color-paper)]/60 rounded-md touch-none cursor-crosshair w-full"
        style={{ height: H }}
      />
      <div className="flex items-center justify-between mt-1.5 gap-1">
        <div className="flex gap-0.5">
          {(['pen', 'line', 'rect', 'circle'] as Tool[]).map((t) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              aria-label={t}
              title={t}
              className={`w-6 h-6 rounded text-xs flex items-center justify-center border ${
                tool === t
                  ? 'border-[var(--color-ink)] bg-[var(--color-paper-deep)]'
                  : 'border-transparent'
              }`}
            >
              {t === 'pen' ? '✎' : t === 'line' ? '╱' : t === 'rect' ? '▭' : '◯'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 items-center">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`color ${c}`}
              className={`w-4 h-4 rounded-full border ${color === c ? 'border-[var(--color-ink)]' : 'border-black/10'}`}
              style={{ background: c }}
            />
          ))}
          <button
            onClick={clear}
            className="text-[10px] font-note text-[var(--color-ink-soft)] hover:text-red-500 px-1.5 py-1 -m-1 ml-0.5"
          >
            clear
          </button>
        </div>
      </div>
    </div>
  );
}
