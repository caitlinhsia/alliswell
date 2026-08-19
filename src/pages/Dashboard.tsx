import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAppStore, type DeskPageKey } from '../store/useAppStore';
import NotepadPage from '../components/NotepadPage';
import { todayStr, greeting } from '../lib/date';
import { MOODS, moodMeta } from '../lib/mood';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';

const PAGE_META: Record<DeskPageKey, { title: string; emoji: string }> = {
  schedule: { title: 'schedule', emoji: '🗓️' },
  study: { title: 'study', emoji: '📚' },
  journal: { title: 'journal', emoji: '📝' },
  notes: { title: 'notes', emoji: '📌' },
};

const FLIP_ORDER: ('front' | DeskPageKey)[] = ['front', 'schedule', 'study', 'journal', 'notes'];
const ROTATIONS = [1.5, -1.5, 2, -2, 1];

export default function Dashboard() {
  const homeViewMode = useAppStore((s) => s.homeViewMode);
  const setHomeViewMode = useAppStore((s) => s.setHomeViewMode);

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <p className="font-hand text-2xl text-[var(--color-ink-soft)]">
          {greeting()} — {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <div className="inline-flex rounded-full border border-[var(--color-paper-line)] p-1 bg-[var(--color-paper)]">
          <button
            onClick={() => setHomeViewMode('flip')}
            className={`font-note text-sm px-3 py-1 rounded-full transition-colors ${
              homeViewMode === 'flip'
                ? 'bg-[var(--color-tab-lavender)] text-[var(--color-ink)]'
                : 'text-[var(--color-ink-soft)]'
            }`}
          >
            📖 flip through
          </button>
          <button
            onClick={() => setHomeViewMode('desk')}
            className={`font-note text-sm px-3 py-1 rounded-full transition-colors ${
              homeViewMode === 'desk'
                ? 'bg-[var(--color-tab-lavender)] text-[var(--color-ink)]'
                : 'text-[var(--color-ink-soft)]'
            }`}
          >
            🗂️ all together
          </button>
        </div>
      </div>

      {homeViewMode === 'flip' ? <FlipView /> : <DeskView />}
    </div>
  );
}

function FlipView() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const page = FLIP_ORDER[index];

  function go(delta: number) {
    setDirection(delta);
    setIndex((i) => (i + delta + FLIP_ORDER.length) % FLIP_ORDER.length);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4 md:gap-8">
        <button
          onClick={() => go(-1)}
          aria-label="Previous page"
          className="font-hand text-4xl text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors px-2"
        >
          ‹
        </button>

        <div className="w-72 md:w-80 h-[360px] relative overflow-visible">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60, rotate: direction * 4 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: -direction * 60, rotate: -direction * 4 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {page === 'front' ? (
                <NotepadPage className="w-72 md:w-80">
                  <FrontPage />
                </NotepadPage>
              ) : (
                <NotepadPage title={PAGE_META[page].title} emoji={PAGE_META[page].emoji} className="w-72 md:w-80">
                  {page === 'schedule' && <MiniSchedule />}
                  {page === 'study' && <MiniStudy />}
                  {page === 'journal' && <MiniJournal />}
                  {page === 'notes' && <MiniNotes />}
                </NotepadPage>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => go(1)}
          aria-label="Next page"
          className="font-hand text-4xl text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors px-2"
        >
          ›
        </button>
      </div>

      <div className="flex gap-2 mt-8">
        {FLIP_ORDER.map((p, i) => (
          <button
            key={p}
            onClick={() => {
              setDirection(i > index ? 1 : -1);
              setIndex(i);
            }}
            aria-label={`Go to ${p} page`}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === index ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-paper-line)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function DeskView() {
  const openDeskPages = useAppStore((s) => s.openDeskPages);
  const toggleDeskPage = useAppStore((s) => s.toggleDeskPage);

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-8">
        {(Object.keys(PAGE_META) as DeskPageKey[])
          .filter((k) => !openDeskPages.includes(k))
          .map((k) => (
            <button
              key={k}
              onClick={() => toggleDeskPage(k)}
              className="font-note text-sm px-3 py-1.5 rounded-full border border-dashed border-[var(--color-ink-soft)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-deep)]"
            >
              + open {PAGE_META[k].title}
            </button>
          ))}
      </div>

      <div className="flex flex-wrap items-start gap-x-10 gap-y-14">
        <NotepadPage rotate={-1.5} ringCount={6} className="w-64">
          <FrontPage />
        </NotepadPage>

        {openDeskPages.map((key, i) => (
          <NotepadPage
            key={key}
            title={PAGE_META[key].title}
            emoji={PAGE_META[key].emoji}
            rotate={ROTATIONS[i % ROTATIONS.length]}
            onClose={() => toggleDeskPage(key)}
            className="w-72"
          >
            {key === 'schedule' && <MiniSchedule />}
            {key === 'study' && <MiniStudy />}
            {key === 'journal' && <MiniJournal />}
            {key === 'notes' && <MiniNotes />}
          </NotepadPage>
        ))}
      </div>
    </div>
  );
}

function FrontPage() {
  const userName = useAppStore((s) => s.userName);
  const setUserName = useAppStore((s) => s.setUserName);

  return (
    <div>
      <p className="font-hand text-4xl leading-tight text-[var(--color-ink)]">all is well</p>
      <div className="font-hand text-2xl text-[var(--color-ink-soft)] mb-4 flex items-center gap-1.5">
        with
        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="your name"
          size={Math.max(userName.length, 8)}
          className="font-hand text-2xl bg-transparent border-b border-dashed border-[var(--color-ink-soft)]/50 focus:border-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]/50"
        />
      </div>
      <p className="font-note text-sm text-[var(--color-ink-soft)]">{format(new Date(), 'MMMM d, yyyy')}</p>
      <p className="font-note text-xs text-[var(--color-ink-soft)] mt-4">
        your notebook — flip through pages, or lay them all out together.
      </p>
    </div>
  );
}

function MiniSchedule() {
  const today = todayStr();
  const schedule = useAppStore((s) => s.schedule);
  const addScheduleItem = useAppStore((s) => s.addScheduleItem);
  const toggleScheduleItem = useAppStore((s) => s.toggleScheduleItem);
  const [title, setTitle] = useState('');

  const items = schedule
    .filter((i) => i.date === today)
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));

  return (
    <div>
      {items.length === 0 ? (
        <p className="font-note text-sm text-[var(--color-ink-soft)] mb-2">Nothing planned yet.</p>
      ) : (
        <ul className="space-y-1.5 mb-2 max-h-40 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 font-note text-sm">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleScheduleItem(item.id)}
                className="accent-[var(--color-tab-sky)] w-4 h-4"
              />
              <span className={item.done ? 'line-through text-[var(--color-ink-soft)]' : ''}>
                {item.title}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addScheduleItem(title.trim(), today, undefined, 'task');
          setTitle('');
        }}
        className="flex gap-1.5"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="quick add..."
          className="flex-1 font-note text-sm border border-[var(--color-paper-line)] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-tab-sky)]"
        />
        <button type="submit" className="font-note text-sm bg-[var(--color-tab-sky)] px-2.5 rounded-lg">
          +
        </button>
      </form>
      <Link to="/schedule" className="font-note text-xs underline text-[var(--color-ink-soft)] block mt-2">
        open full week →
      </Link>
    </div>
  );
}

