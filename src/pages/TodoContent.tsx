import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import DateField from '../components/DateField';
import { todayStr } from '../lib/date';
import { parseTodoInput } from '../lib/parseTodo';
import { NOTE_COLORS } from '../lib/colors';
import type { Priority, TodoItem } from '../types';
import { format, parseISO } from 'date-fns';

const PRIORITY_META: Record<Priority, { label: string; short: string; color: string }> = {
  high: { label: 'High', short: 'P1', color: 'var(--color-note-rust)' },
  medium: { label: 'Medium', short: 'P2', color: 'var(--color-note-ochre)' },
  low: { label: 'Low', short: 'P3', color: 'var(--color-note-sage)' },
};
const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low'];

function sortTodos(todos: TodoItem[]) {
  return [...todos].sort((a, b) => {
    const pDiff = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    if (pDiff !== 0) return pDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.createdAt - b.createdAt;
  });
}

/** "today", "tmr", "Sat" for the coming week, then a plain date. */
function dueLabel(date: string, today: string) {
  const d = parseISO(date);
  const days = Math.round((d.getTime() - parseISO(today).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 1 && days < 7) return format(d, 'EEEE');
  return format(d, 'd MMM');
}

export default function TodoContent() {
  const todos = useAppStore((s) => s.todos);
  const subjects = useAppStore((s) => s.subjects);
  const addTodo = useAppStore((s) => s.addTodo);
  const updateTodo = useAppStore((s) => s.updateTodo);
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const removeTodo = useAppStore((s) => s.removeTodo);
  const clearCompleted = useAppStore((s) => s.clearCompletedTodos);

  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority | null>(null);
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [filter, setFilter] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const parsed = useMemo(() => parseTodoInput(text), [text]);
  const today = todayStr();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addTodo(
      parsed.text,
      priority ?? parsed.priority ?? 'medium',
      dueDate ?? parsed.dueDate,
      subjectId ?? (filter !== 'all' && filter !== 'none' ? filter : undefined)
    );
    setText('');
    setPriority(null);
    setDueDate(undefined);
    setSubjectId(undefined);
  }

  const matchesFilter = (t: TodoItem) =>
    filter === 'all' ? true : filter === 'none' ? !t.subjectId : t.subjectId === filter;

  const visible = todos.filter(matchesFilter);
  const active = sortTodos(visible.filter((t) => !t.done));
  const done = visible
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  const effPriority = priority ?? parsed.priority ?? 'medium';
  const effDue = dueDate ?? parsed.dueDate;

  return (
    <div className="flex-1 min-h-0 flex flex-col page-body w-full">
      {/* add a task */}
      <form onSubmit={handleAdd} className="shrink-0 flex flex-wrap items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task — try “essay draft p1 mon”"
          className="flex-1 min-w-[240px] font-body text-[0.95rem] bg-transparent border-b border-[var(--color-paper-line)] px-1 py-2 placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        <div className="flex items-center gap-1">
          {PRIORITY_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(priority === p ? null : p)}
              title={PRIORITY_META[p].label}
              className="w-7 h-7 rounded-full border flex items-center justify-center text-[0.6rem] font-mono transition-colors"
              style={{
                borderColor:
                  effPriority === p ? PRIORITY_META[p].color : 'var(--color-paper-line)',
                background:
                  effPriority === p
                    ? `color-mix(in srgb, ${PRIORITY_META[p].color} 22%, transparent)`
                    : 'transparent',
                color: effPriority === p ? 'var(--color-ink)' : 'var(--color-ink-faint)',
              }}
            >
              {PRIORITY_META[p].short}
            </button>
          ))}
        </div>
        <DateField value={effDue} onChange={setDueDate} placeholder="date" compact className="btn" />
        {subjects.length > 0 && (
          <select
            value={subjectId ?? ''}
            onChange={(e) => setSubjectId(e.target.value || undefined)}
            className="btn appearance-none pr-7"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'><path d='M0 0l4 5 4-5z' fill='%237d7060'/></svg>\")",
              backgroundRepeat: 'no-repeat',
              backgroundSize: '8px 5px',
              backgroundPosition: 'right 0.55rem center',
            }}
          >
            <option value="">no subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="btn-primary">
          Add
        </button>
      </form>
      {parsed.matched.length > 0 && (
        <p className="shrink-0 font-body text-xs text-[var(--color-ink-soft)] mb-2">
          reading that as <span className="text-[var(--color-ink)]">“{parsed.text}”</span> ·{' '}
          {parsed.matched.join(' · ')}
        </p>
      )}

      {/* subjects */}
      <div className="shrink-0 flex items-center gap-1.5 flex-wrap mt-8 mb-4">
        <SubjectChip label="Everything" active={filter === 'all'} onClick={() => setFilter('all')} count={todos.filter((t) => !t.done).length} />
        {subjects.map((s) => (
          <SubjectChip
            key={s.id}
            label={s.name}
            color={NOTE_COLORS[s.color]}
            active={filter === s.id}
            onClick={() => setFilter(s.id)}
            count={todos.filter((t) => !t.done && t.subjectId === s.id).length}
          />
        ))}
        <SubjectChip
          label="No subject"
          active={filter === 'none'}
          onClick={() => setFilter('none')}
          count={todos.filter((t) => !t.done && !t.subjectId).length}
        />
      </div>

      {/* the list */}
      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 pb-4">
        {active.length === 0 && done.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-ink-soft)] py-4">
            Nothing on the list. Add one above — typing “essay draft p1 fri” sets the priority and the day at the same time.
          </p>
        ) : null}

        <ul>
          <AnimatePresence initial={false}>
            {active.map((t) => (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.25 } }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <TaskRow
                  todo={t}
                  today={today}
                  open={openId === t.id}
                  onToggleOpen={() => setOpenId(openId === t.id ? null : t.id)}
                  onToggle={() => toggleTodo(t.id)}
                  onPatch={(patch) => updateTodo(t.id, patch)}
                  onRemove={() => removeTodo(t.id)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {done.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDone((v) => !v)}
                className="label hover:text-[var(--color-ink)] transition-colors flex items-center gap-1.5"
              >
                <span
                  className="inline-block transition-transform"
                  style={{ transform: showDone ? 'rotate(90deg)' : 'none' }}
                >
                  ›
                </span>
                Completed · {done.length}
              </button>
              <span className="h-px flex-1 bg-[var(--color-paper-line)]" />
              {showDone && (
                <button
                  onClick={clearCompleted}
                  className="action"
                >
                  clear
                </button>
              )}
            </div>

            {showDone && (
              <ul className="mt-2">
                {done.map((t) => (
                  <li
                    key={t.id}
                    className="group flex items-baseline gap-3 py-2 border-b border-[var(--color-paper-line)]/60"
                  >
                    <button
                      onClick={() => toggleTodo(t.id)}
                      title="Put it back"
                      className="shrink-0 self-center w-[18px] h-[18px] rounded-full flex items-center justify-center"
                      style={{ background: PRIORITY_META[t.priority].color }}
                    >
                      <Tick />
                    </button>
                    <span className="flex-1 min-w-0 truncate text-sm text-[var(--color-ink-soft)] line-through">
                      {t.text}
                    </span>
                    {t.completedAt && (
                      <span className="font-mono-num text-[0.62rem] text-[var(--color-ink-faint)] shrink-0">
                        {format(new Date(t.completedAt), 'd MMM')}
                      </span>
                    )}
                    <button
                      onClick={() => removeTodo(t.id)}
                      className="action on-hover shrink-0"
                    >
                      delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectChip({
  label,
  color,
  active,
  count,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[0.78rem] transition-colors"
      style={{
        borderColor: active
          ? color ?? 'var(--color-accent)'
          : 'var(--color-paper-line)',
        background: active
          ? `color-mix(in srgb, ${color ?? 'var(--color-accent)'} 18%, transparent)`
          : 'transparent',
        color: active ? 'var(--color-ink)' : 'var(--color-ink-soft)',
      }}
    >
      {color && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      )}
      {label}
      <span className="font-mono-num text-[0.62rem] text-[var(--color-ink-faint)]">{count}</span>
    </button>
  );
}

/** The tick itself, drawn on rather than faded in — that is the satisfying part. */
function Tick() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.4 4.8 8.7 9.5 3.8"
        stroke="var(--color-paper)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="tick-path"
      />
    </svg>
  );
}

function TaskRow({
  todo: t,
  today,
  open,
  onToggleOpen,
  onToggle,
  onPatch,
  onRemove,
}: {
  todo: TodoItem;
  today: string;
  open: boolean;
  onToggleOpen: () => void;
  onToggle: () => void;
  onPatch: (patch: Partial<TodoItem>) => void;
  onRemove: () => void;
}) {
  const subjects = useAppStore((s) => s.subjects);
  const subject = subjects.find((s) => s.id === t.subjectId);
  const overdue = !!t.dueDate && t.dueDate < today;
  const colour = PRIORITY_META[t.priority].color;
  const [checking, setChecking] = useState(false);

  function check() {
    // let the tick draw before the row leaves
    setChecking(true);
    window.setTimeout(onToggle, 260);
  }

  return (
    <div className="group border-b border-[var(--color-paper-line)]/70 py-3">
      <div className="flex items-start gap-3">
        <button
          onClick={check}
          role="checkbox"
          aria-checked={checking}
          aria-label={`Complete ${t.text}`}
          className="shrink-0 mt-[1px] w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            borderColor: colour,
            background: checking ? colour : 'transparent',
            transform: checking ? 'scale(1.15)' : undefined,
          }}
        >
          {checking ? (
            <Tick />
          ) : (
            <span
              className="w-[9px] h-[9px] rounded-full opacity-0 group-hover:opacity-35 transition-opacity"
              style={{ background: colour }}
            />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <input
            value={t.text}
            onChange={(e) => onPatch({ text: e.target.value })}
            className="w-full bg-transparent text-[0.95rem] outline-none focus:border-b focus:border-[var(--color-accent)] -mb-px"
          />
          {(t.description || open) && (
            <textarea
              value={t.description ?? ''}
              onChange={(e) => onPatch({ description: e.target.value })}
              placeholder="Description"
              rows={open ? 3 : Math.min(3, (t.description ?? '').split('\n').length)}
              className="mt-1 w-full resize-none bg-transparent text-[0.82rem] leading-relaxed text-[var(--color-ink-soft)] outline-none placeholder:text-[var(--color-ink-faint)]"
            />
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {subject && (
            <span
              className="hidden sm:flex items-center gap-1.5 text-[0.72rem] text-[var(--color-ink-soft)]"
              title={subject.name}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: NOTE_COLORS[subject.color] }}
              />
              {subject.name}
            </span>
          )}
          <DateField
            compact
            value={t.dueDate}
            onChange={(v) => onPatch({ dueDate: v })}
            placeholder="+ date"
            className={`text-[0.72rem] px-2 py-0.5 rounded-full border whitespace-nowrap ${
              overdue
                ? 'border-[var(--color-note-rust)] text-[var(--color-note-rust)]'
                : t.dueDate
                ? 'border-[var(--color-paper-line)] text-[var(--color-ink-soft)]'
                : 'border-dashed border-[var(--color-paper-line)] text-[var(--color-ink-faint)] on-hover'
            }`}
            display={t.dueDate ? dueLabel(t.dueDate, today) : undefined}
          />
          <button
            onClick={onToggleOpen}
            title="Description"
            className={`label transition-opacity ${
              t.description || open ? '' : 'on-hover'
            } hover:text-[var(--color-ink)]`}
          >
            note
          </button>
          <button
            onClick={onRemove}
            className="action on-hover"
          >
            delete
          </button>
        </div>
      </div>
    </div>
  );
}

export { PRIORITY_META };
