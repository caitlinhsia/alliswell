import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Panel from '../components/Panel';
import ColorPicker from '../components/ColorPicker';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';
import { todayStr } from '../lib/date';

const DURATIONS = [15, 25, 45];

export default function StudyContent() {
  const subjects = useAppStore((s) => s.subjects);
  const addSubject = useAppStore((s) => s.addSubject);
  const updateSubject = useAppStore((s) => s.updateSubject);
  const removeSubject = useAppStore((s) => s.removeSubject);
  const studyTodos = useAppStore((s) => s.studyTodos);
  const addStudyTodo = useAppStore((s) => s.addStudyTodo);
  const updateStudyTodo = useAppStore((s) => s.updateStudyTodo);
  const toggleStudyTodo = useAppStore((s) => s.toggleStudyTodo);
  const removeStudyTodo = useAppStore((s) => s.removeStudyTodo);
  const studySessions = useAppStore((s) => s.studySessions);
  const logStudySession = useAppStore((s) => s.logStudySession);

  const [activeSubjectId, setActiveSubjectId] = useState(subjects[0]?.id ?? '');
  const [newSubject, setNewSubject] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTodoText, setEditTodoText] = useState('');
  const [duration, setDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeSubjectId && subjects.length > 0) setActiveSubjectId(subjects[0].id);
  }, [subjects, activeSubjectId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            window.clearInterval(intervalRef.current!);
            setRunning(false);
            if (activeSubjectId) logStudySession(activeSubjectId, duration);
            return duration * 60;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function resetTimer(mins: number) {
    setRunning(false);
    setDuration(mins);
    setSecondsLeft(mins * 60);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const todayMinutes = studySessions
    .filter((s) => s.date === todayStr())
    .reduce((sum, s) => sum + s.minutes, 0);

  const subjectTodos = studyTodos.filter((t) => t.subjectId === activeSubjectId);
  const recentSessions = [...studySessions].sort((a, b) => b.completedAt - a.completedAt).slice(0, 8);

  return (
    <>
      <p className="font-body text-[0.95rem] text-[var(--color-ink-soft)] -mt-2 mb-5">
        {todayMinutes} minutes focused today
      </p>

      <div className="flex-1 overflow-y-auto -mx-1 px-1">
      <div className="grid md:grid-cols-2 gap-5">
        <Panel>
          <h3 className="font-display text-xl mb-3">Focus timer</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSubjectId(s.id)}
                disabled={running}
                className="font-note text-sm px-3 py-1.5 rounded-sm border transition-colors disabled:opacity-40"
                style={{
                  background:
                    activeSubjectId === s.id
                      ? `color-mix(in srgb, ${NOTE_COLORS[s.color]} 20%, var(--color-paper))`
                      : 'transparent',
                  borderColor:
                    activeSubjectId === s.id
                      ? `color-mix(in srgb, ${NOTE_COLORS[s.color]} 55%, transparent)`
                      : 'var(--color-paper-line)',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="text-center">
            <p className="font-hand text-7xl tabular-nums">
              {mm}:{ss}
            </p>
            <div className="flex justify-center gap-2 mt-3">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => resetTimer(d)}
                  disabled={running}
                  className={`font-note text-xs px-2.5 py-1 rounded-sm border disabled:opacity-40 ${
                    duration === d
                      ? 'border-[var(--color-ink)] bg-[var(--color-paper-deep)]'
                      : 'border-[var(--color-paper-line)]'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => setRunning((r) => !r)}
                disabled={!activeSubjectId}
                className="btn-primary"
              >
                {running ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => resetTimer(duration)}
                className="btn"
              >
                Reset
              </button>
            </div>
            {!activeSubjectId && (
              <p className="font-note text-xs text-[var(--color-ink-soft)] mt-2">
                Add a subject below to start timing.
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display text-xl mb-3">Subjects</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newSubject.trim()) return;
              const color = NOTE_COLOR_LIST[subjects.length % NOTE_COLOR_LIST.length];
              addSubject(newSubject.trim(), color);
              setNewSubject('');
            }}
            className="flex gap-2 mb-3"
          >
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="New subject"
              className="flex-1 font-note border border-[var(--color-paper-line)] rounded-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-faint)]"
            />
            <button type="submit" className="btn-primary">
              Add
            </button>
          </form>
          <ul className="space-y-1.5 mb-4">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between font-note text-sm gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <ColorPicker
                    size="sm"
                    value={s.color}
                    onChange={(c) => updateSubject(s.id, { color: c })}
                    label={`Change ${s.name} color`}
                  />
                  <span className="truncate">{s.name}</span>
                </span>
                <button
                  onClick={() => removeSubject(s.id)}
                  className="text-[var(--color-ink-soft)] hover:text-red-500 text-xs shrink-0"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>

          <h4 className="font-display text-lg mb-2">
            To-dos {subjects.find((s) => s.id === activeSubjectId)?.name && `· ${subjects.find((s) => s.id === activeSubjectId)?.name}`}
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTodo.trim() || !activeSubjectId) return;
              addStudyTodo(activeSubjectId, newTodo.trim());
              setNewTodo('');
            }}
            className="flex gap-2 mb-2"
          >
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a to-do"
              disabled={!activeSubjectId}
              className="flex-1 font-note border border-[var(--color-paper-line)] rounded-sm px-3 py-1.5 disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!activeSubjectId}
              className="btn"
            >
              Add
            </button>
          </form>
          <ul className="space-y-1">
            {subjectTodos.map((t) => (
              <li key={t.id} className="flex items-center gap-2 font-note text-sm">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleStudyTodo(t.id)}
                  className="accent-[var(--color-accent)]"
                />
                {editingTodoId === t.id ? (
                  <input
                    autoFocus
                    value={editTodoText}
                    onChange={(e) => setEditTodoText(e.target.value)}
                    onBlur={() => {
                      if (editTodoText.trim()) updateStudyTodo(t.id, editTodoText.trim());
                      setEditingTodoId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editTodoText.trim()) updateStudyTodo(t.id, editTodoText.trim());
                        setEditingTodoId(null);
                      }
                      if (e.key === 'Escape') setEditingTodoId(null);
                    }}
                    className="flex-1 font-note bg-transparent border-b border-dashed border-[var(--color-ink-soft)] outline-none min-w-0"
                  />
                ) : (
                  <span
                    onClick={() => {
                      setEditingTodoId(t.id);
                      setEditTodoText(t.text);
                    }}
                    className={`flex-1 cursor-text hover:underline decoration-dotted ${
                      t.done ? 'line-through text-[var(--color-ink-soft)]' : ''
                    }`}
                  >
                    {t.text}
                  </span>
                )}
                <button
                  onClick={() => removeStudyTodo(t.id)}
                  className="text-[var(--color-ink-soft)]/40 hover:text-red-500 shrink-0 px-1.5 -my-1 -mr-1"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-5">
        <h3 className="font-display text-xl mb-3">Recent sessions</h3>
        {recentSessions.length === 0 ? (
          <p className="font-note text-sm text-[var(--color-ink-soft)]">
            Completed sessions will show up here.
          </p>
        ) : (
          <ul className="font-note text-sm space-y-1">
            {recentSessions.map((sess) => (
              <li key={sess.id} className="flex justify-between text-[var(--color-ink-soft)]">
                <span>{subjects.find((s) => s.id === sess.subjectId)?.name ?? 'Deleted subject'}</span>
                <span>
                  {sess.minutes} min · {sess.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      </div>
    </>
  );
}
