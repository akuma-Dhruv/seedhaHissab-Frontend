import type { Reminder } from './types';

/**
 * Reminder presentation helpers.
 *
 * "Today" is computed in {@code Asia/Kolkata} (decision B). The server
 * uses the same zone, so client + server agree on bucketing.
 */
const APP_TIMEZONE = 'Asia/Kolkata';

/** Returns YYYY-MM-DD for "today" in Asia/Kolkata. */
export function todayInAppZone(): string {
  // en-CA gives ISO YYYY-MM-DD ordering directly.
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

/** Difference in whole days between two YYYY-MM-DD strings (b - a). */
export function diffDays(a: string, b: string): number {
  const ad = new Date(`${a}T00:00:00Z`).getTime();
  const bd = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((bd - ad) / 86_400_000);
}

export type DueBucket = 'OVERDUE' | 'TODAY' | 'TOMORROW' | 'UPCOMING' | 'FUTURE' | 'PAST';

/**
 * Bucket a reminder relative to today. Pure date math — does not consider
 * status, since callers usually combine status + due bucket separately.
 */
export function dueBucketFor(reminder: Reminder, today = todayInAppZone()): DueBucket {
  const delta = diffDays(today, reminder.dueDate);
  if (delta < 0) return reminder.status === 'COMPLETED' ? 'PAST' : 'OVERDUE';
  if (delta === 0) return 'TODAY';
  if (delta === 1) return 'TOMORROW';
  if (delta <= 7) return 'UPCOMING';
  return 'FUTURE';
}

/** Human label for the due date relative to today. */
export function dueLabel(reminder: Reminder, today = todayInAppZone()): string {
  const delta = diffDays(today, reminder.dueDate);
  if (delta < 0) {
    const abs = Math.abs(delta);
    return abs === 1 ? 'Overdue 1 day' : `Overdue ${abs} days`;
  }
  if (delta === 0) return 'Due today';
  if (delta === 1) return 'Due tomorrow';
  if (delta <= 7) return `In ${delta} days`;
  return formatLongDate(reminder.dueDate);
}

/** Friendly date — "12 Apr 2026". */
export function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
