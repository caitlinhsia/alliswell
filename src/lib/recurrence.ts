import { parseISO } from 'date-fns';
import type { ScheduleItem } from '../types';

/**
 * One appearance of a schedule item on a particular day. Repeating items are
 * stored once, with a rule, and expanded into these only for the days being
 * looked at — so a weekly seminar is one row in the store, not fifty-two.
 */
export interface Occurrence {
  item: ScheduleItem;
  date: string;
  done: boolean;
  /** True when this is one appearance of a series rather than a one-off. */
  repeating: boolean;
}

const dayOfWeek = (iso: string) => parseISO(iso).getDay(); // 0 = Sunday

export function occursOn(item: ScheduleItem, date: string): boolean {
  if (!item.repeat) return item.date === date;
  if (date < item.date) return false;
  if (item.repeatUntil && date > item.repeatUntil) return false;
  if (item.skipDates?.includes(date)) return false;
  if (item.repeat === 'daily') return true;
  if (item.repeat === 'weekly') return dayOfWeek(date) === dayOfWeek(item.date);
  const d = dayOfWeek(date);
  return d >= 1 && d <= 5; // weekdays
}

export function isOccurrenceDone(item: ScheduleItem, date: string): boolean {
  return item.repeat ? !!item.doneDates?.includes(date) : item.done;
}

/** Every appearance of every item across the given days, unsorted. */
export function expandSchedule(items: ScheduleItem[], dates: string[]): Occurrence[] {
  const out: Occurrence[] = [];
  for (const item of items) {
    for (const date of dates) {
      if (!occursOn(item, date)) continue;
      out.push({
        item,
        date,
        done: isOccurrenceDone(item, date),
        repeating: !!item.repeat,
      });
    }
  }
  return out;
}

export const REPEAT_LABEL: Record<NonNullable<ScheduleItem['repeat']>, string> = {
  daily: 'every day',
  weekdays: 'weekdays',
  weekly: 'weekly',
};
