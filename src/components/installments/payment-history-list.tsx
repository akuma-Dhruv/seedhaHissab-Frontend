import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/types';

interface PaymentHistoryListProps {
  payments: Transaction[];
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
 * Renders the linked-payment history for a single installment. Each row is
 * a latest-version, ACTIVE INCOME transaction surfaced by the backend; the
 * frontend just lists them.
 */
export function PaymentHistoryList({ payments }: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return (
      <p
        className="text-sm text-muted-foreground text-center py-6"
        data-testid="text-no-payments"
      >
        No payments received yet.
      </p>
    );
  }
  return (
    <div className="space-y-2" data-testid="list-payments">
      {payments.map((p) => (
        <Card key={p.id} data-testid={`row-payment-${p.id}`}>
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" data-testid={`text-payment-amount-${p.id}`}>
                ₹ {formatAmount(p.amount)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(p.transactionDate)}
                {p.purpose ? ` · ${p.purpose}` : ''}
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              Income
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
