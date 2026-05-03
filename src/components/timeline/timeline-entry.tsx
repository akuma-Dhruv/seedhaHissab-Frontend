import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface TimelineEntryProps {
  /** Leading icon / avatar slot — usually a small coloured square. */
  iconNode: ReactNode;
  /** Top meta row — usually badges + inline labels. */
  topRow: ReactNode;
  /** Bottom content row — usually amount/date/purpose or description/links. */
  bottomRow: ReactNode;
  /** Trailing action buttons. */
  actions?: ReactNode;
  /** Render the row visually muted (omitted txn, completed/archived reminder). */
  dimmed?: boolean;
  /** Index used for staggered fade-in animation. */
  index?: number;
  /** data-testid for the row container. */
  testId?: string;
  /** Optional extra class names on the container. */
  className?: string;
}

/**
 * The shared visual primitive for ledger-like rows. Used by TransactionRow and
 * ReminderCard so the two render identically and any future "unified
 * timeline" view (e.g. interleaving transactions + reminders by date) can
 * map heterogeneous items into the same component.
 *
 * This is intentionally a layout shell only — it has no opinions about
 * status semantics, colours, or available actions. The consumer drives all
 * of those via slots.
 */
export function TimelineEntry({
  iconNode,
  topRow,
  bottomRow,
  actions,
  dimmed = false,
  index = 0,
  testId,
  className = '',
}: TimelineEntryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div
        className={`rounded-lg border p-4 flex items-center gap-3 ${
          dimmed ? 'opacity-50 bg-muted/30' : 'bg-card'
        } ${className}`}
        data-testid={testId}
      >
        <div className="flex-shrink-0">{iconNode}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">{topRow}</div>
          <div className="flex items-center gap-3 mt-1.5">{bottomRow}</div>
        </div>

        {actions && (
          <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>
        )}
      </div>
    </motion.div>
  );
}
