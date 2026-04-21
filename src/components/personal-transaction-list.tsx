import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, Ban, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPatch } from '@/lib/api';
import type { Transaction, PagedResponse } from '@/lib/types';
import { TRANSACTION_TYPE_LABELS } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

function formatAmount(val: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PersonalTransactionList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['personal-tx-history', historyTx?.rootTransactionId],
    queryFn: () => apiGet<Transaction[]>(`/personal/transactions/${historyTx!.id}/history`),
    enabled: !!historyTx,
  });

  const omitMutation = useMutation({
    mutationFn: (id: string) => apiPatch<Transaction>(`/transactions/${id}/omit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['personal-summary'] });
      toast({ title: 'Transaction omitted' });
      setOmitTarget(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to omit transaction';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

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
          <p className="text-xs text-muted-foreground">{data.total} transaction{data.total !== 1 ? 's' : ''}</p>
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
            {transactions.map((tx, i) => {
              const isIncome = tx.type === 'INCOME';
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div
                    className={`rounded-lg border p-4 flex items-center gap-3 ${
                      tx.status === 'OMITTED' ? 'opacity-50 bg-muted/30' : 'bg-card'
                    }`}
                    data-testid={`row-personal-tx-${tx.id}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome
                        ? <ArrowDownRight className="w-4 h-4" />
                        : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs" data-testid={`badge-personal-tx-type-${tx.id}`}>
                          {TRANSACTION_TYPE_LABELS[tx.type]}
                        </Badge>
                        {tx.counterpartyName && (
                          <span className="text-xs text-muted-foreground" data-testid={`text-personal-tx-counterparty-${tx.id}`}>
                            {isIncome ? 'from' : 'to'} <span className="font-medium text-foreground">{tx.counterpartyName}</span>
                          </span>
                        )}
                        {tx.status === 'OMITTED' && (
                          <Badge variant="destructive" className="text-xs">Omitted</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span
                          className={`font-semibold ${tx.status === 'OMITTED' ? 'line-through' : ''} ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                          data-testid={`text-personal-tx-amount-${tx.id}`}
                        >
                          {isIncome ? '+' : '−'} {formatAmount(tx.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground" data-testid={`text-personal-tx-date-${tx.id}`}>
                          {formatDate(tx.transactionDate)}
                        </span>
                        {tx.purpose && (
                          <span className="text-xs text-muted-foreground truncate">{tx.purpose}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        data-testid={`button-personal-tx-history-${tx.id}`}
                        onClick={() => setHistoryTx(tx)}
                        title="View history"
                      >
                        <History className="w-3.5 h-3.5" />
                      </Button>
                      {tx.status === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          data-testid={`button-personal-tx-omit-${tx.id}`}
                          onClick={() => setOmitTarget(tx)}
                          title="Omit transaction"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
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

      <Dialog open={!!historyTx} onOpenChange={open => !open && setHistoryTx(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
          </DialogHeader>
          {historyLoading ? (
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
                    className={`rounded-md border p-3 text-sm ${ver.version === maxVersion ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Version {ver.version}</span>
                        {ver.version === maxVersion && (
                          <Badge className="text-xs">Latest</Badge>
                        )}
                      </div>
                      <Badge variant={ver.status === 'OMITTED' ? 'destructive' : 'secondary'} className="text-xs">
                        {ver.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground space-y-0.5">
                      <p>{TRANSACTION_TYPE_LABELS[ver.type]} — {formatAmount(ver.amount)}</p>
                      <p>{formatDate(ver.transactionDate)}{ver.purpose ? ` — ${ver.purpose}` : ''}</p>
                      {ver.counterpartyName && <p>Counterparty: {ver.counterpartyName}</p>}
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

      <AlertDialog open={!!omitTarget} onOpenChange={open => !open && setOmitTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Omit transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This transaction will be marked as omitted and excluded from your totals. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-personal-omit-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-personal-omit-confirm"
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => omitTarget && omitMutation.mutate(omitTarget.id)}
            >
              Omit transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
