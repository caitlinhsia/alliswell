import { useMemo, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import Panel from '../components/Panel';
import ColorPicker from '../components/ColorPicker';
import DateField from '../components/DateField';
import { todayStr } from '../lib/date';
import { NOTE_COLORS } from '../lib/colors';
import type { NoteColor, Priority, ScheduleItem } from '../types';

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'var(--color-note-rust)',
  medium: 'var(--color-note-ochre)',
  low: 'var(--color-note-sage)',
};

export default function ScheduleContent() {
  const schedule = useAppStore((s) => s.schedule);
  const subjects = useAppStore((s) => s.subjects);
  const addScheduleItem = useAppStore((s) => s.addScheduleItem);
  const updateScheduleItem = useAppStore((s) => s.updateScheduleItem);
  const moveScheduleItem = useAppStore((s) => s.moveScheduleItem);
  const toggleScheduleItem = useAppStore((s) => s.toggleScheduleItem);
  const removeScheduleItem = useAppStore((s) => s.removeScheduleItem);
  const todos = useAppStore((s) => s.todos);
  const toggleTodo = useAppStore((s) => s.toggleTodo);

  const [weekOffset, setWeekOffset] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState<'task' | 'event'>('task');
  const [formSubjectId, setFormSubjectId] = useState('');

  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [quickText, setQuickText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const weekStart = useMemo(
    () => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7),
    [weekOffset]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addScheduleItem(title.trim(), date, time || undefined, category, {
      endTime: endTime || undefined,
      subjectId: formSubjectId || undefined,
    });
    setTitle('');
    setTime('');
    setEndTime('');
    setFormOpen(false);
  }

  function submitQuickAdd(dayStr: string) {
    if (quickText.trim()) {
      addScheduleItem(quickText.trim(), dayStr, undefined, 'task');
    }
    setQuickText('');
    setAddingDate(null);
  }

  function startEdit(item: ScheduleItem) {
    setEditingId(item.id);
    setEditText(item.title);
  }

  function saveEdit(id: string) {
    if (editText.trim()) {
      updateScheduleItem(id, { title: editText.trim() });
    }
    setEditingId(null);
  }

  function itemAccent(item: ScheduleItem): string | undefined {
    if (item.color) return NOTE_COLORS[item.color];
    const subj = subjects.find((s) => s.id === item.subjectId);
    return subj ? NOTE_COLORS[subj.color] : undefined;
  }

  return (
    <>
      <p className="font-hand text-xl text-[var(--color-ink-soft)] -mt-2 mb-4">
        Drag anything to another day to reschedule it · click a task to rename
      </p>

      <div className="mb-4 shrink-0">
        {formOpen ? (
          <Panel>
            <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-note text-xs text-[var(--color-ink-soft)]">What</label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Yoga, essay draft, dentist"
                  className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[var(--color-note-denim)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-note text-xs text-[var(--color-ink-soft)]">Date</label>
                <DateField value={date} onChange={(v) => setDate(v ?? todayStr())} allowClear={false} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-note text-xs text-[var(--color-ink-soft)]">From</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-note text-xs text-[var(--color-ink-soft)]">To</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-note text-xs text-[var(--color-ink-soft)]">Subject</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2"
                >
                  <option value="">none</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-note text-xs text-[var(--color-ink-soft)]">Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'task' | 'event')}
                  className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2"
                >
                  <option value="task">Task</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <button
                type="submit"
                className="font-note bg-[var(--color-note-denim)] text-[var(--color-ink)] px-4 py-2 rounded-lg hover:opacity-90"
              >
                + Add
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="font-note text-sm text-[var(--color-ink-soft)] px-2 py-2 hover:text-[var(--color-ink)]"
              >
                cancel
              </button>
            </form>
          </Panel>
        ) : (
          <button
            onClick={() => setFormOpen(true)}
            className="font-note text-sm px-3 py-1.5 rounded-full border border-dashed border-[var(--color-ink-soft)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-deep)] hover:text-[var(--color-ink)]"
          >
            + add with date, time, subject, or event type
          </button>
        )}
      </div>

      <div className="mb-3 shrink-0">
        <p className="font-hand text-2xl text-center mb-2">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d')}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="font-note text-sm px-3 py-1 rounded-lg border border-[var(--color-paper-line)] hover:bg-[var(--color-paper-deep)]"
          >
            ← prev
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="font-note text-sm px-3 py-1 rounded-lg border border-[var(--color-paper-line)] hover:bg-[var(--color-paper-deep)]"
          >
            today
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="font-note text-sm px-3 py-1 rounded-lg border border-[var(--color-paper-line)] hover:bg-[var(--color-paper-deep)]"
          >
            next →
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mx-1 px-1 grid grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-3 content-start">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const items = schedule
            .filter((i) => i.date === dayStr)
            .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
          const dayTodos = todos.filter((t) => t.dueDate === dayStr);
          const isToday = dayStr === todayStr();
          const isAdding = addingDate === dayStr;
          const isDropTarget = dragOverDate === dayStr;
          return (
            <div
              key={dayStr}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDate(dayStr);
              }}
              onDragLeave={() => setDragOverDate((d) => (d === dayStr ? null : d))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverDate(null);
                const id = e.dataTransfer.getData('text/plain');
                if (id) moveScheduleItem(id, dayStr);
              }}
              className={`rounded-2xl border p-2.5 sm:p-3 min-h-[110px] sm:min-h-[160px] lg:min-h-[380px] flex flex-col transition-colors ${
                isDropTarget
                  ? 'border-[var(--color-note-denim)] border-2 bg-[var(--color-note-denim)]/10'
                  : isToday
                  ? 'border-[var(--color-note-denim)] bg-[var(--color-paper)]'
                  : 'border-[var(--color-paper-line)] bg-[var(--color-paper)]/70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-note text-xs text-[var(--color-ink-soft)]">{format(day, 'EEE')}</p>
                  <p className="font-hand text-xl mb-2">{format(day, 'd')}</p>
                </div>
                {!isAdding && (
                  <button
                    onClick={() => {
                      setAddingDate(dayStr);
                      setQuickText('');
                    }}
                    aria-label={`Add to ${format(day, 'EEEE, MMM d')}`}
                    className="w-7 h-7 -m-1 rounded-full border border-dashed border-[var(--color-ink-soft)]/50 text-[var(--color-ink-soft)]/70 hover:text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-deep)] flex items-center justify-center text-sm leading-none transition-colors"
                  >
                    +
                  </button>
                )}
              </div>
              <ul className="space-y-1.5 flex-1">
                {items.map((item) => {
                  const accent = itemAccent(item);
                  const subj = subjects.find((s) => s.id === item.subjectId);
                  const isExpanded = expandedId === item.id;
                  return (
                    <li
                      key={item.id}
                      draggable={editingId !== item.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className="rounded-lg border border-[var(--color-paper-line)] bg-[var(--color-paper)] px-1.5 py-1 cursor-grab active:cursor-grabbing"
                      style={accent ? { borderLeft: `3px solid ${accent}` } : undefined}
                    >
                      <div className="flex items-start gap-1.5 font-note text-xs leading-snug">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleScheduleItem(item.id)}
                          className="mt-0.5 accent-[var(--color-note-denim)] w-4 h-4 shrink-0"
                        />
                        {editingId === item.id ? (
                          <input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={() => saveEdit(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(item.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 font-note bg-transparent border-b border-dashed border-[var(--color-ink-soft)] outline-none min-w-0"
                          />
                        ) : (
                          <span
                            onClick={() => startEdit(item)}
                            className={`flex-1 cursor-text hover:underline decoration-dotted ${
                              item.done ? 'line-through text-[var(--color-ink-soft)]' : ''
                            }`}
                          >
                            {item.time && (
                              <span className="text-[var(--color-ink-soft)]">
                                {item.time}
                                {item.endTime ? `–${item.endTime}` : ''}{' '}
                              </span>
                            )}
                            {item.title}
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          aria-label="Item options"
                          className="text-[var(--color-ink-soft)]/40 hover:text-[var(--color-ink)] shrink-0 px-1.5 -my-1 -mr-1 leading-none"
                        >
                          ⋯
                        </button>
                      </div>

                      {subj && !isExpanded && (
                        <p className="font-note text-[10px] text-[var(--color-ink-soft)] pl-[22px]">{subj.name}</p>
                      )}

                      {isExpanded && (
                        <div className="pl-[22px] pt-1.5 pb-0.5 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-note text-[10px] text-[var(--color-ink-soft)]">color</span>
                            <ColorPicker
                              size="sm"
                              value={item.color ?? subj?.color ?? 'denim'}
                              onChange={(c: NoteColor) => updateScheduleItem(item.id, { color: c })}
                            />
                          </div>
                          <select
                            value={item.subjectId ?? ''}
                            onChange={(e) =>
                              updateScheduleItem(item.id, { subjectId: e.target.value || undefined })
                            }
                            className="font-note text-[11px] border border-[var(--color-paper-line)] rounded px-1.5 py-0.5 bg-[var(--color-paper)]"
                          >
                            <option value="">no subject</option>
                            {subjects.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <input
                              type="time"
                              value={item.time ?? ''}
                              onChange={(e) => updateScheduleItem(item.id, { time: e.target.value || undefined })}
                              className="font-note text-[11px] border border-[var(--color-paper-line)] rounded px-1 py-0.5 bg-[var(--color-paper)] min-w-0 flex-1"
                            />
                            <span className="text-[10px] text-[var(--color-ink-soft)]">–</span>
                            <input
                              type="time"
                              value={item.endTime ?? ''}
                              onChange={(e) =>
                                updateScheduleItem(item.id, { endTime: e.target.value || undefined })
                              }
                              className="font-note text-[11px] border border-[var(--color-paper-line)] rounded px-1 py-0.5 bg-[var(--color-paper)] min-w-0 flex-1"
                            />
                          </div>
                          <button
                            onClick={() => {
                              removeScheduleItem(item.id);
                              setExpandedId(null);
                            }}
                            className="font-note text-[11px] text-[var(--color-ink-soft)] hover:text-red-600 self-start"
                          >
                            delete
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
                {dayTodos.map((t) => (
                  <li key={t.id} className="flex items-start gap-1.5 font-note text-xs leading-snug px-1.5">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTodo(t.id)}
                      className="mt-0.5 accent-[var(--color-note-denim)] w-4 h-4 shrink-0"
                    />
                    <span
                      className="mt-1 w-2 h-2 rounded-full shrink-0"
                      style={{ background: PRIORITY_DOT[t.priority] }}
                      title={`${t.priority} priority to-do`}
                    />
                    <span className={`flex-1 ${t.done ? 'line-through text-[var(--color-ink-soft)]' : ''}`}>
                      {t.text}
                    </span>
                  </li>
                ))}
                {isAdding && (
                  <li className="flex items-center gap-1.5 font-note text-xs">
                    <span className="w-4 h-4 shrink-0" />
                    <input
                      autoFocus
                      value={quickText}
                      onChange={(e) => setQuickText(e.target.value)}
                      onBlur={() => submitQuickAdd(dayStr)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitQuickAdd(dayStr);
                        if (e.key === 'Escape') {
                          setQuickText('');
                          setAddingDate(null);
                        }
                      }}
                      placeholder="new task..."
                      className="flex-1 font-note bg-transparent border-b border-dashed border-[var(--color-ink-soft)] outline-none min-w-0"
                    />
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
