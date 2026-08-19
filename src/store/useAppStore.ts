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

interface AppState {
  openDeskPages: DeskPageKey[];
  toggleDeskPage: (key: DeskPageKey) => void;

  schedule: ScheduleItem[];
  addScheduleItem: (title: string, date: string, time: string | undefined, category: 'task' | 'event') => void;
  toggleScheduleItem: (id: string) => void;
  removeScheduleItem: (id: string) => void;

  subjects: Subject[];
  addSubject: (name: string, color: NoteColor) => void;
  removeSubject: (id: string) => void;

  studyTodos: StudyTodo[];
  addStudyTodo: (subjectId: string, text: string) => void;
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
      openDeskPages: ['schedule', 'notes'],
      toggleDeskPage: (key) =>
        set((s) => ({
          openDeskPages: s.openDeskPages.includes(key)
            ? s.openDeskPages.filter((k) => k !== key)
            : [...s.openDeskPages, key],
        })),

      schedule: [],
      addScheduleItem: (title, date, time, category) =>
        set((s) => ({
          schedule: [
            ...s.schedule,
            { id: uid(), title, date, time, category, done: false },
          ],
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
