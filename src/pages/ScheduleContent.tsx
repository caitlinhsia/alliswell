import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { todayStr } from '../lib/date';
import { NOTE_COLORS } from '../lib/colors';
import type { NoteColor, Priority, ScheduleItem } from '../types';

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'var(--color-note-rust)',
  medium: 'var(--color-note-ochre)',
  low: 'var(--color-note-sage)',
};

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_H = 52; // px per hour
const SNAP = 15; // minutes
const DEFAULT_LEN = 60;

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
};
const snap = (min: number) => Math.round(min / SNAP) * SNAP;
const yOf = (min: number) => ((min - START_HOUR * 60) / 60) * HOUR_H;

function lengthOf(item: ScheduleItem) {
  if (!item.time) return DEFAULT_LEN;
  const start = toMin(item.time);
  const end = item.endTime ? toMin(item.endTime) : start + DEFAULT_LEN;
  return Math.max(SNAP, end - start);
}

type Drag = {
  id: string;
  mode: 'move' | 'resize';
  grabMin: number; // where in the event the pointer took hold
  startMin: number;
  len: number;
  date: string;
  moved: boolean;
};

export default function ScheduleContent() {
  const schedule = useAppStore((s) => s.schedule);
  const subjects = useAppStore((s) => s.subjects);
  const addScheduleItem = useAppStore((s) => s.addScheduleItem);
  const updateScheduleItem = useAppStore((s) => s.updateScheduleItem);
  const toggleScheduleItem = useAppStore((s) => s.toggleScheduleItem);
  const removeScheduleItem = useAppStore((s) => s.removeScheduleItem);
  const todos = useAppStore((s) => s.todos);
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const updateTodo = useAppStore((s) => s.updateTodo);

  const [weekOffset, setWeekOffset] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [allDayDraft, setAllDayDraft] = useState<{ date: string; text: string } | null>(null);
  const [dropDay, setDropDay] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const weekStart = useMemo(
    () => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7),
    [weekOffset]
  );
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dayKeys = days.map((d) => format(d, 'yyyy-MM-dd'));
  const today = todayStr();

  // open on the working day rather than at 6am
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_H;
  }, []);

  const timed = schedule.filter((s) => s.time && dayKeys.includes(s.date));
  const allDay = schedule.filter((s) => !s.time && dayKeys.includes(s.date));
  // a to-do with a due date is a thing happening on a day; it belongs here too
  const dueTodos = todos.filter((t) => t.dueDate && dayKeys.includes(t.dueDate));

  /** Which day column and minute the pointer is over. */
  function pointToSlot(e: PointerEvent | React.PointerEvent) {
    const grid = gridRef.current;
    if (!grid) return null;
    const r = grid.getBoundingClientRect();
    const colW = r.width / 7;
    const col = Math.max(0, Math.min(6, Math.floor((e.clientX - r.left) / colW)));
    const min = START_HOUR * 60 + ((e.clientY - r.top) / HOUR_H) * 60;
    return { date: dayKeys[col], min };
  }

  function beginDrag(e: React.PointerEvent, item: ScheduleItem, mode: 'move' | 'resize') {
    e.preventDefault();
    e.stopPropagation();
    const slot = pointToSlot(e);
    if (!slot || !item.time) return;
    const d: Drag = {
      id: item.id,
      mode,
      grabMin: slot.min - toMin(item.time),
      startMin: toMin(item.time),
      len: lengthOf(item),
      date: item.date,
      moved: false,
    };
    dragRef.current = d;
    setDrag(d);
    setSelectedId(item.id);
  }

  // dragging is tracked on the window so the pointer can leave the grid
  useEffect(() => {
    if (!drag) return;

    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      const slot = pointToSlot(e);
      if (!d || !slot) return;
      const next: Drag =
        d.mode === 'move'
          ? {
              ...d,
              date: slot.date,
              startMin: Math.max(
                START_HOUR * 60,
                Math.min(END_HOUR * 60 - d.len, snap(slot.min - d.grabMin))
              ),
              moved: true,
            }
          : {
              ...d,
              len: Math.max(SNAP, Math.min(END_HOUR * 60 - d.startMin, snap(slot.min - d.startMin))),
              moved: true,
            };
      dragRef.current = next;
      setDrag(next);
    }

    function onUp() {
      const d = dragRef.current;
      if (d?.moved) {
        updateScheduleItem(d.id, {
          date: d.date,
          time: toHHMM(d.startMin),
          endTime: toHHMM(d.startMin + d.len),
        });
      }
      dragRef.current = null;
      setDrag(null);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id, drag?.mode]);

  /** Click an empty slot to drop an hour-long event there. */
  function createAt(e: React.PointerEvent) {
    if (drag) return;
    const slot = pointToSlot(e);
    if (!slot) return;
    const start = snap(slot.min);
    addScheduleItem('New event', slot.date, toHHMM(start), 'event', {
      endTime: toHHMM(start + DEFAULT_LEN),
    });
  }

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* week controls */}
      <div className="shrink-0 flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="keycap" aria-label="Previous week">
            ←
          </button>
          <button onClick={() => setWeekOffset(0)} className="btn">
            Today
          </button>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="keycap" aria-label="Next week">
            →
          </button>
        </div>
        <span className="font-display text-base">
          {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}
        </span>
        <span className="label hidden md:inline">drag to move · drag the edge to lengthen</span>
      </div>

      {/* day headers */}
      <div className="shrink-0 flex border-b border-[var(--color-paper-line)]">
        <div className="w-12 shrink-0" />
        {days.map((d, i) => {
          const isToday = isSameDay(d, parseISO(today));
          return (
            <div key={i} className="flex-1 min-w-0 px-1 pb-1.5 text-center">
              <div className="label">{format(d, 'EEE')}</div>
              <div
                className={`font-display text-lg leading-tight ${
                  isToday ? 'text-[var(--color-accent)]' : ''
                }`}
              >
                {format(d, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* all-day strip */}
      <div className="shrink-0 flex border-b border-[var(--color-paper-line)] min-h-[34px]">
        <div className="w-12 shrink-0 label pt-1.5 pr-1 text-right">all day</div>
        {dayKeys.map((key) => (
          <div
            key={key}
            onDragOver={(e) => {
              e.preventDefault();
              setDropDay(key);
            }}
            onDragLeave={() => setDropDay((d) => (d === key ? null : d))}
            onDrop={(e) => {
              e.preventDefault();
              setDropDay(null);
              const id = e.dataTransfer.getData('text/todo');
              if (id) updateTodo(id, { dueDate: key });
            }}
            className={`flex-1 min-w-0 border-l border-[var(--color-paper-line)]/60 p-1 space-y-1 transition-colors ${
              dropDay === key ? 'bg-[var(--color-accent)]/10' : ''
            }`}
          >
            {allDay
              .filter((s) => s.date === key)
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleScheduleItem(s.id)}
                  onDoubleClick={() => removeScheduleItem(s.id)}
                  title="Click to tick off · double-click to delete"
                  className={`block w-full text-left truncate text-[0.72rem] px-1.5 py-0.5 rounded-sm ${
                    s.done ? 'line-through text-[var(--color-ink-faint)]' : ''
                  }`}
                  style={{
                    background: `color-mix(in srgb, ${colourOf(s, subjects)} 20%, transparent)`,
                  }}
                >
                  {s.title}
                </button>
              ))}
            {dueTodos
              .filter((t) => t.dueDate === key)
              .map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/todo', t.id)}
                  title="A to-do due today · drag to another day to move it"
                  className="flex items-center gap-1.5 text-[0.72rem] cursor-grab active:cursor-grabbing"
                >
                  <button
                    onClick={() => toggleTodo(t.id)}
                    aria-label={`Complete ${t.text}`}
                    className="w-2.5 h-2.5 rounded-full shrink-0 border"
                    style={{
                      borderColor: PRIORITY_DOT[t.priority],
                      background: t.done ? PRIORITY_DOT[t.priority] : 'transparent',
                    }}
                  />
                  <span
                    className={`truncate ${
                      t.done ? 'line-through text-[var(--color-ink-faint)]' : ''
                    }`}
                  >
                    {t.text}
                  </span>
                </div>
              ))}

            {allDayDraft?.date === key ? (
              <input
                autoFocus
                value={allDayDraft.text}
                onChange={(e) => setAllDayDraft({ date: key, text: e.target.value })}
                onBlur={() => {
                  if (allDayDraft.text.trim())
                    addScheduleItem(allDayDraft.text.trim(), key, undefined, 'task');
                  setAllDayDraft(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setAllDayDraft(null);
                }}
                className="w-full bg-transparent text-[0.72rem] outline-none border-b border-[var(--color-accent)]"
              />
            ) : (
              <button
                onClick={() => setAllDayDraft({ date: key, text: '' })}
                className="w-full text-left text-[0.7rem] text-[var(--color-ink-faint)] opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                + task
              </button>
            )}
          </div>
        ))}
      </div>

      {/* the hour grid */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex" style={{ height: (END_HOUR - START_HOUR) * HOUR_H }}>
          <div className="w-12 shrink-0 relative">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-1 label -translate-y-1/2"
                style={{ top: yOf(h * 60) }}
              >
                {h === 24 ? '' : `${String(h).padStart(2, '0')}`}
              </div>
            ))}
          </div>

          <div
            ref={gridRef}
            onPointerDown={createAt}
            className="relative flex-1 min-w-0 cursor-crosshair"
          >
            {/* hour lines */}
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-[var(--color-paper-line)]/70"
                style={{ top: yOf(h * 60) }}
              />
            ))}
            {/* day dividers */}
            {dayKeys.map((key, i) => (
              <div
                key={key}
                className="absolute top-0 bottom-0 border-l border-[var(--color-paper-line)]/60"
                style={{ left: `${(i / 7) * 100}%`, width: `${100 / 7}%` }}
              >
                {key === today && (
                  <div className="absolute inset-0 bg-[var(--color-accent)]/[0.035] pointer-events-none" />
                )}
              </div>
            ))}
            <NowLine dayKeys={dayKeys} today={today} />

            {timed.map((item) => {
              const live = drag?.id === item.id ? drag : null;
              const date = live?.date ?? item.date;
              const startMin = live?.startMin ?? toMin(item.time!);
              const len = live?.len ?? lengthOf(item);
              const col = dayKeys.indexOf(date);
              if (col === -1) return null;
              const colour = colourOf(item, subjects);
              return (
                <Event
                  key={item.id}
                  item={item}
                  colour={colour}
                  col={col}
                  top={yOf(startMin)}
                  height={(len / 60) * HOUR_H}
                  startMin={startMin}
                  len={len}
                  dragging={!!live}
                  selected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                  onGrab={(e, mode) => beginDrag(e, item, mode)}
                  onRename={(title) => updateScheduleItem(item.id, { title })}
                  onRemove={() => removeScheduleItem(item.id)}
                  onColour={(c) => updateScheduleItem(item.id, { color: c })}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function colourOf(item: ScheduleItem, subjects: { id: string; color: NoteColor }[]) {
  if (item.color) return NOTE_COLORS[item.color];
  const subject = subjects.find((s) => s.id === item.subjectId);
  if (subject) return NOTE_COLORS[subject.color];
  return 'var(--color-accent)';
}

/** The current-time hairline, as in a calendar app. */
function NowLine({ dayKeys, today }: { dayKeys: string[]; today: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const col = dayKeys.indexOf(today);
  if (col === -1) return null;
  const min = now.getHours() * 60 + now.getMinutes();
  if (min < START_HOUR * 60) return null;
  return (
    <div
      className="absolute z-20 pointer-events-none flex items-center"
      style={{ top: yOf(min), left: `${(col / 7) * 100}%`, width: `${100 / 7}%` }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] -ml-[3px]" />
      <span className="flex-1 h-px bg-[var(--color-accent)]" />
    </div>
  );
}

function Event({
  item,
  colour,
  col,
  top,
  height,
  startMin,
  len,
  dragging,
  selected,
  onSelect,
  onGrab,
  onRename,
  onRemove,
  onColour,
}: {
  item: ScheduleItem;
  colour: string;
  col: number;
  top: number;
  height: number;
  startMin: number;
  len: number;
  dragging: boolean;
  selected: boolean;
  onSelect: () => void;
  onGrab: (e: React.PointerEvent, mode: 'move' | 'resize') => void;
  onRename: (title: string) => void;
  onRemove: () => void;
  onColour: (c: NoteColor) => void;
}) {
  const [editing, setEditing] = useState(false);
  const short = height < 34;

  return (
    <div
      className="absolute px-[3px] touch-none"
      style={{
        left: `${(col / 7) * 100}%`,
        width: `${100 / 7}%`,
        top,
        height,
        zIndex: dragging ? 60 : selected ? 40 : 10,
      }}
    >
      <div
        onPointerDown={(e) => !editing && onGrab(e, 'move')}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onDoubleClick={() => setEditing(true)}
        className={`group relative h-full rounded-sm overflow-hidden text-left transition-shadow ${
          dragging ? 'shadow-lg cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          background: `color-mix(in srgb, ${colour} 22%, var(--color-paper))`,
          borderLeft: `3px solid ${colour}`,
          boxShadow: selected ? `0 0 0 1px ${colour}` : undefined,
        }}
      >
        <div className={`px-1.5 ${short ? 'py-0' : 'py-1'} leading-tight`}>
          {editing ? (
            <input
              autoFocus
              defaultValue={item.title}
              onBlur={(e) => {
                onRename(e.target.value.trim() || item.title);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setEditing(false);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-[0.74rem] outline-none border-b border-[var(--color-ink-soft)]"
            />
          ) : (
            <p className="text-[0.74rem] truncate">{item.title}</p>
          )}
          {!short && (
            <p className="font-mono-num text-[0.62rem] text-[var(--color-ink-soft)]">
              {toHHMM(startMin)}–{toHHMM(startMin + len)}
            </p>
          )}
        </div>

        {selected && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-0 right-0 px-1.5 text-[0.7rem] text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
            aria-label="Delete event"
          >
            ×
          </button>
        )}

        {/* drag the bottom edge to lengthen */}
        <span
          onPointerDown={(e) => onGrab(e, 'resize')}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
        >
          <span className="block mx-auto w-6 h-[2px] rounded-full bg-[var(--color-ink-soft)]/0 group-hover:bg-[var(--color-ink-soft)]/40 mt-1 transition-colors" />
        </span>
      </div>
      {selected && !editing && (
        <ColourStrip onPick={onColour} />
      )}
    </div>
  );
}

const QUICK_COLOURS: NoteColor[] = ['clay', 'denim', 'sage', 'ochre', 'lilac', 'teal'];

function ColourStrip({ onPick }: { onPick: (c: NoteColor) => void }) {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute left-0 right-0 -bottom-6 z-50 flex justify-center gap-1 px-1"
    >
      {QUICK_COLOURS.map((c) => (
        <button
          key={c}
          onClick={(e) => {
            e.stopPropagation();
            onPick(c);
          }}
          title={c}
          className="w-3.5 h-3.5 rounded-full border border-[var(--color-paper)] shadow-sm"
          style={{ background: NOTE_COLORS[c] }}
        />
      ))}
    </div>
  );
}
