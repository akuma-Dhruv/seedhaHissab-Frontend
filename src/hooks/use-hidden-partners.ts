import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
  HiddenPartnerAgreement,
  HiddenPartnerAgreementRequest,
  HiddenPartnerAgreementUpdateRequest,
  HiddenSettlementResponse,
} from '@/lib/types';

/**
 * Hidden partner queries. Everything here is creator-scoped on the server;
 * the FE just renders what comes back. We never recompute share or settlement
 * math — those are derived from {@code PartnerSettlementService} → hidden
 * agreement on the backend.
 */
function useInvalidateHidden(projectId?: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['hidden-agreements', projectId] });
    qc.invalidateQueries({ queryKey: ['hidden-settlements', projectId] });
    qc.invalidateQueries({ queryKey: ['hidden-agreement'] });
  };
}

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    || fallback;
}

export function useHiddenAgreements(projectId?: string, includeArchived = false) {
  return useQuery({
    queryKey: ['hidden-agreements', projectId, { includeArchived }],
    queryFn: () => apiGet<HiddenPartnerAgreement[]>(
      `/projects/${projectId}/hidden-partners`,
      includeArchived ? { includeArchived: true } : undefined,
    ),
    enabled: !!projectId,
  });
}

export function useHiddenAgreement(id?: string) {
  return useQuery({
    queryKey: ['hidden-agreement', id],
    queryFn: () => apiGet<HiddenPartnerAgreement>(`/hidden-partners/${id}`),
    enabled: !!id,
  });
}

export function useHiddenSettlements(projectId?: string) {
  return useQuery({
    queryKey: ['hidden-settlements', projectId],
    queryFn: () => apiGet<HiddenSettlementResponse>(
      `/projects/${projectId}/hidden-settlements`,
    ),
    enabled: !!projectId,
  });
}

export function useCreateHiddenAgreement(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidateHidden(projectId);
  return useMutation({
    mutationFn: (req: HiddenPartnerAgreementRequest) =>
      apiPost<HiddenPartnerAgreement>(
        `/projects/${projectId}/hidden-partners`, req,
      ),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Private partner added' });
    },
    onError: (err) => toast({
      title: 'Could not add private partner',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useUpdateHiddenAgreement(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidateHidden(projectId);
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: HiddenPartnerAgreementUpdateRequest }) =>
      apiPatch<HiddenPartnerAgreement>(`/hidden-partners/${id}`, req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Private agreement updated' });
    },
    onError: (err) => toast({
      title: 'Could not update agreement',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useArchiveHiddenAgreement(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidateHidden(projectId);
  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<HiddenPartnerAgreement>(`/hidden-partners/${id}/archive`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Agreement archived' });
    },
    onError: (err) => toast({
      title: 'Could not archive',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useRestoreHiddenAgreement(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidateHidden(projectId);
  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<HiddenPartnerAgreement>(`/hidden-partners/${id}/restore`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Agreement restored' });
    },
    onError: (err) => toast({
      title: 'Could not restore',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}
