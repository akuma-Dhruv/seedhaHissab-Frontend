import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import {
  COUNTERPARTY_REQUIRED_TYPES,
  PERSONAL_TYPE_OPTIONS,
  counterpartyHelperText,
  type PersonalTransactionType,
  type Transaction,
} from '@/lib/types';

interface FormPayload {
  type: PersonalTransactionType;
  amount: number;
  counterpartyName?: string;
  purpose?: string;
  transactionDate: string;
}

export default function PersonalTransactionFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id: editingId } = useParams<{ id: string }>();
  const isEdit = Boolean(editingId);

  const [type, setType] = useState<PersonalTransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));

  // When editing, prefill from the latest version of the transaction's history.
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['personal-tx-history', editingId],
    queryFn: () => apiGet<Transaction[]>(`/personal/transactions/${editingId}/history`),
    enabled: isEdit,
  });

  const latest = useMemo(() => {
    if (!history?.length) return null;
    return [...history].sort((a, b) => b.version - a.version)[0];
  }, [history]);

  useEffect(() => {
    if (!latest) return;
    setType(latest.type as PersonalTransactionType);
    setAmount(String(latest.amount));
    setCounterpartyName(latest.counterpartyName ?? '');
    setPurpose(latest.purpose ?? '');
    setTransactionDate(latest.transactionDate);
  }, [latest]);

  const mutation = useMutation({
    mutationFn: (payload: FormPayload) =>
      isEdit
        ? apiPut<Transaction>(`/personal/transactions/${editingId}`, payload)
        : apiPost<Transaction>('/personal/transactions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['personal-summary'] });
      queryClient.invalidateQueries({ queryKey: ['personal-counterparties'] });
      queryClient.invalidateQueries({ queryKey: ['personal-counterparty-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['personal-tx-history'] });
      toast({ title: isEdit ? 'Transaction updated' : 'Transaction added' });
      navigate(-1);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || `Failed to ${isEdit ? 'update' : 'add'} transaction`;
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const counterpartyRequired = COUNTERPARTY_REQUIRED_TYPES.includes(type);
  const trimmedCp = counterpartyName.trim();
  const helper = counterpartyHelperText(type, counterpartyName);

  const isValid =
    amount.trim() !== '' &&
    Number(amount) > 0 &&
    !!transactionDate &&
    (!counterpartyRequired || trimmedCp.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    mutation.mutate({
      type,
      amount: Number(amount),
      counterpartyName: trimmedCp || undefined,
      purpose: purpose.trim() || undefined,
      transactionDate,
    });
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="button-personal-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEdit ? 'Edit Personal Transaction' : 'Add Personal Transaction'}
            </h1>
          </div>

          {isEdit && historyLoading ? (
            <Card>
              <CardContent className="pt-6 space-y-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10" />)}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="personal-type">Type</Label>
                    <Select value={type} onValueChange={v => setType(v as PersonalTransactionType)}>
                      <SelectTrigger id="personal-type" data-testid="select-personal-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERSONAL_TYPE_OPTIONS.map(opt => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            data-testid={`option-personal-${opt.value.toLowerCase()}`}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="personal-amount">Amount</Label>
                    <Input
                      id="personal-amount"
                      data-testid="input-personal-amount"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="personal-counterparty">
                      {type === 'INCOME' || type === 'BORROW' || type === 'REPAYMENT_RECEIVED'
                        ? 'From (counterparty)'
                        : 'To (counterparty)'}
                      <span className="text-muted-foreground font-normal ml-1">
                        {counterpartyRequired ? '(required)' : '(optional)'}
                      </span>
                    </Label>
                    <Input
                      id="personal-counterparty"
                      data-testid="input-personal-counterparty"
                      value={counterpartyName}
                      onChange={e => setCounterpartyName(e.target.value)}
                      placeholder="e.g. Aman Sharma"
                      maxLength={255}
                    />
                    {helper && (
                      <p className="text-xs text-muted-foreground" data-testid="text-personal-helper">{helper}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="personal-date">Date</Label>
                    <Input
                      id="personal-date"
                      data-testid="input-personal-date"
                      type="date"
                      value={transactionDate}
                      onChange={e => setTransactionDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="personal-purpose">
                      Purpose
                      <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                    </Label>
                    <Textarea
                      id="personal-purpose"
                      data-testid="input-personal-purpose"
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      placeholder="What was this for?"
                      rows={3}
                      maxLength={1024}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    data-testid="button-personal-save"
                    disabled={!isValid || mutation.isPending}
                  >
                    {mutation.isPending
                      ? (isEdit ? 'Saving...' : 'Adding...')
                      : (isEdit ? 'Save Changes' : 'Save Transaction')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
