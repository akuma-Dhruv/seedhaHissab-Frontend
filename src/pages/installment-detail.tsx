import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import { ReceivableBadge } from '@/components/installments/receivable-badge';
import { OverdueBadge } from '@/components/installments/overdue-badge';
import { InstallmentProgressBar } from '@/components/installments/installment-progress-bar';
import { PaymentHistoryList } from '@/components/installments/payment-history-list';
import { InstallmentForm } from '@/components/installments/installment-form';
import {
  useCancelInstallment,
  useInstallment,
  useReopenInstallment,
} from '@/hooks/use-installments';

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

export default function InstallmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: i, isLoading } = useInstallment(id);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const cancelMutation = useCancelInstallment(i?.projectId);
  const reopenMutation = useReopenInstallment(i?.projectId);

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-back"
              onClick={() => i ? navigate(`/projects/${i.projectId}/installments`) : navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold flex-1">Installment</h1>
            {i && i.status !== 'CANCELLED' && (
              <Button
                variant="outline"
                size="sm"
                data-testid="button-edit"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
            )}
          </div>

          {isLoading || !i ? (
            <div className="space-y-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <>
              <Card>
                <CardContent className="pt-4 pb-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-lg font-semibold"
                        data-testid="text-detail-title"
                      >
                        {i.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {i.customerName ?? 'Customer'} · Due {formatDate(i.dueDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ReceivableBadge status={i.status} testId="badge-detail-status" />
                      {i.status === 'OVERDUE' && (
                        <OverdueBadge dueDate={i.dueDate} testId="badge-detail-overdue" />
                      )}
                    </div>
                  </div>

                  {i.description && (
                    <p className="text-sm text-muted-foreground">
                      {i.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                        Expected
                      </p>
                      <p className="text-base font-semibold mt-0.5" data-testid="text-detail-expected">
                        ₹ {formatAmount(Number(i.expectedAmount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                        Received
                      </p>
                      <p
                        className="text-base font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400"
                        data-testid="text-detail-received"
                      >
                        ₹ {formatAmount(Number(i.receivedAmount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                        {i.overCollected ? 'Over' : 'Remaining'}
                      </p>
                      <p
                        className={
                          i.overCollected
                            ? 'text-base font-semibold mt-0.5 text-amber-600 dark:text-amber-400'
                            : 'text-base font-semibold mt-0.5'
                        }
                        data-testid="text-detail-remaining"
                      >
                        ₹{' '}
                        {formatAmount(
                          i.overCollected
                            ? Number(i.receivedAmount) - Number(i.expectedAmount)
                            : Number(i.remainingAmount),
                        )}
                      </p>
                    </div>
                  </div>

                  <InstallmentProgressBar
                    expected={Number(i.expectedAmount)}
                    received={Number(i.receivedAmount)}
                    status={i.status}
                    testId="progress-detail"
                  />

                  <div className="flex flex-wrap gap-2 pt-1">
                    {i.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid="button-record-payment"
                        onClick={() =>
                          navigate(
                            `/projects/${i.projectId}/transactions/new?linkedInstallmentId=${i.id}`,
                          )
                        }
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Record payment
                      </Button>
                    )}
                    {i.status === 'CANCELLED' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid="button-reopen"
                        disabled={reopenMutation.isPending}
                        onClick={() => reopenMutation.mutate(i.id)}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Re-open
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950"
                        data-testid="button-cancel-installment"
                        onClick={() => setConfirmCancelOpen(true)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h2 className="font-medium text-sm">Payment history</h2>
                <PaymentHistoryList payments={i.linkedPayments ?? []} />
              </div>

              <InstallmentForm
                open={editOpen}
                onOpenChange={setEditOpen}
                projectId={i.projectId}
                editing={i}
              />

              <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this installment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Money already received stays in your ledger as income.
                      Only the unpaid expected amount drops out of receivables.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-confirm-cancel-no">
                      Keep
                    </AlertDialogCancel>
                    <AlertDialogAction
                      data-testid="button-confirm-cancel-yes"
                      onClick={() => {
                        cancelMutation.mutate(i.id, {
                          onSuccess: () => setConfirmCancelOpen(false),
                        });
                      }}
                    >
                      Cancel installment
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
