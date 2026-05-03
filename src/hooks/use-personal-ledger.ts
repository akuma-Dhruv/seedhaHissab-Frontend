import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
  CounterpartySummary,
  PagedResponse,
  Transaction,
} from '@/lib/types';

/** Invalidate every personal-ledger derived view in one place. */
export function useInvalidateLedger() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['personal-transactions'] });
    qc.invalidateQueries({ queryKey: ['personal-summary'] });
    qc.invalidateQueries({ queryKey: ['personal-counterparties'] });
    qc.invalidateQueries({ queryKey: ['personal-counterparty-ledger'] });
    qc.invalidateQueries({ queryKey: ['personal-tx-history'] });
  };
}

/** Loads the full version chain for a given personal transaction id. */
export function usePersonalTxHistory(txId: string | undefined) {
  return useQuery({
    queryKey: ['personal-tx-history', txId],
    queryFn: () => apiGet<Transaction[]>(`/personal/transactions/${txId}/history`),
    enabled: !!txId,
  });
}

/**
 * PATCH /transactions/{id}/omit with shared invalidation + toast.
 * Used by both the dashboard list and the counterparty ledger page.
 */
export function useOmitPersonalTransaction() {
  const { toast } = useToast();
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: (id: string) => apiPatch<Transaction>(`/transactions/${id}/omit`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Transaction omitted' });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to omit transaction';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });
}

/** Lightweight debounce so we don't hammer the counterparty endpoint per keystroke. */
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Fetches the *current* (pre-this-transaction) balance for a counterparty by
 * exact (case-insensitive, trimmed) name match. Returns null while loading or
 * when the name is empty. Returns a zero-balance synthetic summary when the
 * counterparty doesn't exist yet — matching the projected-balance UX in the
 * form for brand-new counterparties.
 */
export function useCounterpartyBalance(name: string): {
  summary: CounterpartySummary | null;
  isLoading: boolean;
} {
  const trimmed = name.trim();
  const debounced = useDebounced(trimmed, 250);
  const enabled = debounced.length > 0;

  const { data, isFetching } = useQuery({
    queryKey: ['personal-counterparties', debounced, 0],
    queryFn: () => apiGet<PagedResponse<CounterpartySummary>>('/personal/counterparties', {
      search: debounced,
      page: 0,
      limit: 50,
    }),
    enabled,
  });

  if (!enabled) return { summary: null, isLoading: false };

  const lc = debounced.toLowerCase();
  const exact = data?.data.find(
    c => c.counterpartyName.trim().toLowerCase() === lc,
  );

  if (exact) return { summary: exact, isLoading: false };

  if (isFetching) return { summary: null, isLoading: true };

  // No existing ledger with this counterparty yet — treat as zero.
  return {
    summary: {
      counterpartyName: trimmed,
      totalGiven: 0,
      totalReceived: 0,
      netBalance: 0,
      direction: 'SETTLED',
    },
    isLoading: false,
  };
}
