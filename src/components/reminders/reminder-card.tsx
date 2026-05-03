import { Bell, Check, Clock, Archive, FolderKanban, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineEntry } from '@/components/timeline/timeline-entry';
import { ReminderBadge } from './reminder-badge';
import { DueStatusBadge } from './due-status-badge';
import type { Reminder } from '@/lib/types';

interface ReminderCardProps {
  reminder: Reminder;
  index?: number;
  onComplete?: (r: Reminder) => void;
  onSnooze?: (r: Reminder) => void;
  onArchive?: (r: Reminder) => void;
  /**
   * Hide context-specific link chips (e.g. counterparty chip on the
   * counterparty page where it would be redundant).
   */
  hideCounterpartyChip?: boolean;
  hideProjectChip?: boolean;
  testIdPrefix?: string;
}

/**
 * One reminder rendered as a TimelineEntry — same row geometry as
 * TransactionRow, so reminders + transactions can interleave in any future
 * unified list without bespoke styling.
 */
export function ReminderCard({
  reminder,
  index = 0,
  onComplete,
  onSnooze,
  onArchive,
  hideCounterpartyChip,
  hideProjectChip,
  testIdPrefix = 'reminder',
}: ReminderCardProps) {
  const isImmutable = reminder.status === 'ARCHIVED';
  const isCompleted = reminder.status === 'COMPLETED';

  const iconNode = (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
      isCompleted
        ? 'bg-muted text-muted-foreground'
        : 'bg-primary/10 text-primary'
    }`}>
      <Bell className="w-4 h-4" />
    </div>
  );

  const topRow = (
    <>
      <span className="font-medium text-foreground" data-testid={`text-${testIdPrefix}-title-${reminder.id}`}>
        {reminder.title}
      </span>
      <DueStatusBadge reminder={reminder} />
      {reminder.status !== 'PENDING' && <ReminderBadge status={reminder.status} />}
    </>
  );

  const bottomRow = (
    <>
      {reminder.description && (
        <span className="text-xs text-muted-foreground truncate">
          {reminder.description}
        </span>
      )}
      {!hideCounterpartyChip && reminder.linkedCounterpartyName && (
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <User className="w-3 h-3" />
          {reminder.linkedCounterpartyName}
        </span>
      )}
      {!hideProjectChip && reminder.linkedProjectId && (
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <FolderKanban className="w-3 h-3" />
          Project
        </span>
      )}
    </>
  );

  const actions = (
    <>
      {!isCompleted && !isImmutable && onComplete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
          data-testid={`button-${testIdPrefix}-complete-${reminder.id}`}
          onClick={() => onComplete(reminder)}
          title="Mark as done"
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
      )}
      {!isCompleted && !isImmutable && onSnooze && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          data-testid={`button-${testIdPrefix}-snooze-${reminder.id}`}
          onClick={() => onSnooze(reminder)}
          title="Snooze"
        >
          <Clock className="w-3.5 h-3.5" />
        </Button>
      )}
      {!isImmutable && onArchive && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          data-testid={`button-${testIdPrefix}-archive-${reminder.id}`}
          onClick={() => onArchive(reminder)}
          title="Archive"
        >
          <Archive className="w-3.5 h-3.5" />
        </Button>
      )}
    </>
  );

  return (
    <TimelineEntry
      iconNode={iconNode}
      topRow={topRow}
      bottomRow={bottomRow}
      actions={actions}
      dimmed={isCompleted || isImmutable}
      index={index}
      testId={`row-${testIdPrefix}-${reminder.id}`}
    />
  );
}
