import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAppStore, type DeskPageKey, type FrontWidgetKey } from '../store/useAppStore';
import NotepadPage from '../components/NotepadPage';
import StickyLayer from '../components/StickyLayer';
import FoldOutSpread, { FoldPane } from '../components/FoldOutSpread';
import ScheduleContent from './ScheduleContent';
import StudyContent from './StudyContent';
import JournalContent from './JournalContent';
import NotesBoard from './NotesBoard';
import TodoContent from './TodoContent';
import WriteContent from './WriteContent';
import { todayStr, greeting } from '../lib/date';
import { MOODS, moodMeta } from '../lib/mood';
import { NOTE_COLORS, NOTE_COLOR_LIST } from '../lib/colors';

const PAGE_META: Record<DeskPageKey, { title: string; emoji: string }> = {
  schedule: { title: 'schedule', emoji: '🗓️' },
  todo: { title: 'to-do', emoji: '✅' },
  study: { title: 'study', emoji: '📚' },
  journal: { title: 'journal', emoji: '📝' },
  write: { title: 'notes', emoji: '📓' },
  notes: { title: 'sticky board', emoji: '📌' },
};

const FLIP_ORDER: ('front' | DeskPageKey)[] = [
  'front',
  'schedule',
  'todo',
  'study',
  'journal',
  'write',
  'notes',
];
const ROTATIONS = [1.5, -1.5, 2, -2, 1, -1, 1.5];

// A real top-bound notebook: going forward the current page lifts up and over the
// binding; going back the previous page swings down from above onto the stack.
const pageVariants = {
  enter: (dir: number) =>
    dir > 0
      ? { rotateX: 0, opacity: 0, scale: 0.98, zIndex: 0 }
      : { rotateX: -105, opacity: 1, scale: 1, zIndex: 2 },
  center: { rotateX: 0, opacity: 1, scale: 1, zIndex: 1 },
  exit: (dir: number) =>
    dir > 0
      ? { rotateX: -105, opacity: 1, scale: 1, zIndex: 2 }
      : { rotateX: 0, opacity: 0, scale: 0.98, zIndex: 0 },
};

const FRONT_WIDGET_META: Record<FrontWidgetKey, { label: string; emoji: string }> = {
  mood: { label: 'Mood check-in', emoji: '🌤️' },
  schedule: { label: "Today's schedule", emoji: '🗓️' },
  todo: { label: 'To-do list', emoji: '✅' },
  study: { label: 'Study minutes', emoji: '📚' },
  write: { label: 'Notes', emoji: '📓' },
  notes: { label: 'Sticky board', emoji: '📌' },
};

function renderFrontWidget(key: FrontWidgetKey, compact: boolean) {
  switch (key) {
    case 'mood':
      return <MoodWidget compact={compact} />;
    case 'schedule':
      return <MiniSchedule />;
    case 'todo':
      return <MiniTodo />;
    case 'study':
      return <MiniStudy />;
    case 'write':
      return <MiniWrite />;
    case 'notes':
      return <MiniNotes />;
  }
}

function renderFullContent(key: DeskPageKey) {
  switch (key) {
    case 'schedule':
      return <ScheduleContent />;
    case 'todo':
      return <TodoContent />;
    case 'study':
      return <StudyContent />;
    case 'journal':
      return <JournalContent />;
    case 'write':
      return <WriteContent />;
    case 'notes':
      return <NotesBoard />;
  }
}

function renderMini(key: DeskPageKey) {
  switch (key) {
    case 'schedule':
      return <MiniSchedule />;
    case 'todo':
      return <MiniTodo />;
    case 'study':
      return <MiniStudy />;
    case 'journal':
      return <MiniJournal />;
    case 'write':
      return <MiniWrite />;
    case 'notes':
      return <MiniNotes />;
  }
}

