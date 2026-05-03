import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import type { CounterpartySummary, PagedResponse, Transaction } from '@/lib/types';
import { TransactionRow } from '@/components/ledger/transaction-row';
import { HistoryDialog } from '@/components/ledger/history-dialog';
import { OmitConfirmDialog } from '@/components/ledger/omit-confirm-dialog';
import { BalanceHeader } from '@/components/ledger/balance-line';
import { useOmitPersonalTransaction } from '@/hooks/use-personal-ledger';

export default function PersonalCounterpartyLedgerPage() {
  const navigate = useNavigate();
  const { name: encodedName } = useParams<{ name: string }>();
  const counterpartyName = encodedName ? decodeURIComponent(encodedName) : '';

  const [includeOmitted, setIncludeOmitted] = useState(false);
  const [page, setPage] = useState(0);
  const [historyTx, setHistoryTx] = useState<Transaction | null>(null);
  const [omitTarget, setOmitTarget] = useState<Transaction | null>(null);
  const limit = 20;

  // Reuse the paged counterparties endpoint with an exact-name search to fetch the summary header.
  const { data: summaryPage } = useQuery({
    queryKey: ['personal-counterparties', counterpartyName, 0],
    queryFn: () => apiGet<PagedResponse<CounterpartySummary>>('/personal/counterparties', {
      search: counterpartyName,
      page: 0,
      limit: 50,
    }),
    enabled: !!counterpartyName,
  });
  const summary = summaryPage?.data.find(
    c => c.counterpartyName.trim().toLowerCase() === counterpartyName.trim().toLowerCase(),
  );

  const { data, isLoading } = useQuery({
    queryKey: ['personal-counterparty-ledger', counterpartyName, includeOmitted, page],
    queryFn: () => apiGet<PagedResponse<Transaction>>(
      `/personal/counterparties/${encodeURIComponent(counterpartyName)}/ledger`,
      { includeOmitted, page, limit },
    ),
    enabled: !!counterpartyName,
  });

  const omitMutation = useOmitPersonalTransaction();

  const transactions = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/personal/counterparties')}
              data-testid="button-ledger-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl font-semibold tracking-tight truncate"
                data-testid="text-ledger-counterparty"
              >
                {counterpartyName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Person-to-person ledger</p>
            </div>
          </div>

          {summary && (
            <Card>
              <CardContent className="py-5 px-5">
                <BalanceHeader
                  summary={summary}
                  testIds={{
                    net: 'text-ledger-net',
                    given: 'text-ledger-given',
                    received: 'text-ledger-received',
                  }}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="ledger-include-omitted"
                data-testid="switch-ledger-include-omitted"
                checked={includeOmitted}
                onCheckedChange={val => { setIncludeOmitted(val); setPage(0); }}
              />
              <Label htmlFor="ledger-include-omitted" className="text-sm cursor-pointer">
                Show omitted
              </Label>
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
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm mt-1">Add a personal transaction with this counterparty.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {transactions.map((tx, i) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    index={i}
                    mode="counterparty-ledger"
                    testIdPrefix="ledger-tx"
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
                data-testid="button-ledger-prev"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-ledger-next"
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
            testIdPrefix="ledger"
            onCancel={() => setOmitTarget(null)}
            onConfirm={id => omitMutation.mutate(id, { onSuccess: () => setOmitTarget(null) })}
          />
        </div>
      </Layout>
    </AuthGuard>
  );
}
