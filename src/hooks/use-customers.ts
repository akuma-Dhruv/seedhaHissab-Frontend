import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Customer, CustomerRequest } from '@/lib/types';

/**
 * Invalidates every customer-derived query. Mirrors the reminders hook.
 */
export function useInvalidateCustomers() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['customers'] });
    qc.invalidateQueries({ queryKey: ['project-customers'] });
  };
}

/** Global per-user customer list. Optional `search` does a case-insensitive name contains. */
export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ['customers', search ?? null],
    queryFn: () => apiGet<Customer[]>('/customers', search ? { search } : undefined),
  });
}

/** Customers attached to a specific project. */
export function useProjectCustomers(projectId?: string) {
  return useQuery({
    queryKey: ['project-customers', projectId],
    queryFn: () => apiGet<Customer[]>(`/projects/${projectId}/customers`),
    enabled: !!projectId,
  });
}

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    || fallback;
}

export function useCreateCustomer() {
  const { toast } = useToast();
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (req: CustomerRequest) => apiPost<Customer>('/customers', req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Customer added' });
    },
    onError: (err) => toast({
      title: 'Could not add customer',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useUpdateCustomer() {
  const { toast } = useToast();
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: CustomerRequest }) =>
      apiPut<Customer>(`/customers/${id}`, req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Customer updated' });
    },
    onError: (err) => toast({
      title: 'Could not update customer',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useDeleteCustomer() {
  const { toast } = useToast();
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/customers/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Customer deleted' });
    },
    onError: (err) => toast({
      title: 'Could not delete customer',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useAttachCustomerToProject() {
  const { toast } = useToast();
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: ({ projectId, customerId }: { projectId: string; customerId: string }) =>
      apiPost<Customer>(`/projects/${projectId}/customers/${customerId}`),
    onSuccess: () => {
      invalidate();
    },
    onError: (err) => toast({
      title: 'Could not link customer',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}
