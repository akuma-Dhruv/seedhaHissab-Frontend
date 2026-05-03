import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
  Installment,
  InstallmentDerivedStatus,
  InstallmentRequest,
  InstallmentSummaryResponse,
  PagedResponse,
} from '@/lib/types';

/**
 * Single place that invalidates every installment-derived query. Also nudges
 * the project-summary and transactions caches because installments and
 * INCOME transactions are tightly coupled (a new payment changes both).
 */
export function useInvalidateInstallments(projectId?: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['installments'] });
    qc.invalidateQueries({ queryKey: ['installment'] });
    qc.invalidateQueries({ queryKey: ['installment-summary'] });
    if (projectId) {
      qc.invalidateQueries({ queryKey: ['transactions', projectId] });
      qc.invalidateQueries({ queryKey: ['project-summary', projectId] });
    }
  };
}

export interface InstallmentListParams {
  status?: InstallmentDerivedStatus;
  overdueOnly?: boolean;
  customerId?: string;
  page?: number;
  limit?: number;
}

export function useInstallments(projectId?: string, params: InstallmentListParams = {}) {
  return useQuery({
    queryKey: ['installments', projectId, params],
    queryFn: () => apiGet<PagedResponse<Installment>>(
      `/projects/${projectId}/installments`,
      {
        status: params.status,
        overdueOnly: params.overdueOnly ?? false,
        customerId: params.customerId,
        page: params.page ?? 0,
        limit: params.limit ?? 20,
      }),
    enabled: !!projectId,
  });
}

export function useInstallmentSummary(projectId?: string) {
  return useQuery({
    queryKey: ['installment-summary', projectId],
    queryFn: () => apiGet<InstallmentSummaryResponse>(`/projects/${projectId}/installments/summary`),
    enabled: !!projectId,
  });
}

export function useInstallment(installmentId?: string) {
  return useQuery({
    queryKey: ['installment', installmentId],
    queryFn: () => apiGet<Installment>(`/installments/${installmentId}`),
    enabled: !!installmentId,
  });
}

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    || fallback;
}

export function useCreateInstallment(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidateInstallments(projectId);
  return useMutation({
    mutationFn: (req: InstallmentRequest) =>
      apiPost<Installment>(`/projects/${projectId}/installments`, req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Installment added' });
    },
    onError: (err) => toast({
      title: 'Could not add installment',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useUpdateInstallment(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidateInstallments(projectId);
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: InstallmentRequest }) =>
      apiPut<Installment>(`/installments/${id}`, req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Installment updated' });
    },
    onError: (err) => toast({
      title: 'Could not update installment',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useCancelInstallment(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidateInstallments(projectId);
  return useMutation({
    mutationFn: (id: string) => apiPatch<Installment>(`/installments/${id}/cancel`),
    onSuccess: () => {
      invalidate();
      toast({
        title: 'Installment cancelled',
        description: 'Already-received money stays in your ledger.',
      });
    },
    onError: (err) => toast({
      title: 'Could not cancel installment',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useReopenInstallment(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidateInstallments(projectId);
  return useMutation({
    mutationFn: (id: string) => apiPatch<Installment>(`/installments/${id}/reopen`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Installment re-opened' });
    },
    onError: (err) => toast({
      title: 'Could not re-open installment',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}
