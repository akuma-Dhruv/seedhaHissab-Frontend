import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import { InstallmentCard } from '@/components/installments/installment-card';
import { InstallmentForm } from '@/components/installments/installment-form';
import { useInstallments, useInstallmentSummary } from '@/hooks/use-installments';
import { apiGet } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { InstallmentDerivedStatus, Project } from '@/lib/types';

const STATUS_OPTIONS: { value: 'ALL' | InstallmentDerivedStatus; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partial' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function formatAmount(val: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export default function ProjectInstallmentsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'ALL' | InstallmentDerivedStatus>('ALL');
  const [formOpen, setFormOpen] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiGet<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });

  const summaryQuery = useInstallmentSummary(projectId);
  const listQuery = useInstallments(projectId, {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: 50,
  });

  const items = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/projects/${projectId}`)}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight truncate">
                Installments
              </h1>
              {project?.name && (
                <p className="text-sm text-muted-foreground mt-0.5">{project.name}</p>
              )}
            </div>
            <Button
              data-testid="button-add-installment"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Installment
            </Button>
          </div>

          {summaryQuery.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : summaryQuery.data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Expected</p>
                  <p className="text-lg font-semibold mt-1" data-testid="text-summary-expected">
                    ₹ {formatAmount(Number(summaryQuery.data.totalExpected))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Received</p>
                  <p
                    className="text-lg font-semibold mt-1 text-emerald-600 dark:text-emerald-400"
                    data-testid="text-summary-received"
                  >
                    ₹ {formatAmount(Number(summaryQuery.data.totalReceived))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Pending</p>
                  <p
                    className="text-lg font-semibold mt-1 text-amber-600 dark:text-amber-400"
                    data-testid="text-summary-pending"
                  >
                    ₹ {formatAmount(Number(summaryQuery.data.totalPending))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Overdue</p>
                  <p
                    className="text-lg font-semibold mt-1 text-rose-600 dark:text-rose-400"
                    data-testid="text-summary-overdue"
                  >
                    ₹ {formatAmount(Number(summaryQuery.data.totalOverdue))}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as 'ALL' | InstallmentDerivedStatus)}
            >
              <SelectTrigger
                className="w-44"
                data-testid="select-status-filter"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={o.value}
                    data-testid={`option-status-${o.value}`}
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : items.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-12"
              data-testid="text-no-installments"
            >
              No installments match this filter.
            </p>
          ) : (
            <div className="space-y-2" data-testid="list-installments">
              {items.map((i) => (
                <InstallmentCard key={i.id} installment={i} />
              ))}
            </div>
          )}
        </div>

        {projectId && (
          <InstallmentForm
            open={formOpen}
            onOpenChange={setFormOpen}
            projectId={projectId}
          />
        )}
      </Layout>
    </AuthGuard>
  );
}
