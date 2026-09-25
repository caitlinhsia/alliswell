import { format, parseISO } from 'date-fns';
import type { AppState } from '../store/useAppStore';

export type SearchPage = 'schedule' | 'todo' | 'study' | 'journal' | 'write' | 'notes';

export interface Hit {
  id: string;
  page: SearchPage;
  /** Which kind of thing this is, shown as the group heading. */
  group: string;
  title: string;
  detail?: string;
  /** For a note, the note to open on arrival. */
  noteId?: string;
  score: number;
}

const strip = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Title matches beat body matches, and an opening match beats one buried later. */
function score(query: string, title: string, body?: string): number {
  const q = query.toLowerCase();
  const t = title.toLowerCase();
  if (t.startsWith(q)) return 100;
  if (t.includes(q)) return 70;
  const b = body?.toLowerCase() ?? '';
  if (b.includes(q)) return 40;
  return 0;
}

/** A short window of the body around the match, so the hit shows its context. */
function excerpt(body: string, query: string): string | undefined {
  const i = body.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return undefined;
  const from = Math.max(0, i - 24);
  return (from > 0 ? '…' : '') + body.slice(from, from + 90).trim() + (body.length > from + 90 ? '…' : '');
}

export function searchEverything(state: AppState, rawQuery: string, limit = 24): Hit[] {
  const query = rawQuery.trim();
  if (query.length < 2) return [];
  const hits: Hit[] = [];

  const push = (h: Omit<Hit, 'score'>, s: number) => s > 0 && hits.push({ ...h, score: s });

  for (const t of state.todos) {
    const body = t.description ?? '';
    push(
      {
        id: t.id,
        page: 'todo',
        group: 'To-do',
        title: t.text,
        detail: excerpt(body, query) ?? (t.done ? 'done' : t.dueDate ? `due ${t.dueDate}` : undefined),
      },
      score(query, t.text, body)
    );
  }

  for (const s of state.schedule) {
    push(
      {
        id: s.id,
        page: 'schedule',
        group: 'Schedule',
        title: s.title,
        detail: [s.date, s.time].filter(Boolean).join(' · '),
      },
      score(query, s.title)
    );
  }

  for (const n of state.notes) {
    const body = strip(n.html);
    push(
      {
        id: n.id,
        noteId: n.id,
        page: 'write',
        group: 'Note',
        title: n.title || body.slice(0, 40) || 'Untitled',
        detail: excerpt(body, query),
      },
      score(query, n.title, body)
    );
  }

  for (const e of state.journalEntries) {
    const shown = format(parseISO(e.date), 'd MMM yyyy');
    push(
      {
        id: e.id,
        page: 'journal',
        group: 'Journal',
        title: shown,
        detail: excerpt(e.text, query) ?? e.text.slice(0, 80),
      },
      // searchable by what the row shows as well as by the stored ISO date
      Math.max(score(query, shown, e.text), score(query, e.date))
    );
  }

  // a sticky can live on any page, so send the hit to the page it is actually on
  const STICKY_PAGE: Record<string, SearchPage> = {
    board: 'notes',
    write: 'write',
    mindmap: 'write',
    schedule: 'schedule',
    todo: 'todo',
    study: 'study',
    journal: 'journal',
  };
  for (const n of state.stickyNotes) {
    push(
      {
        id: n.id,
        // a note on the cover has no page of its own to open
        page: STICKY_PAGE[n.page] ?? 'notes',
        group: 'Sticky',
        title: n.text.slice(0, 60) || '(empty)',
      },
      score(query, n.text)
    );
  }

  for (const n of state.mindMapNodes) {
    push({ id: n.id, page: 'write', group: 'Mind map', title: n.text }, score(query, n.text));
  }

  for (const s of state.subjects) {
    push({ id: s.id, page: 'study', group: 'Subject', title: s.name }, score(query, s.name));
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}