export default function Notebook() {
  const homeViewMode = useAppStore((s) => s.homeViewMode);
  const setHomeViewMode = useAppStore((s) => s.setHomeViewMode);
  const [flipIndex, setFlipIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  function goToPage(key: DeskPageKey) {
    const idx = FLIP_ORDER.indexOf(key);
    if (idx === -1) return;
    setDirection(idx > flipIndex ? 1 : -1);
    setFlipIndex(idx);
    setHomeViewMode('flip');
  }

  function goToCover() {
    setDirection(-1);
    setFlipIndex(0);
    setHomeViewMode('flip');
  }

  return (
    <div className="h-screen overflow-hidden desk-background p-3 md:p-4 flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={goToCover}
            aria-label="Go to cover"
            title="Go to cover"
            className="font-note text-sm px-3 py-1.5 rounded-full border border-[var(--color-paper-line)] bg-[var(--color-paper)]/90 backdrop-blur-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-soft)] flex items-center gap-1.5 transition-colors"
          >
            🏠 cover
          </button>
          <p className="font-hand text-lg text-[var(--color-ink-soft)]">
            {greeting()} — {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="inline-flex rounded-full border border-[var(--color-paper-line)] p-1 bg-[var(--color-paper)]/90 backdrop-blur-sm">
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

      {homeViewMode === 'flip' ? (
        <FlipView index={flipIndex} setIndex={setFlipIndex} direction={direction} setDirection={setDirection} />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <DeskView onOpenFull={goToPage} />
        </div>
      )}
    </div>
  );
}

function FlipView({
  index,
  setIndex,
  direction,
  setDirection,
}: {
  index: number;
  setIndex: (i: number) => void;
  direction: number;
  setDirection: (d: number) => void;
}) {
  const page = FLIP_ORDER[index];

  function go(delta: number) {
    setDirection(delta);
    setIndex((index + delta + FLIP_ORDER.length) % FLIP_ORDER.length);
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center">
      <div
        className="relative w-full max-w-[1600px] mx-auto flex-1 min-h-0"
        style={{ perspective: '2200px', perspectiveOrigin: 'center top' }}
      >
        {/* ambient shadow grounding the book on the desk */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-5 w-[85%] h-14 rounded-[50%] bg-black/25 blur-2xl pointer-events-none"
          aria-hidden
        />

        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={page}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-0"
            style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
          >
            {page === 'front' ? (
              <NotepadPage fill ringCount={24}>
                <FrontPage />
                <StickyLayer page="front" />
              </NotepadPage>
            ) : (
              <NotepadPage fill ringCount={24} title={PAGE_META[page].title} emoji={PAGE_META[page].emoji}>
                {renderFullContent(page)}
                {page !== 'notes' && page !== 'write' && <StickyLayer page={page} />}
              </NotepadPage>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      <div className="flex items-center gap-4 mt-3 shrink-0">
        <button
          onClick={() => go(-1)}
          aria-label="Previous page"
          title="Previous page"
          className="w-10 h-10 rounded-full border border-[var(--color-paper-line)] bg-[var(--color-paper)] text-xl leading-none text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-soft)] shadow-md hover:shadow-lg transition-all flex items-center justify-center"
        >
          ↑
        </button>

        <div className="flex gap-2">
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

        <button
          onClick={() => go(1)}
          aria-label="Next page"
          title="Next page"
          className="w-10 h-10 rounded-full border border-[var(--color-paper-line)] bg-[var(--color-paper)] text-xl leading-none text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-soft)] shadow-md hover:shadow-lg transition-all flex items-center justify-center"
        >
          ↓
        </button>
      </div>
    </div>
  );
}

function DeskView({ onOpenFull }: { onOpenFull: (key: DeskPageKey) => void }) {
  const deskGroups = useAppStore((s) => s.deskGroups);
  const openDeskPage = useAppStore((s) => s.openDeskPage);
  const closeDeskPage = useAppStore((s) => s.closeDeskPage);
  const mergeDeskPage = useAppStore((s) => s.mergeDeskPage);
  const splitDeskPage = useAppStore((s) => s.splitDeskPage);

  const openKeys = new Set(deskGroups.flat());

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(PAGE_META) as DeskPageKey[])
            .filter((k) => !openKeys.has(k))
            .map((k) => (
              <button
                key={k}
                onClick={() => openDeskPage(k)}
                className="font-note text-sm px-3 py-1.5 rounded-full border border-dashed border-[var(--color-ink-soft)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-deep)]"
              >
                + open {PAGE_META[k].title}
              </button>
            ))}
        </div>
        <p className="font-note text-xs text-[var(--color-ink-soft)]">
          drag a page's dotted edge onto another to fold them together · drag a corner to resize
        </p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const draggedId = e.dataTransfer.getData('text/plain');
          if (draggedId) splitDeskPage(draggedId as DeskPageKey);
        }}
        className="flex flex-wrap items-start gap-x-10 gap-y-14 min-h-[50vh]"
      >
        <NotepadPage rotate={-1.5} ringCount={6} className="w-64">
          <FrontPage compact />
        </NotepadPage>

        {deskGroups.map((group, i) =>
          group.length === 1 ? (
            <NotepadPage
              key={group[0]}
              title={PAGE_META[group[0]].title}
              emoji={PAGE_META[group[0]].emoji}
              rotate={ROTATIONS[i % ROTATIONS.length]}
              onClose={() => closeDeskPage(group[0])}
              className="w-72"
              resizable
              dragHandle={{ id: group[0], onDrop: (draggedId) => mergeDeskPage(draggedId as DeskPageKey, group[0]) }}
            >
              {renderMini(group[0])}
              <button
                onClick={() => onOpenFull(group[0])}
                className="font-note text-xs underline text-[var(--color-ink-soft)] block mt-2"
              >
                open full page →
              </button>
            </NotepadPage>
          ) : (
            <FoldOutSpread
              key={group.join('-')}
              rotate={ROTATIONS[i % ROTATIONS.length]}
              ringCount={6 * group.length}
              onDropInto={(draggedId) => mergeDeskPage(draggedId as DeskPageKey, group[0])}
            >
              {group.map((key, pi) => (
                <FoldPane
                  key={key}
                  id={key}
                  title={PAGE_META[key].title}
                  emoji={PAGE_META[key].emoji}
                  isFirst={pi === 0}
                  onClose={() => closeDeskPage(key)}
                >
                  {renderMini(key)}
                  <button
                    onClick={() => onOpenFull(key)}
                    className="font-note text-xs underline text-[var(--color-ink-soft)] block mt-2"
                  >
                    open full page →
                  </button>
                </FoldPane>
              ))}
            </FoldOutSpread>
          )
        )}
      </div>
    </div>
  );
}

