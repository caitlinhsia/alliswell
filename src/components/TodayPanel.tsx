import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { todayStr } from '../lib/date';
import { moodMeta } from '../lib/mood';
import { NOTE_COLORS } from '../lib/colors';
import type { Priority } from '../types';
import { expandSchedule } from '../lib/recurrence';

const PRIORITY_COLOR: Record<Priority, string> = {
  high: 'var(--color-note-rust)',
  medium: 'var(--color-note-ochre)',
  low: 'var(--color-note-sage)',
};

type Row = {
  id: string;
  kind: 'event' | 'todo';
  title: string;
  done: boolean;
  time?: string;
  endTime?: string;
  colour: string;
  overdue?: boolean;
  repeating?: boolean;
  subject?: string;
};

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * One column for the day, drawn from every page at once: what is scheduled,
 * what is due, how long you have focused, how you said you felt. The point is
 * that a Tuesday is one thing, not six pages you have to visit in turn.
 */
export default function TodayPanel() {
  const schedule = useAppStore((s) => s.schedule);
  const todos = useAppStore((s) => s.todos);
  const subjects = useAppStore((s) => s.subjects);
  const studySessions = useAppStore((s) => s.studySessions);
  const journalEntries = useAppStore((s) => s.journalEntries);
  const toggleOccurrence = useAppStore((s) => s.toggleOccurrence);
  const toggleTodo = useAppStore((s) => s.toggleTodo);

  const today = todayStr();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const subjectName = (id?: string) => subjects.find((s) => s.id === id)?.name;
  const subjectColour = (id?: string) => {
    const s = subjects.find((x) => x.id === id);
    return s ? NOTE_COLORS[s.color] : undefined;
  };

  // expanded, so a weekly seminar shows up on today like anything else
  const events: Row[] = expandSchedule(schedule, [today]).map((o) => ({
    id: o.item.id,
    kind: 'event' as const,
    title: o.item.title,
    done: o.done,
    time: o.item.time,
    endTime: o.item.endTime,
    repeating: o.repeating,
    colour: o.item.color
      ? NOTE_COLORS[o.item.color]
      : subjectColour(o.item.subjectId) ?? 'var(--color-accent)',
    subject: subjectName(o.item.subjectId),
  }));

  const due: Row[] = todos
    .filter((t) => !t.done && t.dueDate && t.dueDate <= today)
    .map((t) => ({
      id: t.id,
      kind: 'todo' as const,
      title: t.text,
      done: t.done,
      colour: PRIORITY_COLOR[t.priority],
      overdue: !!t.dueDate && t.dueDate < today,
      subject: subjectName(t.subjectId),
    }));

  // timed things in order, then everything without a time
  const rows = [...events, ...due].sort((a, b) => {
    if (a.time && b.time) return minutesOf(a.time) - minutesOf(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return Number(!!b.overdue) - Number(!!a.overdue); // overdue first
  });

  const nextUp = rows.find((r) => r.time && !r.done && minutesOf(r.time) >= nowMin);
  const left = rows.filter((r) => !r.done).length;

  const minutesToday = studySessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.minutes, 0);
  const bySubject = subjects
    .map((s) => ({
      name: s.name,
      colour: NOTE_COLORS[s.color],
      mins: studySessions
        .filter((x) => x.date === today && x.subjectId === s.id)
        .reduce((sum, x) => sum + x.minutes, 0),
    }))
    .filter((s) => s.mins > 0);

  const mood = journalEntries.find((e) => e.date === today)?.mood;

  return (
    <section className="mt-7 page-body-wide">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="section">Today</h2>
        <span className="flex-1" />
        <span className="font-body text-[0.8rem] text-[var(--color-ink-soft)]">
          {summary(left, minutesToday, mood ? moodMeta(mood).label.toLowerCase() : undefined)}
        </span>
      </div>

      <div className="grid gap-x-10 gap-y-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div>
          {rows.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-ink-soft)] py-1">
              Nothing scheduled and nothing due. A clear day.
            </p>
          ) : (
            <ul>
              {rows.map((r) => (
                <li
                  key={`${r.kind}-${r.id}`}
                  className="group flex items-baseline gap-3 py-1.5 border-b border-[var(--color-paper-line)]/60"
                >
                  <button
                    onClick={() =>
                      r.kind === 'todo' ? toggleTodo(r.id) : toggleOccurrence(r.id, today)
                    }
                    aria-label={`Complete ${r.title}`}
                    className="shrink-0 self-center w-[15px] h-[15px] rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      borderColor: r.colour,
                      background: r.done ? r.colour : 'transparent',
                    }}
                  />
                  <span
                    className="font-mono-num text-[0.68rem] w-[3.1rem] shrink-0 tabular-nums"
                    style={{
                      color: r.overdue
                        ? 'var(--color-note-rust)'
                        : 'var(--color-ink-faint)',
                    }}
                  >
                    {r.time ?? (r.overdue ? 'late' : '—')}
                  </span>
                  <span
                    className={`flex-1 min-w-0 truncate text-[0.9rem] ${
                      r.done ? 'line-through text-[var(--color-ink-faint)]' : ''
                    }`}
                  >
                    {r.repeating && <span className="opacity-40 mr-1">↻</span>}
                    {r.title}
                  </span>
                  {r.subject && (
                    <span className="hidden sm:inline text-[0.7rem] text-[var(--color-ink-faint)] shrink-0">
                      {r.subject}
                    </span>
                  )}
                  {nextUp && r.id === nextUp.id && (
                    <span className="label text-[var(--color-accent)] shrink-0">next</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="label mb-1.5">Focused today</p>
            <p className="font-mono-num text-2xl leading-none">
              {minutesToday}
              <span className="text-sm font-body text-[var(--color-ink-soft)] ml-1.5">min</span>
            </p>
            {bySubject.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {bySubject.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="text-[0.72rem] text-[var(--color-ink-soft)] w-16 shrink-0 truncate">
                      {s.name}
                    </span>
                    <span className="flex-1 h-[3px] rounded-full bg-[var(--color-paper-line)] overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (s.mins / Math.max(minutesToday, 1)) * 100)}%`,
                          background: s.colour,
                        }}
                      />
                    </span>
                    <span className="font-mono-num text-[0.65rem] text-[var(--color-ink-faint)]">
                      {s.mins}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="label mb-1.5">Mood</p>
            {mood ? (
              <p className="font-body text-[0.9rem]">
                <span className="text-lg mr-1.5">{moodMeta(mood).mark}</span>
                {moodMeta(mood).label}
              </p>
            ) : (
              <p className="font-body text-[0.85rem] text-[var(--color-ink-faint)]">
                Not marked yet
              </p>
            )}
          </div>

          <p className="label">{format(parseISO(today), 'EEEE d MMMM')}</p>
        </div>
      </div>
    </section>
  );
}

function summary(left: number, minutes: number, mood?: string) {
  const bits: string[] = [];
  bits.push(left === 0 ? 'all clear' : `${left} left`);
  if (minutes > 0) bits.push(`${minutes} min focused`);
  if (mood) bits.push(`feeling ${mood}`);
  return bits.join(' · ');
}
