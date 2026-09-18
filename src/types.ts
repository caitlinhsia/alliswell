export type NoteColor =
  | 'ochre'
  | 'clay'
  | 'rust'
  | 'rose'
  | 'plum'
  | 'lilac'
  | 'denim'
  | 'teal'
  | 'sage'
  | 'moss'
  | 'sand'
  | 'slate';

export interface ScheduleItem {
  id: string;
  title: string;
  date: string; // yyyy-MM-dd
  time?: string; // HH:mm
  endTime?: string; // HH:mm
  done: boolean;
  category: 'task' | 'event';
  subjectId?: string;
  color?: NoteColor;
}

export interface Subject {
  id: string;
  name: string;
  color: NoteColor;
}

export interface StudyTodo {
  id: string;
  subjectId: string;
  text: string;
  done: boolean;
}

export interface StudySession {
  id: string;
  subjectId: string;
  minutes: number;
  date: string; // yyyy-MM-dd
  completedAt: number; // timestamp
}

export type Mood = 'great' | 'good' | 'okay' | 'low' | 'rough';

export interface JournalEntry {
  id: string;
  date: string; // yyyy-MM-dd
  mood: Mood;
  text: string;
  updatedAt: number;
}

export type StickyPage =
  | 'board'
  | 'write'
  | 'mindmap'
  | 'schedule'
  | 'todo'
  | 'study'
  | 'journal'
  | 'front';

export interface StickyNote {
  id: string;
  text: string;
  color: NoteColor;
  x: number;
  y: number;
  rotation: number;
  z: number;
  drawing?: string; // data URL of a canvas drawing
  page: StickyPage;
}

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  color: NoteColor;
  w?: number;
  h?: number;
}

export type Priority = 'high' | 'medium' | 'low';

export interface TodoItem {
  id: string;
  text: string;
  /** Free-text detail under the title, as in Todoist. */
  description?: string;
  priority: Priority;
  dueDate?: string; // yyyy-MM-dd
  /** Which subject this belongs to, if any — drives its colour. */
  subjectId?: string;
  done: boolean;
  createdAt: number;
  /** When it was ticked, so the completed list can be ordered and grouped. */
  completedAt?: number;
}

/** A saved note, as in a notes app: many of them, each with its own title. */
export interface Note {
  id: string;
  title: string;
  html: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}
