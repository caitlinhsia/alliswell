import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Panel from '../components/Panel';
import DateField from '../components/DateField';
import { todayStr } from '../lib/date';
import { parseTodoInput } from '../lib/parseTodo';
import type { Priority, TodoItem } from '../types';

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: 'High', color: 'var(--color-note-rust)' },
  medium: { label: 'Medium', color: 'var(--color-note-ochre)' },
  low: { label: 'Low', color: 'var(--color-note-sage)' },
};
const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low'];

function nextPriority(p: Priority): Priority {
  return PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(p) + 1) % PRIORITY_ORDER.length];
}

function sortTodos(todos: TodoItem[]) {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const pDiff = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    if (pDiff !== 0) return pDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.createdAt - b.createdAt;
  });
}

export default function TodoContent() {
  const todos = useAppStore((s) => s.todos);
  const addTodo = useAppStore((s) => s.addTodo);
  const updateTodo = useAppStore((s) => s.updateTodo);
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const removeTodo = useAppStore((s) => s.removeTodo);

  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority | null>(null);
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // live read of what the typed line will become
  const parsed = useMemo(() => parseTodoInput(text), [text]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addTodo(parsed.text, priority ?? parsed.priority ?? 'medium', dueDate ?? parsed.dueDate);
    setText('');
    setPriority(null);
    setDueDate(undefined);
  }

  function startEdit(t: TodoItem) {
    setEditingId(t.id);
    setEditText(t.text);
  }

  function saveEdit(id: string) {
    if (editText.trim()) updateTodo(id, { text: editText.trim() });
    setEditingId(null);
  }

  const today = todayStr();
  const sorted = sortTodos(todos);
  const effPriority = priority ?? parsed.priority ?? 'medium';
  const effDue = dueDate ?? parsed.dueDate;

  return (
    <>
      <p className="font-body text-[0.95rem] text-[var(--color-ink-soft)] -mt-2 mb-5">
        Type it plainly — "essay draft p1 mon" sets the priority and the day for you
      </p>

      <Panel className="mb-6 shrink-0">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <label className="font-note text-xs text-[var(--color-ink-soft)]">What</label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. finish essay draft p1 mon"
              className="font-note border border-[var(--color-paper-line)] rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-faint)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-note text-xs text-[var(--color-ink-soft)]">Priority</label>
            <div className="flex gap-1">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(priority === p ? null : p)}
                  className="font-note text-sm px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    background: effPriority === p ? PRIORITY_META[p].color : 'transparent',
                    borderColor: effPriority === p ? PRIORITY_META[p].color : 'var(--color-paper-line)',
                  }}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-note text-xs text-[var(--color-ink-soft)]">Due date</label>
            <DateField value={effDue} onChange={setDueDate} placeholder="pick a date" />
          </div>
          <button
            type="submit"
            className="font-note bg-[var(--color-ink)] text-[var(--color-paper)] px-4 py-2 rounded-sm hover:bg-[var(--color-accent)] transition-colors"
          >
            Add
          </button>
        </form>

        {parsed.matched.length > 0 && (
          <p className="font-note text-xs text-[var(--color-ink-soft)] mt-2">
            reading that as <span className="text-[var(--color-ink)]">“{parsed.text}”</span>
            {' · '}
            {parsed.matched.join(' · ')}
          </p>
        )}
      </Panel>

      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {sorted.length === 0 ? (
          <p className="font-note text-sm text-[var(--color-ink-soft)]">
            Nothing on your list yet — add something above.
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((t) => {
              const isOverdue = !t.done && !!t.dueDate && t.dueDate < today;
              return (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 font-note text-sm bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-sm px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleTodo(t.id)}
                    className="w-4 h-4 shrink-0 accent-[var(--color-note-denim)]"
                  />
                  <button
                    onClick={() => updateTodo(t.id, { priority: nextPriority(t.priority) })}
                    title={`Priority: ${PRIORITY_META[t.priority].label} (click to change)`}
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                    style={{ background: PRIORITY_META[t.priority].color }}
                  />

                  {editingId === t.id ? (
                    <input
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => saveEdit(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(t.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 font-note bg-transparent border-b border-dashed border-[var(--color-ink-soft)] outline-none min-w-0"
                    />
                  ) : (
                    <span
                      onClick={() => startEdit(t)}
                      className={`flex-1 cursor-text hover:underline decoration-dotted ${
                        t.done ? 'line-through text-[var(--color-ink-soft)]' : ''
                      }`}
                    >
                      {t.text}
                    </span>
                  )}

                  <DateField
                    compact
                    value={t.dueDate}
                    onChange={(v) => updateTodo(t.id, { dueDate: v })}
                    placeholder="+ date"
                    className={`font-note text-xs px-2 py-1 rounded-full border shrink-0 whitespace-nowrap ${
                      isOverdue
                        ? 'border-[var(--color-note-rust)] text-[var(--color-note-rust)]'
                        : t.dueDate
                        ? 'border-[var(--color-paper-line)] text-[var(--color-ink-soft)]'
                        : 'border-dashed border-[var(--color-paper-line)] text-[var(--color-ink-soft)]/50'
                    }`}
                  />

                  <button
                    onClick={() => removeTodo(t.id)}
                    className="font-note text-xs text-[var(--color-ink-soft)]/50 hover:text-red-600 shrink-0 px-1.5 -my-1 -mr-1"
                  >
                    delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

export { PRIORITY_META };
