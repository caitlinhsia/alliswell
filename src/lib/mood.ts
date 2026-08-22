import type { Mood } from '../types';

/**
 * Moods read as a scale from best to worst; `mark` is the pen-stroke glyph shown
 * in the picker and `tone` tints the selected chip.
 */
export const MOODS: { value: Mood; mark: string; label: string; tone: string }[] = [
  { value: 'great', mark: '◝', label: 'Great', tone: 'var(--color-note-sage)' },
  { value: 'good', mark: '⌣', label: 'Good', tone: 'var(--color-note-teal)' },
  { value: 'okay', mark: '—', label: 'Okay', tone: 'var(--color-note-sand)' },
  { value: 'low', mark: '⌢', label: 'Low', tone: 'var(--color-note-slate)' },
  { value: 'rough', mark: '◞', label: 'Rough', tone: 'var(--color-note-rust)' },
];

export function moodMeta(mood: Mood) {
  return MOODS.find((m) => m.value === mood) ?? MOODS[2];
}
