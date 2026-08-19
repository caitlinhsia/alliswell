import type { NoteColor } from '../types';

export const NOTE_COLORS: Record<NoteColor, string> = {
  yellow: 'var(--color-note-yellow)',
  pink: 'var(--color-note-pink)',
  blue: 'var(--color-note-blue)',
  green: 'var(--color-note-green)',
  orange: 'var(--color-note-orange)',
  purple: 'var(--color-note-purple)',
};

export const NOTE_COLOR_LIST: NoteColor[] = [
  'yellow',
  'pink',
  'blue',
  'green',
  'orange',
  'purple',
];
