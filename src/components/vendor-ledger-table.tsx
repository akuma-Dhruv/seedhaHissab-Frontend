import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { apiGet } from '@/lib/api';
import type { VendorLedgerResponse } from '@/lib/types';

interface Props {
  projectId: string;
}

function formatAmount(val: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

export function VendorLedgerTable({ projectId }: Props) {
  const { data: ledgers, isLoading } = useQuery({
    queryKey: ['vendor-ledgers', projectId],
    queryFn: () => apiGet<VendorLedgerResponse[]>(`/projects/${projectId}/vendors/ledger`),
    enabled: !!projectId,
  });

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>;
  }

  if (!ledgers || ledgers.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No vendors yet. Add a vendor to start tracking credit.</p>;
  }

  return (
    <div className="space-y-2">
      {ledgers.map(l => (
        <div key={l.vendorId} className="rounded-lg border bg-card p-4" data-testid={`row-vendor-${l.vendorId}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium" data-testid={`text-vendor-name-${l.vendorId}`}>{l.vendorName}</span>
            <Badge
              variant={l.balance > 0 ? 'destructive' : 'secondary'}
              data-testid={`badge-vendor-balance-${l.vendorId}`}
            >
              {l.balance > 0 ? 'Outstanding' : 'Clear'}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Credit Taken</p>
              <p className="font-medium mt-0.5" data-testid={`text-vendor-supply-${l.vendorId}`}>{formatAmount(l.totalSupply)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="font-medium mt-0.5" data-testid={`text-vendor-paid-${l.vendorId}`}>{formatAmount(l.totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance Due</p>
              <p
                className={`font-semibold mt-0.5 ${l.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                data-testid={`text-vendor-balance-${l.vendorId}`}
              >
                {formatAmount(l.balance)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
