import type { Mood } from '../types';

/**
 * Moods read as a scale from best to worst; `mark` is the pen-stroke glyph shown
 * in the picker and `tone` tints the selected chip.
 */
export const MOODS: { value: Mood; mark: string; label: string; tone: string }[] = [
  { value: 'great', mark: '◝', label: 'Great', tone: 'var(--mood-great)' },
  { value: 'good', mark: '⌣', label: 'Good', tone: 'var(--mood-good)' },
  { value: 'okay', mark: '—', label: 'Okay', tone: 'var(--mood-okay)' },
  { value: 'low', mark: '⌢', label: 'Low', tone: 'var(--mood-low)' },
  { value: 'rough', mark: '◞', label: 'Rough', tone: 'var(--mood-rough)' },
];

export function moodMeta(mood: Mood) {
  return MOODS.find((m) => m.value === mood) ?? MOODS[2];
}
