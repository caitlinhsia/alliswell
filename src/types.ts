export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';

export interface ScheduleItem {
  id: string;
  title: string;
  date: string; // yyyy-MM-dd
  time?: string; // HH:mm
  done: boolean;
  category: 'task' | 'event';
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

export interface StickyNote {
  id: string;
  text: string;
  color: NoteColor;
  x: number;
  y: number;
  rotation: number;
  z: number;
}
