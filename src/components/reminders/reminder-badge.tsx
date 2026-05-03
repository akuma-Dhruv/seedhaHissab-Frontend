import { Badge } from '@/components/ui/badge';
import { REMINDER_STATUS_LABELS, type ReminderStatus } from '@/lib/types';

const STATUS_VARIANT: Record<ReminderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  SNOOZED: 'secondary',
  COMPLETED: 'default',
  ARCHIVED: 'destructive',
};

interface ReminderBadgeProps {
  status: ReminderStatus;
}

/** Tiny status pill (Pending / Done / Snoozed / Archived). */
export function ReminderBadge({ status }: ReminderBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="text-xs">
      {REMINDER_STATUS_LABELS[status]}
    </Badge>
  );
}
