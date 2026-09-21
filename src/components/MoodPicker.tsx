import { MOODS } from '../lib/mood';
import type { Mood } from '../types';

/**
 * The one mood picker. There were two — pills on the journal, circles on the
 * cover — for the same five values, which made the same act look like two
 * different features depending on where you did it.
 */
export default function MoodPicker({
  value,
  onPick,
  size = 'regular',
}: {
  value?: Mood;
  onPick: (m: Mood) => void;
  size?: 'regular' | 'compact';
}) {
  const compact = size === 'compact';
  return (
    <div className={`flex ${compact ? 'gap-2' : 'gap-3'}`}>
      {MOODS.map((m) => {
        const active = value === m.value;
        return (
          <button
            key={m.value}
            onClick={() => onPick(m.value)}
            title={m.label}
            aria-pressed={active}
            className={`flex flex-col items-center leading-none transition-colors ${
              compact ? 'gap-1 text-[10px]' : 'gap-1.5 text-[0.78rem]'
            } ${
              active
                ? 'text-[var(--color-ink)]'
                : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            }`}
          >
            <span
              className={`flex items-center justify-center rounded-full border transition-all ${
                compact ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-lg'
              } ${active ? 'border-transparent' : 'border-[var(--color-paper-line)]'}`}
              style={active ? { background: m.tone, color: 'var(--color-paper)' } : undefined}
            >
              {m.mark}
            </span>
            {!compact && <span>{m.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
