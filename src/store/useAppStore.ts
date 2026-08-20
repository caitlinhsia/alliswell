import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  JournalEntry,
  Mood,
  NoteColor,
  ScheduleItem,
  StickyNote,
  StudySession,
  StudyTodo,
  Subject,
} from '../types';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export type DeskPageKey = 'schedule' | 'study' | 'journal' | 'notes';
export type HomeViewMode = 'flip' | 'desk';
export type FrontWidgetKey = 'mood' | 'schedule' | 'study' | 'notes';

interface AppState {
  userName: string;
  setUserName: (name: string) => void;

  homeViewMode: HomeViewMode;
  setHomeViewMode: (mode: HomeViewMode) => void;

  frontPageWidgets: FrontWidgetKey[];
  addFrontWidget: (key: FrontWidgetKey) => void;
  removeFrontWidget: (key: FrontWidgetKey) => void;

  deskGroups: DeskPageKey[][];
  openDeskPage: (key: DeskPageKey) => void;
  closeDeskPage: (key: DeskPageKey) => void;
  mergeDeskPage: (draggedKey: DeskPageKey, targetKey: DeskPageKey) => void;
  splitDeskPage: (key: DeskPageKey) => void;

  schedule: ScheduleItem[];
  addScheduleItem: (title: string, date: string, time: string | undefined, category: 'task' | 'event') => void;
  updateScheduleItem: (id: string, patch: Partial<Pick<ScheduleItem, 'title' | 'time' | 'category'>>) => void;
  toggleScheduleItem: (id: string) => void;
  removeScheduleItem: (id: string) => void;

  subjects: Subject[];
  addSubject: (name: string, color: NoteColor) => void;
  removeSubject: (id: string) => void;

  studyTodos: StudyTodo[];
  addStudyTodo: (subjectId: string, text: string) => void;
  updateStudyTodo: (id: string, text: string) => void;
  toggleStudyTodo: (id: string) => void;
  removeStudyTodo: (id: string) => void;

  studySessions: StudySession[];
  logStudySession: (subjectId: string, minutes: number) => void;

  journalEntries: JournalEntry[];
  upsertJournalEntry: (date: string, mood: Mood, text: string) => void;
  removeJournalEntry: (id: string) => void;

  stickyNotes: StickyNote[];
  addStickyNote: (color: NoteColor, x: number, y: number) => void;
  updateStickyNote: (id: string, patch: Partial<StickyNote>) => void;
  removeStickyNote: (id: string) => void;
  bringStickyNoteToFront: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userName: 'Caitlin',
      setUserName: (name) => set({ userName: name }),

      homeViewMode: 'flip',
      setHomeViewMode: (mode) => set({ homeViewMode: mode }),

      frontPageWidgets: ['mood'],
      addFrontWidget: (key) =>
        set((s) =>
          s.frontPageWidgets.includes(key)
            ? {}
            : { frontPageWidgets: [...s.frontPageWidgets, key] }
        ),
      removeFrontWidget: (key) =>
        set((s) => ({ frontPageWidgets: s.frontPageWidgets.filter((k) => k !== key) })),

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
      addScheduleItem: (title, date, time, category) =>
        set((s) => ({
          schedule: [
            ...s.schedule,
            { id: uid(), title, date, time, category, done: false },
          ],
        })),
      updateScheduleItem: (id, patch) =>
        set((s) => ({
          schedule: s.schedule.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      toggleScheduleItem: (id) =>
        set((s) => ({
          schedule: s.schedule.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
        })),
      removeScheduleItem: (id) =>
        set((s) => ({ schedule: s.schedule.filter((i) => i.id !== id) })),

      subjects: [
        { id: 'default-1', name: 'General', color: 'blue' },
      ],
      addSubject: (name, color) =>
        set((s) => ({ subjects: [...s.subjects, { id: uid(), name, color }] })),
      removeSubject: (id) =>
        set((s) => ({
          subjects: s.subjects.filter((sub) => sub.id !== id),
          studyTodos: s.studyTodos.filter((t) => t.subjectId !== id),
          studySessions: s.studySessions.filter((sess) => sess.subjectId !== id),
        })),

      studyTodos: [],
      addStudyTodo: (subjectId, text) =>
        set((s) => ({
          studyTodos: [...s.studyTodos, { id: uid(), subjectId, text, done: false }],
        })),
      updateStudyTodo: (id, text) =>
        set((s) => ({
          studyTodos: s.studyTodos.map((t) => (t.id === id ? { ...t, text } : t)),
        })),
      toggleStudyTodo: (id) =>
        set((s) => ({
          studyTodos: s.studyTodos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      removeStudyTodo: (id) =>
        set((s) => ({ studyTodos: s.studyTodos.filter((t) => t.id !== id) })),

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
        set((s) => ({ journalEntries: s.journalEntries.filter((e) => e.id !== id) })),

      stickyNotes: [],
      addStickyNote: (color, x, y) =>
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
              },
            ],
          };
        }),
      updateStickyNote: (id, patch) =>
        set((s) => ({
          stickyNotes: s.stickyNotes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),
      removeStickyNote: (id) =>
        set((s) => ({ stickyNotes: s.stickyNotes.filter((n) => n.id !== id) })),
      bringStickyNoteToFront: (id) => {
        const maxZ = get().stickyNotes.reduce((m, n) => Math.max(m, n.z), 0);
        set((s) => ({
          stickyNotes: s.stickyNotes.map((n) => (n.id === id ? { ...n, z: maxZ + 1 } : n)),
        }));
      },
    }),
    { name: 'alliswell-storage' }
  )
);
