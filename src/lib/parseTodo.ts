import { addDays, format, parse as parseDate, isValid, startOfDay } from 'date-fns';
import type { Priority } from '../types';

export interface ParsedTodo {
  text: string;
  priority?: Priority;
  dueDate?: string; // yyyy-MM-dd
  /** Human-readable labels for what was picked up, for the live preview. */
  matched: string[];
}

const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
  dec: 11, december: 11,
};

const PRIORITY_WORDS: Record<string, Priority> = {
  p1: 'high', p2: 'medium', p3: 'low',
  high: 'high', urgent: 'high', important: 'high',
  med: 'medium', medium: 'medium', normal: 'medium',
  low: 'low', later: 'low', someday: 'low',
};

/**
 * Next occurrence of a weekday. "mon" and "next mon" both mean the coming
 * Monday; "this sat" on a Saturday means today.
 */
function nextWeekday(from: Date, target: number, allowToday = false): Date {
  const cur = from.getDay();
  let delta = (target - cur + 7) % 7;
  if (delta === 0 && !allowToday) delta = 7;
  return addDays(from, delta);
}

/**
 * Pulls priority and due-date hints out of free text so a to-do can be typed in
 * one line: "essay draft p1 mon" -> high priority, due Monday, text "essay draft".
 */
export function parseTodoInput(raw: string, now = new Date()): ParsedTodo {
  const today = startOfDay(now);
  let priority: Priority | undefined;
  let dueDate: string | undefined;
  const matched: string[] = [];
  const consumed = new Set<number>();

  // tokenize while remembering positions so matched tokens can be stripped
  const tokens: { word: string; start: number; end: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) tokens.push({ word: m[0], start: m.index, end: m.index + m[0].length });

  // keep a bare "!"/"!!" intact — it's a priority flag, not punctuation
  const clean = (s: string) =>
    /^!{1,3}$/.test(s) ? s : s.toLowerCase().replace(/[.,;:!?]+$/, '');

  function setDue(d: Date, label: string, idxs: number[]) {
    if (dueDate) return;
    dueDate = format(d, 'yyyy-MM-dd');
    matched.push(label);
    idxs.forEach((i) => consumed.add(i));
  }

  for (let i = 0; i < tokens.length; i++) {
    if (consumed.has(i)) continue;
    const w = clean(tokens[i].word);
    const next = tokens[i + 1] ? clean(tokens[i + 1].word) : '';
    const next2 = tokens[i + 2] ? clean(tokens[i + 2].word) : '';

    // ---- priority ----
    if (!priority) {
      // bare !, !!, !!!
      if (/^!{1,3}$/.test(w)) {
        priority = w.length === 1 ? 'high' : w.length === 2 ? 'medium' : 'low';
        matched.push(`${priority} priority`);
        consumed.add(i);
        continue;
      }
      const pw = PRIORITY_WORDS[w.replace(/^!/, '')];
      // only treat plain words like "high"/"low" as priority when tagged (!high) or pN form
      if (pw && (/^p[123]$/.test(w) || w.startsWith('!'))) {
        priority = pw;
        matched.push(`${pw} priority`);
        consumed.add(i);
        continue;
      }
      if (pw && (w === 'urgent' || w === 'someday')) {
        priority = pw;
        matched.push(`${pw} priority`);
        consumed.add(i);
        continue;
      }
    }

    if (dueDate) continue;

    // ---- relative days ----
    if (w === 'today' || w === 'tod') {
      setDue(today, 'today', [i]);
      continue;
    }
    if (w === 'tomorrow' || w === 'tmr' || w === 'tmrw' || w === 'tom') {
      setDue(addDays(today, 1), 'tomorrow', [i]);
      continue;
    }
    if (w === 'tonight') {
      setDue(today, 'today', [i]);
      continue;
    }

    // "next monday" / "this friday"
    if ((w === 'next' || w === 'this') && WEEKDAYS[next] !== undefined) {
      const d = nextWeekday(today, WEEKDAYS[next], w === 'this');
      setDue(d, format(d, 'EEEE'), [i, i + 1]);
      continue;
    }
    if (w === 'next' && (next === 'week' || next === 'wk')) {
      setDue(addDays(today, 7), 'next week', [i, i + 1]);
      continue;
    }

    // "in 3 days" / "in 2 weeks"
    if (w === 'in' && /^\d+$/.test(next) && /^(day|days|week|weeks|wk|wks)$/.test(next2)) {
      const n = parseInt(next, 10);
      const days = next2.startsWith('w') ? n * 7 : n;
      const d = addDays(today, days);
      setDue(d, `in ${n} ${next2}`, [i, i + 1, i + 2]);
      continue;
    }

    // bare weekday
    if (WEEKDAYS[w] !== undefined) {
      const d = nextWeekday(today, WEEKDAYS[w]);
      setDue(d, format(d, 'EEEE'), [i]);
      continue;
    }

    // "aug 5" / "5 aug"
    if (MONTHS[w] !== undefined && /^\d{1,2}(st|nd|rd|th)?$/.test(next)) {
      const day = parseInt(next, 10);
      const d = new Date(today.getFullYear(), MONTHS[w], day);
      if (isValid(d)) {
        setDue(d < today ? new Date(today.getFullYear() + 1, MONTHS[w], day) : d, format(d, 'MMM d'), [i, i + 1]);
        continue;
      }
    }

    // numeric 8/5 or 8-5 (month/day)
    if (/^\d{1,2}[/-]\d{1,2}$/.test(w)) {
      const [a, b] = w.split(/[/-]/).map((n) => parseInt(n, 10));
      const d = new Date(today.getFullYear(), a - 1, b);
      if (isValid(d) && a >= 1 && a <= 12) {
        setDue(d < today ? new Date(today.getFullYear() + 1, a - 1, b) : d, format(d, 'MMM d'), [i]);
        continue;
      }
    }

    // explicit yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(w)) {
      const d = parseDate(w, 'yyyy-MM-dd', new Date());
      if (isValid(d)) {
        setDue(d, format(d, 'MMM d'), [i]);
        continue;
      }
    }
  }

  const text = tokens
    .filter((_, i) => !consumed.has(i))
    .map((t) => t.word)
    .join(' ')
    .trim();

  return { text: text || raw.trim(), priority, dueDate, matched };
}
