import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  JournalEntry,
  MindMapNode,
  Note,
  Mood,
  NoteColor,
  Priority,
  ScheduleItem,
  StickyNote,
  StickyPage,
  StudySession,
  Subject,
  TodoItem,
} from '../types';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export type DeskPageKey = 'schedule' | 'study' | 'journal' | 'notes' | 'todo' | 'write';
export type HomeViewMode = 'flip' | 'desk';
export type Theme = 'light' | 'dark';
export type FrontWidgetKey = 'mood' | 'schedule' | 'study' | 'notes' | 'todo' | 'write';

type UndoSnapshot =
  | { kind: 'schedule'; item: ScheduleItem }
  | { kind: 'todo'; item: TodoItem }
  | { kind: 'note'; item: Note }
  | { kind: 'subject'; item: Subject; todos: TodoItem[]; sessions: StudySession[] }
  | { kind: 'sticky'; item: StickyNote }
  | { kind: 'mindMap'; items: MindMapNode[] }
  | { kind: 'journal'; item: JournalEntry };

export interface PendingUndo {
  snapshot: UndoSnapshot;
  label: string;
  at: number;
}

interface AppState {
  pendingUndo: PendingUndo | null;
  undoDelete: () => void;
  clearUndo: () => void;

  userName: string;
  setUserName: (name: string) => void;

