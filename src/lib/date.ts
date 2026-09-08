import { format } from 'date-fns';

export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}
