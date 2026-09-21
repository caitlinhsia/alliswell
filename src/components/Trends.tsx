import { useState } from 'react';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { MOODS, moodMeta } from '../lib/mood';
import { NOTE_COLORS } from '../lib/colors';
import { todayStr } from '../lib/date';
import type { Mood } from '../types';

type Tip = { text: string; x: number; y: number } | null;

/** Small tooltip that follows the pointer; charts here are too dense for titles. */
function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      className="fixed z-[80] pointer-events-none px-2 py-1 rounded-sm text-[0.7rem] whitespace-nowrap bg-[var(--color-ink)] text-[var(--color-paper)] shadow-lg"
      style={{ left: tip.x + 12, top: tip.y - 28 }}
    >
      {tip.text}
    </div>
  );
}

/**
 * Ten weeks of moods as a calendar grid. Colour carries the scale, but the
 * legend spells out every step with its glyph and name, so the reading never
 * rests on colour alone.
 */
export function MoodTrend({ weeks = 10 }: { weeks?: number }) {
  const journalEntries = useAppStore((s) => s.journalEntries);
  const [tip, setTip] = useState<Tip>(null);
  const today = todayStr();

  const byDate = new Map<string, Mood>();
  for (const e of journalEntries) byDate.set(e.date, e.mood);

  const end = startOfWeek(parseISO(today), { weekStartsOn: 1 });
  const start = addDays(end, -(weeks - 1) * 7);
  const columns = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d))
  );

  const counts = new Map<Mood, number>();
  for (const [date, mood] of byDate) {
    if (date >= format(start, 'yyyy-MM-dd') && date <= today) {
      counts.set(mood, (counts.get(mood) ?? 0) + 1);
    }
  }
  const recorded = [...counts.values()].reduce((a, b) => a + b, 0);
  const commonest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="section">Mood, ten weeks</h3>
        <span className="flex-1" />
        <span className="font-body text-[0.78rem] text-[var(--color-ink-soft)]">
          {recorded === 0
            ? 'nothing marked yet'
            : `${recorded} day${recorded === 1 ? '' : 's'} marked${
                commonest ? ` · mostly ${moodMeta(commonest[0]).label.toLowerCase()}` : ''
              }`}
        </span>
      </div>

      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px] shrink-0">
            {week.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const mood = byDate.get(key);
              const future = key > today;
              return (
                <span
                  key={key}
                  onMouseEnter={(e) =>
                    !future &&
                    setTip({
                      text: `${format(day, 'EEE d MMM')} — ${
                        mood ? moodMeta(mood).label : 'not marked'
                      }`,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseMove={(e) => tip && setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
                  onMouseLeave={() => setTip(null)}
                  className="w-[11px] h-[11px] rounded-[2px]"
                  style={{
                    background: mood ? moodMeta(mood).tone : 'transparent',
                    boxShadow: mood ? 'none' : 'inset 0 0 0 1px var(--color-paper-line)',
                    opacity: future ? 0.3 : 1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap mt-3">
        {MOODS.map((m) => (
          <span key={m.value} className="flex items-center gap-1.5 text-[0.72rem] text-[var(--color-ink-soft)]">
            <span className="w-[10px] h-[10px] rounded-[2px]" style={{ background: m.tone }} />
            <span className="text-[var(--color-ink-faint)]">{m.mark}</span>
            {m.label}
          </span>
        ))}
      </div>
      <Tooltip tip={tip} />
    </section>
  );
}

/**
 * Study minutes per day, one small row per subject. Small multiples rather
 * than a stacked bar on purpose: the subject colours are chosen to be soft and
 * several of them are genuinely indistinguishable side by side, so each row
 * carries its own name instead of asking colour to do the telling apart.
 */
export function StudyTrend({ days = 14 }: { days?: number }) {
  const subjects = useAppStore((s) => s.subjects);
  const studySessions = useAppStore((s) => s.studySessions);
  const [tip, setTip] = useState<Tip>(null);
  const today = todayStr();

  const dates = Array.from({ length: days }, (_, i) =>
    format(addDays(parseISO(today), -(days - 1 - i)), 'yyyy-MM-dd')
  );

  const rows = subjects.map((s) => {
    const perDay = dates.map(
      (d) =>
        studySessions
          .filter((x) => x.subjectId === s.id && x.date === d)
          .reduce((sum, x) => sum + x.minutes, 0)
    );
    return { subject: s, perDay, total: perDay.reduce((a, b) => a + b, 0) };
  });

  // one scale across every row, so the rows can be compared with each other
  const peak = Math.max(1, ...rows.flatMap((r) => r.perDay));
  const grand = rows.reduce((sum, r) => sum + r.total, 0);

  if (subjects.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="section">Focus, two weeks</h3>
        <span className="flex-1" />
        <span className="font-body text-[0.78rem] text-[var(--color-ink-soft)]">
          {grand === 0 ? 'no sessions yet' : (() => {
                const n = rows.filter((r) => r.total).length;
                return `${grand} min across ${n} subject${n === 1 ? '' : 's'}`;
              })()}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.subject.id} className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate text-[0.78rem] text-[var(--color-ink-soft)]">
              {r.subject.name}
            </span>
            <div className="flex-1 flex items-end gap-[2px] h-7">
              {r.perDay.map((mins, i) => (
                <span
                  key={dates[i]}
                  onMouseEnter={(e) =>
                    setTip({
                      text: `${format(parseISO(dates[i]), 'EEE d MMM')} — ${mins} min ${r.subject.name}`,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseMove={(e) => tip && setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
                  onMouseLeave={() => setTip(null)}
                  className="flex-1 min-w-[3px] rounded-t-[3px] transition-opacity hover:opacity-70"
                  style={{
                    height: mins === 0 ? 2 : `${Math.max(12, (mins / peak) * 100)}%`,
                    background: mins === 0 ? 'var(--color-paper-line)' : NOTE_COLORS[r.subject.color],
                  }}
                />
              ))}
            </div>
            <span className="font-mono-num text-[0.68rem] text-[var(--color-ink-faint)] w-10 text-right shrink-0">
              {r.total}m
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-1.5 pl-[5.75rem] pr-12">
        <span className="label">{format(parseISO(dates[0]), 'd MMM')}</span>
        <span className="label">today</span>
      </div>
      <Tooltip tip={tip} />
    </section>
  );
}
