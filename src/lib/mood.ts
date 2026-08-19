import type { Mood } from '../types';

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great', emoji: '🌞', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '🌧️', label: 'Low' },
  { value: 'rough', emoji: '⛈️', label: 'Rough' },
];

export function moodMeta(mood: Mood) {
  return MOODS.find((m) => m.value === mood) ?? MOODS[2];
}
