import { AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface TimelineListProps {
  /** Pre-rendered timeline entries (typically TransactionRow / ReminderCard). */
  children: ReactNode;
  /** Empty-state node when there are no entries. */
  empty?: ReactNode;
  /** True when no entries should render — pass alongside `empty`. */
  isEmpty?: boolean;
}

/**
 * Animated wrapper around a list of TimelineEntry-shaped children. Pure
 * layout — the consumer is responsible for adapter logic and grouping.
 */
export function TimelineList({ children, empty, isEmpty }: TimelineListProps) {
  if (isEmpty) {
    return <>{empty ?? null}</>;
  }
  return (
    <div className="space-y-2">
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  );
}
