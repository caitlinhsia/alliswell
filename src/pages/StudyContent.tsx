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
  // the same to-do list the To-Do page shows, narrowed to this subject
  const todos = useAppStore((s) => s.todos);
  const addTodo = useAppStore((s) => s.addTodo);
  const updateTodo = useAppStore((s) => s.updateTodo);
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const removeTodo = useAppStore((s) => s.removeTodo);
  const studySessions = useAppStore((s) => s.studySessions);
  const logStudySession = useAppStore((s) => s.logStudySession);

  const [activeSubjectId, setActiveSubjectId] = useState(subjects[0]?.id ?? '');
  const [newSubject, setNewSubject] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTodoText, setEditTodoText] = useState('');
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [duration, setDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeSubjectId && subjects.length > 0) setActiveSubjectId(subjects[0].id);
  }, [subjects, activeSubjectId]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      if (mode === 'stopwatch') {
        setElapsed((e) => e + 1);
        return;
      }
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
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  function resetTimer(mins: number) {
    setRunning(false);
    setDuration(mins);
    setSecondsLeft(mins * 60);
  }

  /** Stop the stopwatch and bank whole minutes against the subject. */
  function finishStopwatch() {
    setRunning(false);
    const mins = Math.round(elapsed / 60);
    if (mins > 0 && activeSubjectId) logStudySession(activeSubjectId, mins);
    setElapsed(0);
    setLaps([]);
  }

  const shown = mode === 'stopwatch' ? elapsed : secondsLeft;
  const hh = Math.floor(shown / 3600);
  const mm = String(Math.floor((shown % 3600) / 60)).padStart(2, '0');
  const ss = String(shown % 60).padStart(2, '0');
  const clock = hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;

  const todayMinutes = studySessions
    .filter((s) => s.date === todayStr())
    .reduce((sum, s) => sum + s.minutes, 0);

  const subjectTodos = todos.filter((t) => t.subjectId === activeSubjectId && !t.done);
  const subjectDone = todos.filter((t) => t.subjectId === activeSubjectId && t.done);
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
            <div className="flex justify-center gap-4 mb-2">
              {(['countdown', 'stopwatch'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setRunning(false);
                    setMode(m);
                  }}
                  className={`label pb-1 border-b transition-colors ${
                    mode === m
                      ? 'text-[var(--color-ink)] border-[var(--color-accent)]'
                      : 'text-[var(--color-ink-faint)] border-transparent hover:text-[var(--color-ink-soft)]'
                  }`}
                >
                  {m === 'countdown' ? 'Timer' : 'Stopwatch'}
                </button>
              ))}
            </div>

            <p className="font-hand text-6xl tabular-nums">{clock}</p>

            {mode === 'countdown' ? (
              <>
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
                  <button onClick={() => resetTimer(duration)} className="btn">
                    Reset
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center gap-3 mt-4">
                  <button
                    onClick={() => setRunning((r) => !r)}
                    disabled={!activeSubjectId}
                    className="btn-primary"
                  >
                    {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
                  </button>
                  <button
                    onClick={() => setLaps((l) => [elapsed, ...l])}
                    disabled={!running}
                    className="btn"
                  >
                    Lap
                  </button>
                  <button onClick={finishStopwatch} disabled={elapsed === 0} className="btn">
                    Finish
                  </button>
                </div>
                <p className="label mt-2">
                  {elapsed === 0
                    ? 'counts up · Finish banks the minutes'
                    : `${Math.round(elapsed / 60)} min so far`}
                </p>
                {laps.length > 0 && (
                  <ul className="mt-3 max-h-24 overflow-y-auto text-left mx-auto w-40">
                    {laps.map((l, i) => (
                      <li
                        key={i}
                        className="flex justify-between font-mono-num text-[0.7rem] text-[var(--color-ink-soft)] border-b border-[var(--color-paper-line)]/60 py-0.5"
                      >
                        <span>lap {laps.length - i}</span>
                        <span>
                          {String(Math.floor(l / 60)).padStart(2, '0')}:
                          {String(l % 60).padStart(2, '0')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
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
              addTodo(newTodo.trim(), 'medium', undefined, activeSubjectId);
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
          {subjectTodos.length === 0 && subjectDone.length === 0 && activeSubjectId && (
            <p className="font-note text-sm text-[var(--color-ink-soft)]">
              Nothing for this subject yet. Anything added here shows up on the To-Do page too.
            </p>
          )}
          <ul className="space-y-1">
            {subjectTodos.map((t) => (
              <li key={t.id} className="flex items-center gap-2 font-note text-sm">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTodo(t.id)}
                  className="accent-[var(--color-accent)]"
                />
                {editingTodoId === t.id ? (
                  <input
                    autoFocus
                    value={editTodoText}
                    onChange={(e) => setEditTodoText(e.target.value)}
                    onBlur={() => {
                      if (editTodoText.trim()) updateTodo(t.id, { text: editTodoText.trim() });
                      setEditingTodoId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editTodoText.trim()) updateTodo(t.id, { text: editTodoText.trim() });
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
                  onClick={() => removeTodo(t.id)}
                  className="text-[var(--color-ink-soft)]/40 hover:text-red-500 shrink-0 px-1.5 -my-1 -mr-1"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {subjectDone.length > 0 && (
            <details className="mt-3">
              <summary className="label cursor-pointer hover:text-[var(--color-ink)]">
                done · {subjectDone.length}
              </summary>
              <ul className="space-y-1 mt-1.5">
                {subjectDone.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 font-note text-sm">
                    <input
                      type="checkbox"
                      checked
                      onChange={() => toggleTodo(t.id)}
                      className="accent-[var(--color-accent)]"
                    />
                    <span className="line-through text-[var(--color-ink-soft)] truncate">
                      {t.text}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
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
