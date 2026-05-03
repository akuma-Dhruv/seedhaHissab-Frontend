import { Badge } from '@/components/ui/badge';
import type { InstallmentDerivedStatus } from '@/lib/types';

interface ReceivableBadgeProps {
  status: InstallmentDerivedStatus;
  testId?: string;
}

const LABELS: Record<InstallmentDerivedStatus, string> = {
  PENDING: 'Pending',
  PARTIALLY_RECEIVED: 'Partial',
  RECEIVED: 'Received',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

/**
 * Renders the backend-derived installment status. The colour mapping is the
 * single visual source of truth across the app — keep in sync with
 * {@link InstallmentProgressBar}.
 */
export function ReceivableBadge({ status, testId }: ReceivableBadgeProps) {
  const label = LABELS[status];
  switch (status) {
    case 'RECEIVED':
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          data-testid={testId}
        >
          {label}
        </Badge>
      );
    case 'PARTIALLY_RECEIVED':
      return (
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          data-testid={testId}
        >
          {label}
        </Badge>
      );
    case 'OVERDUE':
      return (
        <Badge
          variant="outline"
          className="border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          data-testid={testId}
        >
          {label}
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="secondary" data-testid={testId}>
          {label}
        </Badge>
      );
    case 'PENDING':
    default:
      return (
        <Badge variant="outline" data-testid={testId}>
          {label}
        </Badge>
      );
  }
}
