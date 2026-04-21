import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { apiGet } from '@/lib/api';
import type { PartnerSettlementResponse } from '@/lib/types';

interface Props {
  projectId: string;
}

function formatAmount(val: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

export function PartnerSettlementTable({ projectId }: Props) {
  const { data: settlements, isLoading } = useQuery({
    queryKey: ['partner-settlement', projectId],
    queryFn: () => apiGet<PartnerSettlementResponse[]>(`/projects/${projectId}/settlement`),
    enabled: !!projectId,
  });

  if (isLoading) {
    return <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-28" />)}</div>;
  }

  if (!settlements || settlements.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No partners yet. Add partners to see settlement details.</p>;
  }

  return (
    <div className="space-y-3">
      {settlements.map(s => (
        <div key={s.partnerId} className="rounded-lg border bg-card p-4" data-testid={`row-settlement-${s.partnerId}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-medium" data-testid={`text-settlement-partner-${s.partnerId}`}>{s.partnerName}</span>
              <span className="text-xs text-muted-foreground ml-2">{s.sharePercentage}% share</span>
            </div>
            <Badge
              variant={s.settlementGap > 0 ? 'destructive' : s.settlementGap < 0 ? 'secondary' : 'outline'}
              data-testid={`badge-settlement-gap-${s.partnerId}`}
            >
              {s.settlementGap > 0 ? 'Owes Money' : s.settlementGap < 0 ? 'Paid Extra' : 'Settled'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Expected Contribution</p>
              <p className="font-medium mt-0.5" data-testid={`text-expected-${s.partnerId}`}>{formatAmount(s.expectedContribution)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Actual Paid</p>
              <p className="font-medium mt-0.5" data-testid={`text-actual-paid-${s.partnerId}`}>{formatAmount(s.actualPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Settlement Gap</p>
              <p
                className={`font-medium mt-0.5 ${s.settlementGap > 0 ? 'text-rose-600 dark:text-rose-400' : s.settlementGap < 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
                data-testid={`text-settlement-gap-${s.partnerId}`}
              >
                {formatAmount(s.settlementGap)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profit Share</p>
              <p className="font-medium mt-0.5 text-emerald-600 dark:text-emerald-400" data-testid={`text-profit-share-${s.partnerId}`}>{formatAmount(s.partnerProfitShare)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-sm mt-3">
            <div>
              <p className="text-xs text-muted-foreground">Withdrawn</p>
              <p className="font-medium mt-0.5" data-testid={`text-withdrawn-${s.partnerId}`}>{formatAmount(s.withdrawn)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Profit Due</p>
              <p
                className={`font-semibold mt-0.5 ${s.netProfitDue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                data-testid={`text-net-due-${s.partnerId}`}
              >
                {formatAmount(s.netProfitDue)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
