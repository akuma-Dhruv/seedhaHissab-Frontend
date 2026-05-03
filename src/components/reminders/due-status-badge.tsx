import { Badge } from '@/components/ui/badge';
import { dueBucketFor, dueLabel, type DueBucket } from '@/lib/reminder-format';
import type { Reminder } from '@/lib/types';

const BUCKET_CLASS: Record<DueBucket, string> = {
  OVERDUE:  'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10',
  TODAY:    'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10',
  TOMORROW: 'border-sky-500/40 text-sky-700 dark:text-sky-400 bg-sky-500/10',
  UPCOMING: 'border-sky-500/30 text-sky-700 dark:text-sky-400 bg-sky-500/5',
  FUTURE:   'border-border text-muted-foreground bg-muted/30',
  PAST:     'border-border text-muted-foreground bg-muted/30',
};

interface DueStatusBadgeProps {
  reminder: Reminder;
}

/**
 * Date-driven badge — "Due today", "Overdue 3 days", "In 5 days", "12 Apr 2026".
 * Independent from {@link ReminderBadge}, which surfaces the lifecycle status.
 */
export function DueStatusBadge({ reminder }: DueStatusBadgeProps) {
  const bucket = dueBucketFor(reminder);
  return (
    <Badge variant="outline" className={`text-xs ${BUCKET_CLASS[bucket]}`}>
      {dueLabel(reminder)}
    </Badge>
  );
}