function MiniStudy() {
  const today = todayStr();
  const subjects = useAppStore((s) => s.subjects);
  const studySessions = useAppStore((s) => s.studySessions);
  const todaysMinutes = studySessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div>
      <p className="font-hand text-5xl text-[var(--color-tab-sage)]">
        {todaysMinutes}
        <span className="text-base font-note text-[var(--color-ink-soft)]"> min today</span>
      </p>
      <p className="font-note text-sm text-[var(--color-ink-soft)] mt-1">
        {subjects.length} subject{subjects.length === 1 ? '' : 's'} tracked
      </p>
      <Link to="/study" className="font-note text-xs underline text-[var(--color-ink-soft)] block mt-3">
        open focus timer →
      </Link>
    </div>
  );
}

function MiniJournal() {
  const today = todayStr();
  const journalEntries = useAppStore((s) => s.journalEntries);
  const upsertJournalEntry = useAppStore((s) => s.upsertJournalEntry);
  const todayEntry = journalEntries.find((e) => e.date === today);

  return (
    <div>
      <p className="font-note text-sm text-[var(--color-ink-soft)] mb-2">How's today going?</p>
      <div className="flex gap-1.5 mb-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => upsertJournalEntry(today, m.value, todayEntry?.text ?? '')}
            className={`text-lg w-8 h-8 rounded-full border flex items-center justify-center ${
              todayEntry?.mood === m.value
                ? 'border-[var(--color-ink)] bg-[var(--color-paper-deep)]'
                : 'border-transparent hover:bg-[var(--color-paper-deep)]/60'
            }`}
          >
            {m.emoji}
          </button>
        ))}
      </div>
      {todayEntry && (
        <p className="font-note text-xs text-[var(--color-ink-soft)]">
          feeling {moodMeta(todayEntry.mood).label.toLowerCase()}
        </p>
      )}
      <Link to="/journal" className="font-note text-xs underline text-[var(--color-ink-soft)] block mt-2">
        write more →
      </Link>
    </div>
  );
}

function MiniNotes() {
  const stickyNotes = useAppStore((s) => s.stickyNotes);
  const addStickyNote = useAppStore((s) => s.addStickyNote);
  const pinned = [...stickyNotes].sort((a, b) => b.z - a.z).slice(0, 2);

  return (
    <div>
      {pinned.length === 0 ? (
        <p className="font-note text-sm text-[var(--color-ink-soft)] mb-2">No sticky notes yet.</p>
      ) : (
        <div className="flex gap-2 mb-2 flex-wrap">
          {pinned.map((note) => (
            <div
              key={note.id}
              className="w-24 h-24 p-2 shadow font-note text-xs overflow-hidden"
              style={{ background: NOTE_COLORS[note.color] }}
            >
              {note.text || <span className="text-[var(--color-ink-soft)]">(empty)</span>}
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() =>
          addStickyNote(
            NOTE_COLOR_LIST[Math.floor(Math.random() * NOTE_COLOR_LIST.length)],
            80 + Math.random() * 200,
            80 + Math.random() * 200
          )
        }
        className="font-note text-sm border border-[var(--color-paper-line)] rounded-lg px-2.5 py-1"
      >
        + quick note
      </button>
      <Link to="/notes" className="font-note text-xs underline text-[var(--color-ink-soft)] block mt-2">
        open corkboard →
      </Link>
    </div>
  );
}
