import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api';
import type { Transaction, PagedResponse } from '@/lib/types';
import { TransactionRow } from '@/components/ledger/transaction-row';
import { HistoryDialog } from '@/components/ledger/history-dialog';
import { OmitConfirmDialog } from '@/components/ledger/omit-confirm-dialog';
import { useOmitPersonalTransaction } from '@/hooks/use-personal-ledger';

export function PersonalTransactionList() {
  const navigate = useNavigate();

  const [includeOmitted, setIncludeOmitted] = useState(false);
  const [page, setPage] = useState(0);
  const [historyTx, setHistoryTx] = useState<Transaction | null>(null);
  const [omitTarget, setOmitTarget] = useState<Transaction | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['personal-transactions', includeOmitted, page],
    queryFn: () => apiGet<PagedResponse<Transaction>>('/personal/transactions', {
      includeOmitted,
      page,
      limit,
    }),
  });

  const omitMutation = useOmitPersonalTransaction();

  const transactions = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="personal-include-omitted"
            data-testid="switch-personal-include-omitted"
            checked={includeOmitted}
            onCheckedChange={val => { setIncludeOmitted(val); setPage(0); }}
          />
          <Label htmlFor="personal-include-omitted" className="text-sm cursor-pointer">Show omitted</Label>
        </div>
        {data && (
          <p className="text-xs text-muted-foreground">
            {data.total} transaction{data.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium">No personal transactions yet</p>
          <p className="text-sm mt-1">Add your first one using the button above</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {transactions.map((tx, i) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                index={i}
                mode="personal-list"
                testIdPrefix="personal-tx"
                onHistory={setHistoryTx}
                onEdit={t => navigate(`/personal/transactions/${t.id}/edit`)}
                onOmit={setOmitTarget}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            data-testid="button-personal-prev-page"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            data-testid="button-personal-next-page"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      <HistoryDialog tx={historyTx} onClose={() => setHistoryTx(null)} />

      <OmitConfirmDialog
        target={omitTarget}
        testIdPrefix="personal"
        onCancel={() => setOmitTarget(null)}
        onConfirm={id => omitMutation.mutate(id, { onSuccess: () => setOmitTarget(null) })}
      />
    </div>
  );
}
