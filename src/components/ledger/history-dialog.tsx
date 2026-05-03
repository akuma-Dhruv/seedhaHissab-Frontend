import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TRANSACTION_TYPE_LABELS, type Transaction } from '@/lib/types';
import { formatAmount, formatDate } from '@/lib/ledger-format';
import { usePersonalTxHistory } from '@/hooks/use-personal-ledger';

interface HistoryDialogProps {
  tx: Transaction | null;
  onClose: () => void;
}

export function HistoryDialog({ tx, onClose }: HistoryDialogProps) {
  const { data: history, isLoading } = usePersonalTxHistory(tx?.id);

  return (
    <Dialog open={!!tx} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(() => {
              const sorted = [...history].sort((a, b) => b.version - a.version);
              const maxVersion = sorted[0]?.version ?? 0;
              return sorted.map(ver => (
                <div
                  key={ver.id}
                  className={`rounded-md border p-3 text-sm ${
                    ver.version === maxVersion ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {ver.version}</span>
                      {ver.version === maxVersion && (
                        <Badge className="text-xs">Latest</Badge>
                      )}
                    </div>
                    <Badge
                      variant={ver.status === 'OMITTED' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {ver.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground space-y-0.5">
                    <p>{TRANSACTION_TYPE_LABELS[ver.type]} — ₹{formatAmount(ver.amount)}</p>
                    <p>
                      {formatDate(ver.transactionDate)}
                      {ver.purpose ? ` — ${ver.purpose}` : ''}
                    </p>
                    {ver.counterpartyName && (
                      <p>Counterparty: {ver.counterpartyName}</p>
                    )}
                    <p className="text-xs">{new Date(ver.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No history available</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
