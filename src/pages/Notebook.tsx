import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAppStore, type DeskPageKey, type FrontWidgetKey } from '../store/useAppStore';
import NotepadPage from '../components/NotepadPage';
import StickyLayer from '../components/StickyLayer';
import Icon, { type IconName } from '../components/Icon';
import AccountMenu from '../components/AccountMenu';
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

const PAGE_META: Record<DeskPageKey, { title: string; icon: IconName }> = {
  schedule: { title: 'schedule', icon: 'schedule' },
  todo: { title: 'to-do', icon: 'todo' },
  study: { title: 'study', icon: 'study' },
  journal: { title: 'journal', icon: 'journal' },
  write: { title: 'notes', icon: 'notes' },
  notes: { title: 'sticky board', icon: 'board' },
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

// A quiet cross-fade with a few pixels of travel in the direction of movement.
/* A sheet being laid down rather than a slide transition: it arrives slightly
   large and settles, so the turn has weight without any 3D theatrics. */
const pageVariants = {
  enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 18 : -18, scale: 0.994 }),
  center: { opacity: 1, y: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -14 : 14, scale: 0.997 }),
};

const pageTransition = {
  duration: 0.22,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

const FRONT_WIDGET_META: Record<FrontWidgetKey, { label: string; icon: IconName }> = {
  mood: { label: 'Mood check-in', icon: 'mood' },
  schedule: { label: "Today's schedule", icon: 'schedule' },
  todo: { label: 'To-do list', icon: 'todo' },
  study: { label: 'Study minutes', icon: 'study' },
  write: { label: 'Notes', icon: 'notes' },
  notes: { label: 'Sticky board', icon: 'board' },
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
    <div className="h-screen overflow-hidden desk-background flex flex-col">
      <header className="shrink-0 flex items-center justify-between gap-4 flex-wrap px-5 md:px-8 h-14 border-b border-[var(--color-paper-line)]">
        <div className="flex items-baseline gap-4 min-w-0">
          <button
            onClick={goToCover}
            aria-label="Go to cover"
            className="font-display text-[1.4rem] leading-none tracking-[-0.01em] text-[var(--color-ink)] group"
          >
            allis
            <em className="italic text-[var(--color-accent)] group-hover:opacity-70 transition-opacity">
              w3ll
            </em>
          </button>
          <span className="label hidden sm:inline font-mono-num">
            {format(new Date(), 'EEE d MMM').toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <nav className="flex items-center gap-4">
            <button
              onClick={() => setHomeViewMode('flip')}
              className={`label pb-1 border-b transition-colors ${
                homeViewMode === 'flip'
                  ? 'text-[var(--color-ink)] border-[var(--color-accent)]'
                  : 'text-[var(--color-ink-faint)] border-transparent hover:text-[var(--color-ink-soft)]'
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setHomeViewMode('desk')}
              className={`label pb-1 border-b transition-colors ${
                homeViewMode === 'desk'
                  ? 'text-[var(--color-ink)] border-[var(--color-accent)]'
                  : 'text-[var(--color-ink-faint)] border-transparent hover:text-[var(--color-ink-soft)]'
              }`}
            >
              Desk
            </button>
          </nav>
          <AccountMenu />
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col px-5 md:px-8 pt-5 pb-5">
      {homeViewMode === 'flip' ? (
        <FlipView index={flipIndex} setIndex={setFlipIndex} direction={direction} setDirection={setDirection} />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <DeskView onOpenFull={goToPage} />
        </div>
      )}
      </div>
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

  // Arrow keys turn pages; number keys jump straight to one. Ignored while
  // typing so they never steal a keystroke from a note or an input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        go(-1);
      } else if (/^[1-7]$/.test(e.key)) {
        const target = parseInt(e.key, 10) - 1;
        if (target < FLIP_ORDER.length) {
          e.preventDefault();
          setDirection(target > index ? 1 : -1);
          setIndex(target);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center">
      <div className="w-full max-w-[1280px] mx-auto flex-1 min-h-0 flex gap-0">
      <div className="relative flex-1 min-h-0">
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={page}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="absolute inset-0"
          >
            {page === 'front' ? (
              <NotepadPage fill ringCount={14}>
                <FrontPage />
                <StickyLayer page="front" />
              </NotepadPage>
            ) : (
              <NotepadPage fill ringCount={14} title={PAGE_META[page].title}>
                {renderFullContent(page)}
                {page !== 'notes' && page !== 'write' && <StickyLayer page={page} />}
              </NotepadPage>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* the divider tabs — every section visible at once, sorted by colour */}
      <nav className="shrink-0 hidden md:flex flex-col gap-1.5 pt-12 w-[128px]">
        {FLIP_ORDER.map((p, i) => (
          <button
            key={p}
            onClick={() => {
              setDirection(i > index ? 1 : -1);
              setIndex(i);
            }}
            aria-current={i === index}
            className="divider-tab capitalize"
            data-active={i === index}
            style={{ '--tab-color': TAB_COLORS[i % TAB_COLORS.length] } as React.CSSProperties}
          >
            {p === 'front' ? 'Cover' : PAGE_META[p as DeskPageKey].title}
          </button>
        ))}
      </nav>
      </div>

      <div className="shrink-0 w-full max-w-[1280px] mx-auto mt-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => go(-1)}
            aria-label="Previous page"
            className="keycap hover:text-[var(--color-ink)] hover:border-[var(--color-ink-faint)] transition-colors"
          >
            ↑
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next page"
            className="keycap hover:text-[var(--color-ink)] hover:border-[var(--color-ink-faint)] transition-colors"
          >
            ↓
          </button>
        </div>

        {/* on phones the rail has nowhere to go, so it lies down here */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto">
          {FLIP_ORDER.map((p, i) => (
            <button
              key={p}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              aria-current={i === index}
              className="shrink-0 rounded-sm px-2.5 py-1 text-xs capitalize transition-colors"
              style={{
                background:
                  i === index
                    ? `color-mix(in srgb, ${TAB_COLORS[i % TAB_COLORS.length]} 30%, var(--color-paper))`
                    : 'transparent',
                color: i === index ? 'var(--color-ink)' : 'var(--color-ink-faint)',
              }}
            >
              {p === 'front' ? 'Cover' : PAGE_META[p as DeskPageKey].title}
            </button>
          ))}
        </div>

        <span className="hidden md:flex items-center gap-3 min-w-0">
          <span className="marker truncate capitalize">
            {page === 'front' ? 'Cover' : PAGE_META[page as DeskPageKey].title}
          </span>
          <span className="font-mono-num text-[0.68rem] text-[var(--color-ink-faint)]">
            {String(index + 1).padStart(2, '0')} / {String(FLIP_ORDER.length).padStart(2, '0')}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Muted stub colours for the index tabs, one per section in flip order. */
const TAB_COLORS = [
  'var(--color-accent)',
  'var(--color-tab-sky)',
  'var(--color-tab-sage)',
  'var(--color-tab-butter)',
  'var(--color-tab-lavender)',
  'var(--color-note-teal)',
  'var(--color-note-clay)',
];

type DeskCard = { key: string; group: DeskPageKey[] };

/** Auto-placement for a card that has never been positioned. */
function defaultPos(i: number) {
  const perRow = 4;
  return { x: 24 + (i % perRow) * 300, y: 16 + Math.floor(i / perRow) * 370, z: i + 1 };
}

function DeskView({ onOpenFull }: { onOpenFull: (key: DeskPageKey) => void }) {
  const deskGroups = useAppStore((s) => s.deskGroups);
  const openDeskPage = useAppStore((s) => s.openDeskPage);
  const closeDeskPage = useAppStore((s) => s.closeDeskPage);
  const splitDeskPage = useAppStore((s) => s.splitDeskPage);
  const deskSizes = useAppStore((s) => s.deskSizes);
  const setDeskSize = useAppStore((s) => s.setDeskSize);
  const deskLayout = useAppStore((s) => s.deskLayout);
  const setDeskPos = useAppStore((s) => s.setDeskPos);
  const bringToFront = useAppStore((s) => s.bringDeskCardToFront);

  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const dragRef = useRef<{ key: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const openKeys = new Set(deskGroups.flat());
  const cards: DeskCard[] = [
    { key: 'front', group: [] },
    ...deskGroups.map((g) => ({ key: g[0], group: g })),
  ];

  function posOf(key: string, i: number) {
    return deskLayout[key] ?? defaultPos(i);
  }

  function startDrag(e: React.PointerEvent, key: string, i: number) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = posOf(key, i);
    dragRef.current = { key, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
    setDraggingKey(key);
    bringToFront(key, p);
  }

  function onMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setDeskPos(d.key, {
      x: Math.max(0, d.ox + (e.clientX - d.sx)),
      y: Math.max(0, d.oy + (e.clientY - d.sy)),
    });
  }

  function endDrag() {
    dragRef.current = null;
    setDraggingKey(null);
  }

  // keep the canvas tall/wide enough to reach the lowest-right card
  const extent = cards.reduce(
    (acc, c, i) => {
      const p = posOf(c.key, i);
      const sz = deskSizes[c.group[0] as DeskPageKey];
      return {
        w: Math.max(acc.w, p.x + (sz?.w ?? 300) + 80),
        h: Math.max(acc.h, p.y + (sz?.h ?? 340) + 80),
      };
    },
    { w: 0, h: 480 }
  );

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
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
          drag the torn edge to move a page · drop pages on top of each other · drag a corner to resize
        </p>
      </div>

      <div
        ref={canvasRef}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative"
        style={{ width: extent.w, height: extent.h }}
      >
        {cards.map((card, i) => {
          const p = posOf(card.key, i);
          const isDragging = draggingKey === card.key;
          const isFront = card.key === 'front';
          return (
            <div
              key={card.key}
              onPointerDown={() => bringToFront(card.key, p)}
              className="absolute"
              style={{
                left: p.x,
                top: p.y,
                zIndex: isDragging ? 9999 : p.z,
                transition: isDragging ? 'none' : 'filter 160ms ease, transform 160ms ease',
                transform: isDragging ? 'scale(1.035)' : 'scale(1)',
                filter: isDragging
                  ? 'drop-shadow(0 18px 26px rgba(51,41,31,0.32))'
                  : 'drop-shadow(0 4px 8px rgba(51,41,31,0.14))',
              }}
            >
              {isFront ? (
                <NotepadPage
                  rotate={isDragging ? 0 : -1.5}
                  ringCount={6}
                  className="w-64"
                  lifted={isDragging}
                  grabHandle={(e) => startDrag(e, card.key, i)}
                >
                  <FrontPage compact />
                </NotepadPage>
              ) : card.group.length === 1 ? (
                <NotepadPage
                  title={PAGE_META[card.group[0]].title}
                  rotate={isDragging ? 0 : ROTATIONS[i % ROTATIONS.length]}
                  onClose={() => closeDeskPage(card.group[0])}
                  size={deskSizes[card.group[0]]}
                  onResize={(sz) => setDeskSize(card.group[0], sz)}
                  lifted={isDragging}
                  grabHandle={(e) => startDrag(e, card.key, i)}
                >
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {renderMini(card.group[0])}
                    <button
                      onClick={() => onOpenFull(card.group[0])}
                      className="font-note text-xs underline text-[var(--color-ink-soft)] block mt-2"
                    >
                      open full page →
                    </button>
                  </div>
                </NotepadPage>
              ) : (
                <FoldOutSpread
                  rotate={isDragging ? 0 : ROTATIONS[i % ROTATIONS.length]}
                  ringCount={6 * card.group.length}
                  lifted={isDragging}
                  grabHandle={(e) => startDrag(e, card.key, i)}
                >
                  {card.group.map((key, pi) => (
                    <FoldPane
                      key={key}
                      title={PAGE_META[key].title}
                      icon={PAGE_META[key].icon}
                      isFirst={pi === 0}
                      onClose={() => closeDeskPage(key)}
                      size={deskSizes[key]}
                      onResize={(sz) => setDeskSize(key, sz)}
                    >
                      {renderMini(key)}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => onOpenFull(key)}
                          className="font-note text-xs underline text-[var(--color-ink-soft)]"
                        >
                          open full page →
                        </button>
                        <button
                          onClick={() => splitDeskPage(key)}
                          className="font-note text-xs underline text-[var(--color-ink-soft)]"
                        >
                          unfold
                        </button>
                      </div>
                    </FoldPane>
                  ))}
                </FoldOutSpread>
              )}
            </div>
          );
        })}
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

  const weekOfYear = Math.ceil(
    ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 +
      new Date(now.getFullYear(), 0, 1).getDay() +
      1) /
      7
  );

  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1).getTime();
  const yearPct = Math.round(((now.getTime() - startOfYear) / (endOfYear - startOfYear)) * 100);

  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-display text-2xl leading-tight">
            {greeting()},{' '}
            <span className="italic text-[var(--color-accent)]">{userName || 'you'}</span>
          </p>
          <p className="label mt-1">{format(now, 'EEE d MMM')}</p>
        </div>
        <p className="font-mono-num text-3xl text-[var(--color-ink)]">
          {format(now, 'HH:mm')}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden pr-1">
      {/* masthead */}
      <div className="flex items-start justify-between gap-8 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-display font-light text-[clamp(2.1rem,5vw,3.4rem)] leading-[1.08] tracking-[-0.015em]">
            {greeting()},{' '}
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="you"
              size={Math.max(userName.length, 4)}
              aria-label="Your name"
              className="font-display italic text-[var(--color-accent)] bg-transparent border-b border-transparent hover:border-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none transition-colors"
            />
          </h1>
          <p className="font-mono text-[0.78rem] text-[var(--color-ink-soft)] mt-2 tracking-wide">
            {format(now, 'EEEE, MMMM d')}
            <span className="text-[var(--color-ink-faint)]">
              {'  ·  '}week {weekOfYear} of 52
            </span>
          </p>
        </div>

        <p className="font-mono-num text-[clamp(1.9rem,4vw,2.6rem)] leading-none text-[var(--color-ink)]">
          {format(now, 'HH:mm')}
          <span className="text-[0.42em] text-[var(--color-ink-faint)] ml-2 align-top tracking-widest">
            {format(now, 'ss')}
          </span>
        </p>
      </div>

      <div className="mt-8 h-px bg-[var(--color-paper-line)]" />

      {/* widgets */}
      {frontPageWidgets.length > 0 && (
        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {frontPageWidgets.map((key) => (
            <section key={key} className="group min-w-0">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="section">{FRONT_WIDGET_META[key].label}</h2>
                <button
                  onClick={() => removeFrontWidget(key)}
                  aria-label={`Remove ${FRONT_WIDGET_META[key].label}`}
                  className="label opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--color-accent)] transition-opacity"
                >
                  remove
                </button>
              </div>
              {renderFrontWidget(key, false)}
            </section>
          ))}
        </div>
      )}

      <div className="mt-12 flex items-center gap-4 max-w-lg">
        <span className="label whitespace-nowrap">the year</span>
        <span className="relative flex-1 h-px bg-[var(--color-paper-line)]">
          <span
            className="absolute inset-y-0 left-0 bg-[var(--color-accent)]"
            style={{ width: `${yearPct}%` }}
          />
        </span>
        <span className="font-mono-num text-[0.68rem] text-[var(--color-ink-faint)]">
          {yearPct}%
        </span>
      </div>

      {availableWidgets.length > 0 && (
        <div className="relative mt-8 pb-6">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className="label hover:text-[var(--color-ink)] transition-colors"
          >
            + add a section
          </button>
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
              <div className="absolute top-7 left-0 z-20 bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-sm p-1.5 flex flex-col min-w-[190px]">
                {availableWidgets.map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      addFrontWidget(key);
                      setPickerOpen(false);
                    }}
                    className="font-body text-sm text-left px-2.5 py-1.5 hover:bg-[var(--color-paper-deep)] flex items-center gap-2.5 transition-colors"
                  >
                    <Icon name={FRONT_WIDGET_META[key].icon} size={15} className="text-[var(--color-ink-faint)]" />
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
          className={`font-body flex flex-col items-center leading-none transition-colors ${
            compact ? 'gap-1 text-[10px]' : 'gap-1.5 text-[0.78rem]'
          } ${
            todayEntry?.mood === m.value
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
          }`}
        >
          <span
            className={`flex items-center justify-center rounded-full border transition-all ${
              compact ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-lg'
            } ${
              todayEntry?.mood === m.value
                ? 'border-transparent'
                : 'border-[var(--color-paper-line)]'
            }`}
            style={
              todayEntry?.mood === m.value
                ? { background: m.tone, color: 'var(--color-ink)' }
                : undefined
            }
          >
            {m.mark}
          </span>
          {!compact && <span>{m.label}</span>}
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
                className="accent-[var(--color-accent)] w-4 h-4"
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
        className="flex items-end gap-2"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="add something..."
          className="flex-1 min-w-0 font-body text-sm bg-transparent border-b border-[var(--color-paper-line)] px-0.5 py-1 placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        <button
          type="submit"
          aria-label="Add"
          className="label px-1 hover:text-[var(--color-accent)] transition-colors"
        >
          add
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
                className="accent-[var(--color-accent)] w-4 h-4 shrink-0"
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
        className="flex items-end gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="add something..."
          className="flex-1 min-w-0 font-body text-sm bg-transparent border-b border-[var(--color-paper-line)] px-0.5 py-1 placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        <button
          type="submit"
          aria-label="Add"
          className="label px-1 hover:text-[var(--color-accent)] transition-colors"
        >
          add
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
      <p className="font-mono-num text-4xl leading-none text-[var(--color-ink)]">
        {todaysMinutes}
        <span className="text-sm font-body text-[var(--color-ink-soft)] ml-1.5">min today</span>
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
            title={m.label}
            className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm ${
              todayEntry?.mood === m.value
                ? 'border-[var(--color-ink)]'
                : 'border-[var(--color-paper-line)] hover:bg-[var(--color-paper-deep)]/60'
            }`}
            style={todayEntry?.mood === m.value ? { background: m.tone } : undefined}
          >
            {m.mark}
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
              className="w-24 h-24 p-2 rounded-sm border font-body text-xs overflow-hidden"
              style={{
                background: `color-mix(in srgb, ${NOTE_COLORS[note.color]} 22%, var(--color-paper))`,
                borderColor: `color-mix(in srgb, ${NOTE_COLORS[note.color]} 45%, transparent)`,
              }}
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
        className="label hover:text-[var(--color-accent)] transition-colors"
      >
        + quick note
      </button>
    </div>
  );
}
