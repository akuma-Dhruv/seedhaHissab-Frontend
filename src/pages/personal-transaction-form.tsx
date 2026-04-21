import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/lib/api';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import type { Transaction } from '@/lib/types';

type PersonalType = 'EXPENSE' | 'INCOME';

export default function PersonalTransactionFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [type, setType] = useState<PersonalType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));

  const createMutation = useMutation({
    mutationFn: (payload: {
      type: PersonalType;
      amount: number;
      counterpartyName?: string;
      purpose?: string;
      transactionDate: string;
    }) => apiPost<Transaction>('/personal/transactions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['personal-summary'] });
      toast({ title: 'Transaction added' });
      navigate('/personal');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add transaction';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const isValid = amount.trim() !== '' && Number(amount) > 0 && !!transactionDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    createMutation.mutate({
      type,
      amount: Number(amount),
      counterpartyName: counterpartyName.trim() || undefined,
      purpose: purpose.trim() || undefined,
      transactionDate,
    });
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/personal')} data-testid="button-personal-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">Add Personal Transaction</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="personal-type">Type</Label>
                  <Select value={type} onValueChange={v => setType(v as PersonalType)}>
                    <SelectTrigger id="personal-type" data-testid="select-personal-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPENSE" data-testid="option-personal-expense">Expense (I paid)</SelectItem>
                      <SelectItem value="INCOME" data-testid="option-personal-income">Income (I received)</SelectItem>
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
                    {type === 'INCOME' ? 'From (counterparty)' : 'To (counterparty)'}
                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                  </Label>
                  <Input
                    id="personal-counterparty"
                    data-testid="input-personal-counterparty"
                    value={counterpartyName}
                    onChange={e => setCounterpartyName(e.target.value)}
                    placeholder="e.g. Aman Sharma"
                    maxLength={255}
                  />
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
                  disabled={!isValid || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Transaction'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  );
}
