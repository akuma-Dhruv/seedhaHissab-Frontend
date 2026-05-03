import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ReceivableBadge } from './receivable-badge';
import { OverdueBadge } from './overdue-badge';
import { InstallmentProgressBar } from './installment-progress-bar';
import type { Installment } from '@/lib/types';

interface InstallmentCardProps {
  installment: Installment;
  /** When false, suppresses the navigation chevron and click handler. */
  navigable?: boolean;
}

function formatAmount(val: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Renders a single installment summary row. All numeric fields and the
 * status badge are produced by the backend — the card never recomputes.
 */
export function InstallmentCard({ installment: i, navigable = true }: InstallmentCardProps) {
  const navigate = useNavigate();
  const onClick = navigable ? () => navigate(`/installments/${i.id}`) : undefined;

  return (
    <Card
      className={navigable ? 'cursor-pointer hover-elevate active-elevate-2' : undefined}
      onClick={onClick}
      data-testid={`card-installment-${i.id}`}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate" data-testid={`text-installment-title-${i.id}`}>
                {i.title}
              </p>
              <ReceivableBadge status={i.status} testId={`badge-status-${i.id}`} />
              {i.status === 'OVERDUE' && (
                <OverdueBadge dueDate={i.dueDate} testId={`badge-overdue-${i.id}`} />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {i.customerName ?? 'Customer'} · Due {formatDate(i.dueDate)}
            </p>
          </div>
          {navigable && (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          )}
        </div>

        <div className="mt-3 space-y-1.5">
          <InstallmentProgressBar
            expected={Number(i.expectedAmount)}
            received={Number(i.receivedAmount)}
            status={i.status}
            testId={`progress-${i.id}`}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              <span data-testid={`text-received-${i.id}`}>₹ {formatAmount(Number(i.receivedAmount))}</span>
              {' '}of{' '}
              <span data-testid={`text-expected-${i.id}`}>₹ {formatAmount(Number(i.expectedAmount))}</span>
            </span>
            {i.status !== 'CANCELLED' && Number(i.remainingAmount) > 0 && (
              <span
                className="font-medium text-foreground"
                data-testid={`text-remaining-${i.id}`}
              >
                ₹ {formatAmount(Number(i.remainingAmount))} pending
              </span>
            )}
            {i.overCollected && (
              <span
                className="font-medium text-amber-600 dark:text-amber-400"
                data-testid={`text-overcollected-${i.id}`}
              >
                Over-collected by ₹ {formatAmount(Number(i.receivedAmount) - Number(i.expectedAmount))}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
