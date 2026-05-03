import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
  PagedResponse,
  Reminder,
  ReminderRequest,
  ReminderSnoozeRequest,
  ReminderStatus,
} from '@/lib/types';

/**
 * Single place that invalidates every reminder-derived query.
 * Mirrors `useInvalidateLedger` from the ledger hook so the two stay
 * conceptually parallel.
 */
export function useInvalidateReminders() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['reminders'] });
    qc.invalidateQueries({ queryKey: ['reminders-today'] });
    qc.invalidateQueries({ queryKey: ['reminders-overdue'] });
    qc.invalidateQueries({ queryKey: ['reminders-upcoming'] });
  };
}

export interface ReminderListParams {
  status?: ReminderStatus;
  includeArchived?: boolean;
  dueAfter?: string;
  dueBefore?: string;
  linkedProjectId?: string;
  linkedCounterpartyName?: string;
  page?: number;
  limit?: number;
}

export function useReminders(params: ReminderListParams = {}) {
  return useQuery({
    queryKey: ['reminders', params],
    queryFn: () => apiGet<PagedResponse<Reminder>>('/reminders', {
      status: params.status,
      includeArchived: params.includeArchived ?? false,
      dueAfter: params.dueAfter,
      dueBefore: params.dueBefore,
      linkedProjectId: params.linkedProjectId,
      linkedCounterpartyName: params.linkedCounterpartyName,
      page: params.page ?? 0,
      limit: params.limit ?? 20,
    }),
  });
}

export function useTodayReminders() {
  return useQuery({
    queryKey: ['reminders-today'],
    queryFn: () => apiGet<Reminder[]>('/reminders/today'),
  });
}

export function useOverdueReminders() {
  return useQuery({
    queryKey: ['reminders-overdue'],
    queryFn: () => apiGet<Reminder[]>('/reminders/overdue'),
  });
}

export function useUpcomingReminders() {
  return useQuery({
    queryKey: ['reminders-upcoming'],
    queryFn: () => apiGet<Reminder[]>('/reminders/upcoming'),
  });
}

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    || fallback;
}

export function useCreateReminder() {
  const { toast } = useToast();
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: (req: ReminderRequest) => apiPost<Reminder>('/reminders', req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Reminder added' });
    },
    onError: (err) => toast({
      title: 'Could not add reminder',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useUpdateReminder() {
  const { toast } = useToast();
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: ReminderRequest }) =>
      apiPut<Reminder>(`/reminders/${id}`, req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Reminder updated' });
    },
    onError: (err) => toast({
      title: 'Could not update reminder',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useCompleteReminder() {
  const { toast } = useToast();
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: (id: string) => apiPatch<Reminder>(`/reminders/${id}/complete`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Marked as done' });
    },
    onError: (err) => toast({
      title: 'Could not update reminder',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useSnoozeReminder() {
  const { toast } = useToast();
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: ReminderSnoozeRequest }) =>
      apiPatch<Reminder>(`/reminders/${id}/snooze`, req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Snoozed' });
    },
    onError: (err) => toast({
      title: 'Could not snooze',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}

export function useArchiveReminder() {
  const { toast } = useToast();
  const invalidate = useInvalidateReminders();
  return useMutation({
    mutationFn: (id: string) => apiPatch<Reminder>(`/reminders/${id}/archive`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Reminder archived' });
    },
    onError: (err) => toast({
      title: 'Could not archive',
      description: errMsg(err, 'Please try again.'),
      variant: 'destructive',
    }),
  });
}
