import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import Panel from '../components/Panel';
import { todayStr } from '../lib/date';
import { MOODS, moodMeta } from '../lib/mood';
import type { Mood } from '../types';

const PROMPTS = [
  'What is one small thing that went well today?',
  "What's weighing on you right now, and what would help?",
  'What are you grateful for in this moment?',
  'What do you need more of this week?',
  'Describe today in three words, then explain why.',
  'What is something you want to let go of?',
  'What made you smile recently?',
];

export default function JournalContent() {
  const journalEntries = useAppStore((s) => s.journalEntries);
  const upsertJournalEntry = useAppStore((s) => s.upsertJournalEntry);
  const removeJournalEntry = useAppStore((s) => s.removeJournalEntry);

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [text, setText] = useState('');
  const [mood, setMood] = useState<Mood>('okay');
  const [promptIndex, setPromptIndex] = useState(0);

  const existing = journalEntries.find((e) => e.date === selectedDate);

  useEffect(() => {
    setText(existing?.text ?? '');
    setMood(existing?.mood ?? 'okay');
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  function save(nextText: string, nextMood: Mood) {
    upsertJournalEntry(selectedDate, nextMood, nextText);
  }

  const history = [...journalEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <p className="font-hand text-xl text-[var(--color-ink-soft)] -mt-2 mb-4">A page for however today went</p>

      <div className="flex-1 min-h-0 grid md:grid-cols-[1fr_260px] gap-5">
        <Panel className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2 shrink-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-note border border-[var(--color-paper-line)] rounded-lg px-3 py-1.5"
            />
            <div className="flex gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    setMood(m.value);
                    save(text, m.value);
                  }}
                  title={m.label}
                  className={`text-lg w-8 h-8 rounded-full border flex items-center justify-center ${
                    mood === m.value
                      ? 'border-[var(--color-ink)] bg-[var(--color-paper-deep)]'
                      : 'border-transparent hover:bg-[var(--color-paper-deep)]/60'
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-2 shrink-0">
            <p className="font-note text-sm italic text-[var(--color-ink-soft)]">
              Prompt: {PROMPTS[promptIndex]}
            </p>
            <button
              onClick={() => setPromptIndex((i) => (i + 1) % PROMPTS.length)}
              className="font-note text-xs underline text-[var(--color-ink-soft)] shrink-0 ml-2"
            >
              new prompt
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => save(text, mood)}
            placeholder="Start writing..."
            className="flex-1 w-full font-note text-base lined-paper resize-none focus:outline-none px-1 leading-[31px] pt-1"
          />

          <div className="flex justify-end gap-2 mt-2 shrink-0">
            {existing && (
              <button
                onClick={() => {
                  removeJournalEntry(existing.id);
                  setText('');
                }}
                className="font-note text-xs text-[var(--color-ink-soft)] hover:text-red-500"
              >
                delete entry
              </button>
            )}
            <button
              onClick={() => save(text, mood)}
              className="font-note text-sm bg-[var(--color-tab-blush)] px-4 py-1.5 rounded-lg"
            >
              Save
            </button>
          </div>
        </Panel>

        <Panel className="flex flex-col h-full overflow-hidden">
          <h3 className="font-hand text-2xl mb-3 shrink-0">Past entries</h3>
          {history.length === 0 ? (
            <p className="font-note text-sm text-[var(--color-ink-soft)]">Nothing written yet.</p>
          ) : (
            <ul className="space-y-1.5 flex-1 overflow-y-auto">
              {history.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setSelectedDate(e.date)}
                    className={`w-full text-left font-note text-sm px-2.5 py-1.5 rounded-lg flex items-center gap-2 ${
                      e.date === selectedDate ? 'bg-[var(--color-paper-deep)]' : 'hover:bg-[var(--color-paper-deep)]/50'
                    }`}
                  >
                    <span>{moodMeta(e.mood).emoji}</span>
                    <span>{format(parseISO(e.date), 'MMM d, yyyy')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
