import { cn } from '@/lib/utils';
import type { InstallmentDerivedStatus } from '@/lib/types';

interface InstallmentProgressBarProps {
  expected: number;
  /** Backend-derived; never recompute. */
  received: number;
  status: InstallmentDerivedStatus;
  className?: string;
  testId?: string;
}

/**
 * Pure presentation. Visualises received / expected as a fill bar.
 * Width is clamped to 100% even when over-collected — the textual hint is
 * surfaced separately by {@link InstallmentCard} via the `overCollected`
 * flag from the server.
 */
export function InstallmentProgressBar({
  expected,
  received,
  status,
  className,
  testId,
}: InstallmentProgressBarProps) {
  const ratio = expected > 0 ? Math.min(received / expected, 1) : 0;
  const pct = Math.round(ratio * 100);

  const fillClass =
    status === 'CANCELLED'
      ? 'bg-muted-foreground/40'
      : status === 'OVERDUE'
        ? 'bg-rose-500'
        : status === 'RECEIVED'
          ? 'bg-emerald-500'
          : status === 'PARTIALLY_RECEIVED'
            ? 'bg-amber-500'
            : 'bg-primary/60';

  return (
    <div
      className={cn('h-1.5 w-full rounded-full bg-muted overflow-hidden', className)}
      data-testid={testId}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full transition-all', fillClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