  homeViewMode: HomeViewMode;
  setHomeViewMode: (mode: HomeViewMode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;

  frontPageWidgets: FrontWidgetKey[];
  addFrontWidget: (key: FrontWidgetKey) => void;
  removeFrontWidget: (key: FrontWidgetKey) => void;

  deskSizes: Partial<Record<DeskPageKey, { w: number; h: number }>>;
  setDeskSize: (key: DeskPageKey, size: { w: number; h: number }) => void;

  /** Free positions on the desk, keyed by card ('front' or a page key). */
  deskLayout: Record<string, { x: number; y: number; z: number }>;
  setDeskPos: (key: string, pos: { x: number; y: number }) => void;
  /** `at` seeds x/y for a card that has never been moved, so raising it doesn't relocate it. */
  bringDeskCardToFront: (key: string, at?: { x: number; y: number }) => void;

  deskGroups: DeskPageKey[][];
  openDeskPage: (key: DeskPageKey) => void;
  closeDeskPage: (key: DeskPageKey) => void;
  mergeDeskPage: (draggedKey: DeskPageKey, targetKey: DeskPageKey) => void;
  splitDeskPage: (key: DeskPageKey) => void;

  schedule: ScheduleItem[];
  addScheduleItem: (
    title: string,
    date: string,
    time: string | undefined,
    category: 'task' | 'event',
    extra?: Pick<ScheduleItem, 'endTime' | 'subjectId' | 'color'>
  ) => void;
  updateScheduleItem: (
    id: string,
    patch: Partial<Pick<ScheduleItem, 'title' | 'time' | 'endTime' | 'category' | 'date' | 'subjectId' | 'color'>>
  ) => void;
  moveScheduleItem: (id: string, date: string) => void;
  toggleScheduleItem: (id: string) => void;
  /** Tick one appearance of a repeating item without touching the rest. */
  toggleOccurrence: (id: string, date: string) => void;
  /** Drop a single appearance, leaving the series running. */
  skipOccurrence: (id: string, date: string) => void;
  setScheduleRepeat: (id: string, repeat: ScheduleItem['repeat']) => void;
  removeScheduleItem: (id: string) => void;

  todos: TodoItem[];
  addTodo: (text: string, priority: Priority, dueDate?: string, subjectId?: string) => void;
  updateTodo: (
    id: string,
    patch: Partial<Pick<TodoItem, 'text' | 'description' | 'priority' | 'dueDate' | 'subjectId'>>
  ) => void;
  clearCompletedTodos: () => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;

  subjects: Subject[];
  addSubject: (name: string, color: NoteColor) => void;
  updateSubject: (id: string, patch: Partial<Pick<Subject, 'name' | 'color'>>) => void;
  removeSubject: (id: string) => void;


  studySessions: StudySession[];
  logStudySession: (subjectId: string, minutes: number) => void;

  journalEntries: JournalEntry[];
  upsertJournalEntry: (date: string, mood: Mood, text: string) => void;
  removeJournalEntry: (id: string) => void;

  stickyNotes: StickyNote[];
  addStickyNote: (page: StickyPage, color: NoteColor, x: number, y: number) => void;
  updateStickyNote: (id: string, patch: Partial<StickyNote>) => void;
  removeStickyNote: (id: string) => void;
  bringStickyNoteToFront: (id: string) => void;

  writeNoteHtml: string;
  notes: Note[];
  activeNoteId: string | null;
  addNote: (title?: string) => string;
  updateNote: (id: string, patch: Partial<Pick<Note, 'title' | 'html' | 'pinned'>>) => void;
  removeNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setWriteNoteHtml: (html: string) => void;

  mindMapNodes: MindMapNode[];
  addMindMapNode: (parentId: string | null, text: string, x: number, y: number, color: NoteColor) => string;
  updateMindMapNode: (
    id: string,
    patch: Partial<Pick<MindMapNode, 'text' | 'x' | 'y' | 'color' | 'w' | 'h'>>
  ) => void;
  removeMindMapNode: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      pendingUndo: null,
      clearUndo: () => set({ pendingUndo: null }),
      undoDelete: () => {
        const pending = get().pendingUndo;
        if (!pending) return;
        const s = pending.snapshot;
        set((state) => {
          switch (s.kind) {
            case 'schedule':
              return { schedule: [...state.schedule, s.item], pendingUndo: null };
            case 'todo':
              return { todos: [...state.todos, s.item], pendingUndo: null };
            case 'note':
              return { notes: [s.item, ...state.notes], pendingUndo: null };
            case 'subject':
              return {
                subjects: [...state.subjects, s.item],
                todos: [...state.todos, ...s.todos],
                studySessions: [...state.studySessions, ...s.sessions],
                pendingUndo: null,
              };
            case 'sticky':
              return { stickyNotes: [...state.stickyNotes, s.item], pendingUndo: null };
            case 'mindMap':
              return { mindMapNodes: [...state.mindMapNodes, ...s.items], pendingUndo: null };
            case 'journal':
              return { journalEntries: [...state.journalEntries, s.item], pendingUndo: null };
          }
        });
      },

      userName: 'Caitlin',
      setUserName: (name) => set({ userName: name }),

      homeViewMode: 'flip',
      setHomeViewMode: (mode) => set({ homeViewMode: mode }),
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      frontPageWidgets: ['mood'],
      addFrontWidget: (key) =>
        set((s) =>
          s.frontPageWidgets.includes(key)
            ? {}
            : { frontPageWidgets: [...s.frontPageWidgets, key] }
        ),
      removeFrontWidget: (key) =>
        set((s) => ({ frontPageWidgets: s.frontPageWidgets.filter((k) => k !== key) })),

      deskSizes: {},
      setDeskSize: (key, size) =>
        set((s) => ({ deskSizes: { ...s.deskSizes, [key]: size } })),

      deskLayout: {},
      setDeskPos: (key, pos) =>
        set((s) => ({
          deskLayout: {
            ...s.deskLayout,
            [key]: { ...pos, z: s.deskLayout[key]?.z ?? 1 },
          },
        })),
      bringDeskCardToFront: (key, at) =>
        set((s) => {
          const maxZ = Object.values(s.deskLayout).reduce((m, c) => Math.max(m, c.z), 0);
          const cur = s.deskLayout[key];
          if (cur && cur.z === maxZ && maxZ > 0) return {};
          return {
            deskLayout: {
              ...s.deskLayout,
              [key]: { x: cur?.x ?? at?.x ?? 0, y: cur?.y ?? at?.y ?? 0, z: maxZ + 1 },
            },
          };
        }),

      deskGroups: [['schedule'], ['notes']],
      openDeskPage: (key) =>
        set((s) =>
          s.deskGroups.some((g) => g.includes(key))
            ? {}
            : { deskGroups: [...s.deskGroups, [key]] }
        ),
      closeDeskPage: (key) =>
        set((s) => ({
          deskGroups: s.deskGroups
            .map((g) => g.filter((k) => k !== key))
            .filter((g) => g.length > 0),
        })),
      mergeDeskPage: (draggedKey, targetKey) =>
        set((s) => {
          if (draggedKey === targetKey) return {};
          const withoutDragged = s.deskGroups
            .map((g) => g.filter((k) => k !== draggedKey))
            .filter((g) => g.length > 0);
          const targetGroupIndex = withoutDragged.findIndex((g) => g.includes(targetKey));
          if (targetGroupIndex === -1) return {};
          return {
            deskGroups: withoutDragged.map((g, i) =>
              i === targetGroupIndex ? [...g, draggedKey] : g
            ),
          };
        }),
      splitDeskPage: (key) =>
        set((s) => {
          const withoutKey = s.deskGroups
            .map((g) => g.filter((k) => k !== key))
            .filter((g) => g.length > 0);
          return { deskGroups: [...withoutKey, [key]] };
        }),

      schedule: [],
      addScheduleItem: (title, date, time, category, extra) =>
        set((s) => ({
          schedule: [
            ...s.schedule,
            { id: uid(), title, date, time, category, done: false, ...extra },
          ],
        })),
      updateScheduleItem: (id, patch) =>
        set((s) => ({
          schedule: s.schedule.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      moveScheduleItem: (id, date) =>
        set((s) => ({
          schedule: s.schedule.map((i) => (i.id === id ? { ...i, date } : i)),
        })),
      toggleOccurrence: (id, date) =>
        set((s) => ({
          schedule: s.schedule.map((item) => {
            if (item.id !== id) return item;
            if (!item.repeat) return { ...item, done: !item.done };
            const done = item.doneDates ?? [];
            return {
              ...item,
              doneDates: done.includes(date)
                ? done.filter((d) => d !== date)
                : [...done, date],
            };
          }),
        })),
      skipOccurrence: (id, date) =>
        set((s) => ({
          schedule: s.schedule.map((item) =>
            item.id === id
              ? { ...item, skipDates: [...(item.skipDates ?? []), date] }
              : item
          ),
        })),
      setScheduleRepeat: (id, repeat) =>
        set((s) => ({
          schedule: s.schedule.map((item) =>
            item.id === id
              ? { ...item, repeat, ...(repeat ? {} : { doneDates: undefined, skipDates: undefined }) }
              : item
          ),
        })),
      toggleScheduleItem: (id) =>
        set((s) => ({
          schedule: s.schedule.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
        })),
      removeScheduleItem: (id) =>
        set((s) => {
          const item = s.schedule.find((i) => i.id === id);
          return {
            schedule: s.schedule.filter((i) => i.id !== id),
            pendingUndo: item
              ? { snapshot: { kind: 'schedule', item }, label: `Deleted "${item.title}"`, at: Date.now() }
              : s.pendingUndo,
          };
        }),

      todos: [],
      addTodo: (text, priority, dueDate, subjectId) =>
        set((s) => ({
          todos: [
            ...s.todos,
            { id: uid(), text, priority, dueDate, subjectId, done: false, createdAt: Date.now() },
          ],
        })),
      updateTodo: (id, patch) =>
        set((s) => ({
          todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      toggleTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id
              ? { ...t, done: !t.done, completedAt: t.done ? undefined : Date.now() }
              : t
          ),
        })),
      clearCompletedTodos: () => set((s) => ({ todos: s.todos.filter((t) => !t.done) })),
      removeTodo: (id) =>
        set((s) => {
          const item = s.todos.find((t) => t.id === id);
          return {
            todos: s.todos.filter((t) => t.id !== id),
            pendingUndo: item
              ? { snapshot: { kind: 'todo', item }, label: `Deleted "${item.text}"`, at: Date.now() }
              : s.pendingUndo,
          };
        }),

      subjects: [
        { id: 'default-1', name: 'General', color: 'denim' },
      ],
      addSubject: (name, color) =>
        set((s) => ({ subjects: [...s.subjects, { id: uid(), name, color }] })),
      updateSubject: (id, patch) =>
        set((s) => ({ subjects: s.subjects.map((sub) => (sub.id === id ? { ...sub, ...patch } : sub)) })),
      removeSubject: (id) =>
        set((s) => {
          const item = s.subjects.find((sub) => sub.id === id);
          const todos = s.todos.filter((t) => t.subjectId === id);
          const sessions = s.studySessions.filter((sess) => sess.subjectId === id);
          return {
            subjects: s.subjects.filter((sub) => sub.id !== id),
            // the work itself survives; it just stops belonging to a subject
            todos: s.todos.map((t) => (t.subjectId === id ? { ...t, subjectId: undefined } : t)),
            studySessions: s.studySessions.filter((sess) => sess.subjectId !== id),
            pendingUndo: item
              ? {
                  snapshot: { kind: 'subject', item, todos, sessions },
                  label: `Deleted subject "${item.name}"`,
                  at: Date.now(),
                }
              : s.pendingUndo,
          };
        }),

      studySessions: [],
      logStudySession: (subjectId, minutes) =>
        set((s) => ({
          studySessions: [
            ...s.studySessions,
            {
              id: uid(),
              subjectId,
              minutes,
              date: new Date().toISOString().slice(0, 10),
              completedAt: Date.now(),
            },
          ],
        })),

      journalEntries: [],
      upsertJournalEntry: (date, mood, text) =>
        set((s) => {
          const existing = s.journalEntries.find((e) => e.date === date);
          if (existing) {
            return {
              journalEntries: s.journalEntries.map((e) =>
                e.date === date ? { ...e, mood, text, updatedAt: Date.now() } : e
              ),
            };
          }
          return {
            journalEntries: [
              ...s.journalEntries,
              { id: uid(), date, mood, text, updatedAt: Date.now() },
            ],
          };
        }),
      removeJournalEntry: (id) =>
        set((s) => {
          const item = s.journalEntries.find((e) => e.id === id);
          return {
            journalEntries: s.journalEntries.filter((e) => e.id !== id),
            pendingUndo: item
              ? { snapshot: { kind: 'journal', item }, label: 'Deleted journal entry', at: Date.now() }
              : s.pendingUndo,
          };
        }),

      stickyNotes: [],
      addStickyNote: (page, color, x, y) =>
        set((s) => {
          const maxZ = s.stickyNotes.reduce((m, n) => Math.max(m, n.z), 0);
          return {
            stickyNotes: [
              ...s.stickyNotes,
              {
                id: uid(),
                text: '',
                color,
                x,
                y,
                rotation: Math.random() * 8 - 4,
                z: maxZ + 1,
                page,
              },
            ],
          };
        }),
      updateStickyNote: (id, patch) =>
        set((s) => ({
          stickyNotes: s.stickyNotes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      removeStickyNote: (id) =>
        set((s) => {
          const item = s.stickyNotes.find((n) => n.id === id);
          return {
            stickyNotes: s.stickyNotes.filter((n) => n.id !== id),
            pendingUndo: item
              ? { snapshot: { kind: 'sticky', item }, label: 'Deleted sticky note', at: Date.now() }
              : s.pendingUndo,
          };
        }),
      bringStickyNoteToFront: (id) => {
        const maxZ = get().stickyNotes.reduce((m, n) => Math.max(m, n.z), 0);
        set((s) => ({
          stickyNotes: s.stickyNotes.map((n) => (n.id === id ? { ...n, z: maxZ + 1 } : n)),
        }));
      },

      writeNoteHtml: '',
      setWriteNoteHtml: (html) => set({ writeNoteHtml: html }),

      notes: [],
      activeNoteId: null,
      addNote: (title) => {
        const id = uid();
        const now = Date.now();
        set((s) => ({
          notes: [
            { id, title: title ?? '', html: '', createdAt: now, updatedAt: now },
            ...s.notes,
          ],
          activeNoteId: id,
        }));
        return id;
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
          ),
        })),
      removeNote: (id) =>
        set((s) => {
          const item = s.notes.find((n) => n.id === id);
          const rest = s.notes.filter((n) => n.id !== id);
          return {
            notes: rest,
            activeNoteId: s.activeNoteId === id ? rest[0]?.id ?? null : s.activeNoteId,
            pendingUndo: item
              ? {
                  snapshot: { kind: 'note', item },
                  label: `Deleted "${item.title || 'Untitled'}"`,
                  at: Date.now(),
                }
              : s.pendingUndo,
          };
        }),
      setActiveNote: (id) => set({ activeNoteId: id }),

      mindMapNodes: [],
      addMindMapNode: (parentId, text, x, y, color) => {
        const id = uid();
        set((s) => ({
          mindMapNodes: [...s.mindMapNodes, { id, text, x, y, parentId, color }],
        }));
        return id;
      },
      updateMindMapNode: (id, patch) =>
        set((s) => ({
          mindMapNodes: s.mindMapNodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      removeMindMapNode: (id) =>
        set((s) => {
          const toRemove = new Set([id]);
          let grew = true;
          while (grew) {
            grew = false;
            for (const n of s.mindMapNodes) {
              if (n.parentId && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
                toRemove.add(n.id);
                grew = true;
              }
            }
          }
          const items = s.mindMapNodes.filter((n) => toRemove.has(n.id));
          return {
            mindMapNodes: s.mindMapNodes.filter((n) => !toRemove.has(n.id)),
            pendingUndo: items.length
              ? {
                  snapshot: { kind: 'mindMap', items },
                  label: items.length > 1 ? `Deleted ${items.length} bubbles` : 'Deleted bubble',
                  at: Date.now(),
                }
              : s.pendingUndo,
          };
        }),
    }),
    {
      name: 'alliswell-storage',
      version: 3,
      partialize: ({ pendingUndo: _pendingUndo, ...rest }) => rest,
      // v0 kept board notes and write-page notes in two arrays and used pastel color names
      migrate: (persisted, version) => {
        // study to-dos were a second, parallel to-do list; fold them into the
        // real one, keeping their subject so nothing about them is lost
        const asV3 = (state: Record<string, unknown>) => {
          const legacy = state.studyTodos as
            | { id: string; subjectId: string; text: string; done: boolean }[]
            | undefined;
          if (!legacy?.length) return { ...state, studyTodos: undefined };
          const existing = (state.todos as TodoItem[] | undefined) ?? [];
          const moved: TodoItem[] = legacy.map((t, i) => ({
            id: t.id,
            text: t.text,
            priority: 'medium' as Priority,
            subjectId: t.subjectId,
            done: t.done,
            createdAt: Date.now() + i,
          }));
          return { ...state, todos: [...existing, ...moved], studyTodos: undefined };
        };

        const asV2 = (state: Record<string, unknown>) => {
          if (Array.isArray(state.notes)) return state;
          const html = typeof state.writeNoteHtml === 'string' ? state.writeNoteHtml : '';
          const now = Date.now();
          // the one big write page becomes the first saved note, so nothing is lost
          const notes: Note[] = html.trim()
            ? [{ id: uid(), title: 'My notes', html, createdAt: now, updatedAt: now }]
            : [];
          return { ...state, notes, activeNoteId: notes[0]?.id ?? null };
        };

        if (version >= 3) return persisted as AppState;
        if (version === 2) return asV3(persisted as Record<string, unknown>) as unknown as AppState;
        if (version === 1)
          return asV3(asV2(persisted as Record<string, unknown>)) as unknown as AppState;
        const old = persisted as Record<string, unknown>;
        const legacyColor: Record<string, NoteColor> = {
          yellow: 'ochre',
          pink: 'rose',
          blue: 'denim',
          green: 'sage',
          orange: 'clay',
          purple: 'lilac',
        };
        const fix = (c: unknown): NoteColor => legacyColor[c as string] ?? (c as NoteColor) ?? 'ochre';
        const board = ((old.stickyNotes as StickyNote[]) ?? []).map((n) => ({
          ...n,
          color: fix(n.color),
          page: 'board' as StickyPage,
        }));
        const write = ((old.writeStickyNotes as StickyNote[]) ?? []).map((n) => ({
          ...n,
          color: fix(n.color),
          page: 'write' as StickyPage,
        }));
        return asV3(asV2({
          ...old,
          stickyNotes: [...board, ...write],
          writeStickyNotes: undefined,
          subjects: ((old.subjects as Subject[]) ?? []).map((s) => ({ ...s, color: fix(s.color) })),
          mindMapNodes: ((old.mindMapNodes as MindMapNode[]) ?? []).map((n) => ({
            ...n,
            color: fix(n.color),
          })),
        })) as unknown as AppState;
      },
    }
  )
);
