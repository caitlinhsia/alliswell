import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import Panel from '../components/Panel';
import { todayStr } from '../lib/date';
import type { Priority, TodoItem } from '../types';

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: 'High', color: 'var(--color-tab-blush)' },
  medium: { label: 'Medium', color: 'var(--color-tab-butter)' },
  low: { label: 'Low', color: 'var(--color-tab-sage)' },
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
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addTodo(text.trim(), priority, dueDate || undefined);
    setText('');
    setDueDate('');
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

  return (
    <>
      <p className="font-hand text-xl text-[var(--color-ink-soft)] -mt-2 mb-4">
        Priorities and dates, all in one list
      </p>

      <Panel className="mb-6 shrink-0">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="font-note text-xs text-[var(--color-ink-soft)]">What</label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Finish essay draft"
              className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-tab-sky)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-note text-xs text-[var(--color-ink-soft)]">Priority</label>
            <div className="flex gap-1">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="font-note text-sm px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    background: priority === p ? PRIORITY_META[p].color : 'transparent',
                    borderColor: priority === p ? PRIORITY_META[p].color : 'var(--color-paper-line)',
                  }}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-note text-xs text-[var(--color-ink-soft)]">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="font-note bg-[var(--color-tab-sky)] text-[var(--color-ink)] px-4 py-2 rounded-lg hover:opacity-90"
          >
            + Add
          </button>
        </form>
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
                  className="group flex items-center gap-3 font-note text-sm bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-xl px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleTodo(t.id)}
                    className="w-4 h-4 shrink-0 accent-[var(--color-tab-sky)]"
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

                  {editingDateId === t.id ? (
                    <input
                      autoFocus
                      type="date"
                      defaultValue={t.dueDate ?? ''}
                      onBlur={(e) => {
                        updateTodo(t.id, { dueDate: e.target.value || undefined });
                        setEditingDateId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingDateId(null);
                      }}
                      className="font-note text-xs border border-[var(--color-paper-line)] rounded-lg px-2 py-1"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingDateId(t.id)}
                      className={`font-note text-xs px-2 py-1 rounded-full border shrink-0 whitespace-nowrap ${
                        isOverdue
                          ? 'border-red-300 text-red-500 bg-red-50'
                          : t.dueDate
                          ? 'border-[var(--color-paper-line)] text-[var(--color-ink-soft)]'
                          : 'border-dashed border-[var(--color-paper-line)] text-[var(--color-ink-soft)]/50'
                      }`}
                    >
                      {t.dueDate ? format(parseISO(t.dueDate), 'MMM d') : '+ date'}
                    </button>
                  )}

                  <button
                    onClick={() => removeTodo(t.id)}
                    className="text-[var(--color-ink-soft)]/40 hover:text-red-500 shrink-0 px-1.5 -my-1 -mr-1"
                    aria-label="Delete"
                  >
                    ×
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
