import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHiddenSettlements } from '@/hooks/use-hidden-partners';

function fmtAmount(n: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

function fmtPct(n: number) {
  return Number(n).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

interface Props { projectId: string; }

/**
 * Renders the derived private settlement view per official partner.
 *
 * Every figure on this surface is computed by {@code HiddenSettlementService}
 * on the backend (which itself reads from {@code PartnerSettlementService}).
 * The frontend never recomputes — this is the same contract used elsewhere
 * for installments and partner settlements.
 */
export function HiddenSettlementView({ projectId }: Props) {
  const { data, isLoading } = useHiddenSettlements(projectId);

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-40" />)}</div>;
  }
  if (!data || data.groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No private redistributions yet. Once you add a private partner above, your
        derived internal settlement will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data.groups.map(g => (
        <Card key={g.officialPartnerId} data-testid={`group-${g.officialPartnerId}`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-medium">{g.officialPartnerName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official slice: <strong>{fmtPct(g.officialSharePercentage)}%</strong>
                  {' · '}Profit share: <strong>₹{fmtAmount(g.officialProfitShare)}</strong>
                </p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">
                  {fmtPct(g.totalHiddenSharePercentage)}% privately promised
                </Badge>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {fmtPct(g.selfRetainedSharePercentage)}% kept for self
                </p>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground text-left">
                    <th className="pb-2 font-medium">Who</th>
                    <th className="pb-2 font-medium text-right">Share of slice</th>
                    <th className="pb-2 font-medium text-right">Effective on project</th>
                    <th className="pb-2 font-medium text-right">Expected profit</th>
                    <th className="pb-2 font-medium text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r, idx) => (
                    <tr
                      key={r.agreementId ?? `self-${g.officialPartnerId}-${idx}`}
                      className={`border-t ${r.selfRetained ? 'bg-muted/40' : ''}`}
                      data-testid={r.selfRetained ? `row-self-${g.officialPartnerId}` : `row-hidden-${r.agreementId}`}
                    >
                      <td className="py-2">
                        <div className="font-medium">{r.hiddenPartnerName}</div>
                        {r.selfRetained && (
                          <div className="text-[11px] text-muted-foreground">
                            What {g.officialPartnerName} keeps
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-right">{fmtPct(r.sharePercentage)}%</td>
                      <td className="py-2 text-right">{fmtPct(r.effectiveProjectShare)}%</td>
                      <td className={`py-2 text-right ${r.expectedProfit < 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                        ₹{fmtAmount(r.expectedProfit)}
                      </td>
                      <td className={`py-2 text-right font-medium ${r.pendingSettlement < 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                        ₹{fmtAmount(r.pendingSettlement)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Withdrawals and private settlements aren't tracked yet —
              "Pending" equals "Expected profit" for now.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