function FrontPage({ compact = false }: { compact?: boolean }) {
  const userName = useAppStore((s) => s.userName);
  const setUserName = useAppStore((s) => s.setUserName);
  const frontPageWidgets = useAppStore((s) => s.frontPageWidgets);
  const addFrontWidget = useAppStore((s) => s.addFrontWidget);
  const removeFrontWidget = useAppStore((s) => s.removeFrontWidget);

  const [now, setNow] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const availableWidgets = (Object.keys(FRONT_WIDGET_META) as FrontWidgetKey[]).filter(
    (k) => !frontPageWidgets.includes(k)
  );

  return (
    <div
      className={`flex flex-col items-center text-center ${
        compact ? 'gap-4' : 'h-full pt-[8%] gap-8'
      }`}
    >
      <div>
        <p
          className={`font-hand leading-tight text-[var(--color-ink)] ${
            compact ? 'text-4xl' : 'text-6xl md:text-7xl'
          }`}
        >
          allisw3ll
        </p>
        <div
          className={`font-hand text-[var(--color-ink-soft)] flex items-center justify-center gap-2 mt-2 ${
            compact ? 'text-xl' : 'text-3xl'
          }`}
        >
          with
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="your name"
            size={Math.max(userName.length, 8)}
            className={`font-hand bg-transparent border-b border-dashed border-[var(--color-ink-soft)]/50 focus:border-[var(--color-ink)] outline-none text-center placeholder:text-[var(--color-ink-soft)]/50 ${
              compact ? 'text-xl' : 'text-3xl'
            }`}
          />
        </div>
      </div>

      <div>
        <p
          className={`font-hand tabular-nums text-[var(--color-ink)] ${
            compact ? 'text-3xl' : 'text-6xl md:text-7xl'
          }`}
        >
          {format(now, 'h:mm')}
          <span className={compact ? 'text-base text-[var(--color-ink-soft)]' : 'text-2xl md:text-3xl text-[var(--color-ink-soft)]'}>
            {format(now, ' a')}
          </span>
        </p>
        <p className={`font-note text-[var(--color-ink-soft)] mt-1 ${compact ? 'text-xs' : 'text-lg'}`}>
          {format(now, compact ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {frontPageWidgets.length > 0 && (
        <div className="flex flex-wrap items-start justify-center gap-4">
          {frontPageWidgets.map((key) => (
            <div
              key={key}
              className={`relative group ${
                compact ? '' : 'border border-[var(--color-paper-line)] rounded-xl bg-[var(--color-paper)]/70 p-4'
              }`}
            >
              {!compact && (
                <button
                  onClick={() => removeFrontWidget(key)}
                  aria-label={`Remove ${FRONT_WIDGET_META[key].label}`}
                  className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-[var(--color-paper)] border border-[var(--color-paper-line)] text-sm text-[var(--color-ink-soft)]/60 hover:text-red-500 transition-colors flex items-center justify-center"
                >
                  ×
                </button>
              )}
              {renderFrontWidget(key, compact)}
            </div>
          ))}
        </div>
      )}

      {!compact && availableWidgets.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-label="Add widget"
            className="w-10 h-10 rounded-full border border-dashed border-[var(--color-ink-soft)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink)] flex items-center justify-center text-xl leading-none transition-colors"
          >
            +
          </button>
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
              <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-xl shadow-lg p-2 flex flex-col gap-1 w-56">
                {availableWidgets.map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      addFrontWidget(key);
                      setPickerOpen(false);
                    }}
                    className="font-note text-sm text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-paper-deep)] flex items-center gap-2"
                  >
                    <span>{FRONT_WIDGET_META[key].emoji}</span>
                    {FRONT_WIDGET_META[key].label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MoodWidget({ compact }: { compact: boolean }) {
  const journalEntries = useAppStore((s) => s.journalEntries);
  const upsertJournalEntry = useAppStore((s) => s.upsertJournalEntry);
  const today = todayStr();
  const todayEntry = journalEntries.find((e) => e.date === today);

  return (
    <div className="flex gap-2">
      {MOODS.map((m) => (
        <button
          key={m.value}
          onClick={() => upsertJournalEntry(today, m.value, todayEntry?.text ?? '')}
          title={m.label}
          className={`rounded-full border flex items-center justify-center transition-colors ${
            compact ? 'text-lg w-8 h-8' : 'text-2xl w-12 h-12'
          } ${
            todayEntry?.mood === m.value
              ? 'border-[var(--color-ink)] bg-[var(--color-paper-deep)]'
              : 'border-transparent hover:bg-[var(--color-paper-deep)]/60'
          }`}
        >
          {m.emoji}
        </button>
      ))}
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
    </div>
  );
}

const MINI_PRIORITY_COLOR: Record<string, string> = {
  high: 'var(--color-tab-blush)',
  medium: 'var(--color-tab-butter)',
  low: 'var(--color-tab-sage)',
};

function MiniTodo() {
  const todos = useAppStore((s) => s.todos);
  const addTodo = useAppStore((s) => s.addTodo);
  const toggleTodo = useAppStore((s) => s.toggleTodo);
  const [text, setText] = useState('');

  const order = { high: 0, medium: 1, low: 2 } as const;
  const items = [...todos]
    .filter((t) => !t.done)
    .sort((a, b) => order[a.priority] - order[b.priority] || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
    .slice(0, 4);

  return (
    <div>
      {items.length === 0 ? (
        <p className="font-note text-sm text-[var(--color-ink-soft)] mb-2">Nothing on your list.</p>
      ) : (
        <ul className="space-y-1.5 mb-2 max-h-40 overflow-y-auto">
          {items.map((t) => (
            <li key={t.id} className="flex items-center gap-2 font-note text-sm">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTodo(t.id)}
                className="accent-[var(--color-tab-sky)] w-4 h-4 shrink-0"
              />
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: MINI_PRIORITY_COLOR[t.priority] }}
              />
              <span className="truncate">{t.text}</span>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addTodo(text.trim(), 'medium');
          setText('');
        }}
        className="flex gap-1.5"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="quick add..."
          className="flex-1 font-note text-sm border border-[var(--color-paper-line)] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-tab-sky)]"
        />
        <button type="submit" className="font-note text-sm bg-[var(--color-tab-sky)] px-2.5 rounded-lg">
          +
        </button>
      </form>
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
    </div>
  );
}

function MiniWrite() {
  const writeNoteHtml = useAppStore((s) => s.writeNoteHtml);
  const stickyNotes = useAppStore((s) => s.stickyNotes);
  const mindMapNodes = useAppStore((s) => s.mindMapNodes);
  const writeStickyNotes = stickyNotes.filter((n) => n.page === 'write');

  const preview = writeNoteHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);

  return (
    <div>
      {preview ? (
        <p className="font-note text-sm text-[var(--color-ink-soft)] mb-2 line-clamp-3">{preview}…</p>
      ) : (
        <p className="font-note text-sm text-[var(--color-ink-soft)] mb-2">
          A lined page for writing, sticky notes, and a mind map.
        </p>
      )}
      <p className="font-note text-xs text-[var(--color-ink-soft)]">
        {writeStickyNotes.length} sticky note{writeStickyNotes.length === 1 ? '' : 's'} · {mindMapNodes.length} mind
        map bubble{mindMapNodes.length === 1 ? '' : 's'}
      </p>
    </div>
  );
}

function MiniNotes() {
  const stickyNotes = useAppStore((s) => s.stickyNotes);
  const addStickyNote = useAppStore((s) => s.addStickyNote);
  const pinned = stickyNotes
    .filter((n) => n.page === 'board')
    .sort((a, b) => b.z - a.z)
    .slice(0, 2);

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
            'board',
            NOTE_COLOR_LIST[Math.floor(Math.random() * NOTE_COLOR_LIST.length)],
            80 + Math.random() * 200,
            80 + Math.random() * 200
          )
        }
        className="font-note text-sm border border-[var(--color-paper-line)] rounded-lg px-2.5 py-1"
      >
        + quick note
      </button>
    </div>
  );
}
