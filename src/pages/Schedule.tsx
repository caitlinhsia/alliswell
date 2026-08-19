import { useMemo, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import { todayStr } from '../lib/date';

export default function Schedule() {
  const schedule = useAppStore((s) => s.schedule);
  const addScheduleItem = useAppStore((s) => s.addScheduleItem);
  const toggleScheduleItem = useAppStore((s) => s.toggleScheduleItem);
  const removeScheduleItem = useAppStore((s) => s.removeScheduleItem);

  const [weekOffset, setWeekOffset] = useState(0);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<'task' | 'event'>('task');

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
    addScheduleItem(title.trim(), date, time || undefined, category);
    setTitle('');
    setTime('');
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader title="Schedule" subtitle="Plan your week gently" emoji="🗓️" />

      <Panel className="mb-6">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-note text-xs text-[var(--color-ink-soft)]">What</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Yoga, essay draft, dentist"
              className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[var(--color-tab-sky)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-note text-xs text-[var(--color-ink-soft)]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-note text-xs text-[var(--color-ink-soft)]">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2"
            />
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
            className="font-note bg-[var(--color-tab-sky)] text-[var(--color-ink)] px-4 py-2 rounded-lg hover:opacity-90"
          >
            + Add
          </button>
        </form>
      </Panel>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="font-note text-sm px-3 py-1 rounded-lg border border-[var(--color-paper-line)] hover:bg-[var(--color-paper-deep)]"
        >
          ← prev
        </button>
        <p className="font-hand text-2xl">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d')}
        </p>
        <div className="flex gap-2">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const items = schedule
            .filter((i) => i.date === dayStr)
            .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
          const isToday = dayStr === todayStr();
          return (
            <div
              key={dayStr}
              className={`rounded-2xl border p-3 min-h-[160px] ${
                isToday
                  ? 'border-[var(--color-tab-sky)] bg-[var(--color-paper)]'
                  : 'border-[var(--color-paper-line)] bg-[var(--color-paper)]/70'
              }`}
            >
              <p className="font-note text-xs text-[var(--color-ink-soft)]">{format(day, 'EEE')}</p>
              <p className="font-hand text-xl mb-2">{format(day, 'd')}</p>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-start gap-1.5 font-note text-xs leading-snug"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleScheduleItem(item.id)}
                      className="mt-0.5 accent-[var(--color-tab-sky)] w-3.5 h-3.5 shrink-0"
                    />
                    <span
                      className={`flex-1 ${item.done ? 'line-through text-[var(--color-ink-soft)]' : ''} ${
                        item.category === 'event' ? 'text-[var(--color-tab-blush)]' : ''
                      }`}
                    >
                      {item.time && `${item.time} `}
                      {item.title}
                    </span>
                    <button
                      onClick={() => removeScheduleItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--color-ink-soft)] hover:text-red-500"
                      aria-label="Delete"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
