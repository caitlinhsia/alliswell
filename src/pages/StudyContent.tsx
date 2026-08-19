import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Panel from '../components/Panel';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';
import { todayStr } from '../lib/date';

const DURATIONS = [15, 25, 45];

export default function StudyContent() {
  const subjects = useAppStore((s) => s.subjects);
  const addSubject = useAppStore((s) => s.addSubject);
  const removeSubject = useAppStore((s) => s.removeSubject);
  const studyTodos = useAppStore((s) => s.studyTodos);
  const addStudyTodo = useAppStore((s) => s.addStudyTodo);
  const toggleStudyTodo = useAppStore((s) => s.toggleStudyTodo);
  const removeStudyTodo = useAppStore((s) => s.removeStudyTodo);
  const studySessions = useAppStore((s) => s.studySessions);
  const logStudySession = useAppStore((s) => s.logStudySession);

  const [activeSubjectId, setActiveSubjectId] = useState(subjects[0]?.id ?? '');
  const [newSubject, setNewSubject] = useState('');
  const [newTodo, setNewTodo] = useState('');
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
      <p className="font-hand text-xl text-[var(--color-ink-soft)] -mt-2 mb-4">
        {todayMinutes} minutes focused today
      </p>

      <div className="flex-1 overflow-y-auto -mx-1 px-1">
      <div className="grid md:grid-cols-2 gap-5">
        <Panel>
          <h3 className="font-hand text-2xl mb-3">Focus timer</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSubjectId(s.id)}
                disabled={running}
                className="font-note text-sm px-3 py-1.5 rounded-full border disabled:opacity-40"
                style={{
                  background: activeSubjectId === s.id ? NOTE_COLORS[s.color] : 'transparent',
                  borderColor: 'var(--color-paper-line)',
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
                  className={`font-note text-xs px-2.5 py-1 rounded-lg border disabled:opacity-40 ${
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
                className="font-note bg-[var(--color-tab-sage)] px-5 py-2 rounded-lg disabled:opacity-40"
              >
                {running ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => resetTimer(duration)}
                className="font-note border border-[var(--color-paper-line)] px-5 py-2 rounded-lg"
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
          <h3 className="font-hand text-2xl mb-3">Subjects</h3>
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
              className="flex-1 font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-tab-sage)]"
            />
            <button type="submit" className="font-note bg-[var(--color-tab-sage)] px-3 py-1.5 rounded-lg">
              Add
            </button>
          </form>
          <ul className="space-y-1.5 mb-4">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between font-note text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ background: NOTE_COLORS[s.color] }}
                  />
                  {s.name}
                </span>
                <button
                  onClick={() => removeSubject(s.id)}
                  className="text-[var(--color-ink-soft)] hover:text-red-500 text-xs"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>

          <h4 className="font-hand text-xl mb-2">
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
              className="flex-1 font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-1.5 disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!activeSubjectId}
              className="font-note border border-[var(--color-paper-line)] px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Add
            </button>
          </form>
          <ul className="space-y-1">
            {subjectTodos.map((t) => (
              <li key={t.id} className="flex items-center gap-2 font-note text-sm group">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleStudyTodo(t.id)}
                  className="accent-[var(--color-tab-sage)]"
                />
                <span className={`flex-1 ${t.done ? 'line-through text-[var(--color-ink-soft)]' : ''}`}>
                  {t.text}
                </span>
                <button
                  onClick={() => removeStudyTodo(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--color-ink-soft)] hover:text-red-500"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-5">
        <h3 className="font-hand text-2xl mb-3">Recent sessions</h3>
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
