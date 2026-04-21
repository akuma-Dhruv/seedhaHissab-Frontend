import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import type { Partner, Vendor, Transaction, TransactionType } from '@/lib/types';
import { TRANSACTION_TYPE_LABELS } from '@/lib/types';

const schema = z.object({
  type: z.enum(['EXPENSE', 'INCOME', 'VENDOR_SUPPLY', 'VENDOR_PAYMENT', 'PARTNER_SETTLEMENT', 'PROFIT_WITHDRAWAL']),
  amount: z.string().min(1, 'Amount is required').refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  transactionDate: z.string().min(1, 'Date is required'),
  purpose: z.string().optional(),
  vendorId: z.string().optional(),
  partnerId: z.string().optional(),
  paidByPartnerId: z.string().optional(),
}).superRefine((data, ctx) => {
  if ((data.type === 'VENDOR_SUPPLY' || data.type === 'VENDOR_PAYMENT') && !data.vendorId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vendor is required for this transaction type', path: ['vendorId'] });
  }
  if ((data.type === 'PARTNER_SETTLEMENT' || data.type === 'PROFIT_WITHDRAWAL') && !data.partnerId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Partner is required for this transaction type', path: ['partnerId'] });
  }
  if (data.type === 'EXPENSE' && !data.paidByPartnerId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Paid-by partner is required for expenses', path: ['paidByPartnerId'] });
  }
});

type FormData = z.infer<typeof schema>;

export default function TransactionFormPage() {
  const { projectId, txId } = useParams<{ projectId: string; txId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!txId;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'EXPENSE',
      amount: '',
      transactionDate: new Date().toISOString().slice(0, 10),
      purpose: '',
      vendorId: '',
      partnerId: '',
      paidByPartnerId: '',
    },
  });

  const selectedType = form.watch('type') as TransactionType;

  const { data: partners } = useQuery({
    queryKey: ['partners', projectId],
    queryFn: () => apiGet<Partner[]>(`/projects/${projectId}/partners`),
    enabled: !!projectId,
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors', projectId],
    queryFn: () => apiGet<Vendor[]>(`/projects/${projectId}/vendors`),
    enabled: !!projectId,
  });

  const { data: existingTx, isLoading: txLoading } = useQuery({
    queryKey: ['tx-latest', txId],
    queryFn: async () => {
      const versions = await apiGet<Transaction[]>(`/transactions/${txId}/history`);
      const active = versions.filter((v) => v.status === 'ACTIVE');
      const pool = active.length > 0 ? active : versions;
      return pool.reduce((latest, v) => (v.version > latest.version ? v : latest), pool[0]);
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingTx) {
      form.reset({
        type: existingTx.type,
        amount: String(existingTx.amount),
        transactionDate: existingTx.transactionDate,
        purpose: existingTx.purpose ?? '',
        vendorId: existingTx.vendorId ?? '',
        partnerId: existingTx.partnerId ?? '',
        paidByPartnerId: existingTx.paidByPartnerId ?? '',
      });
    }
  }, [existingTx, form]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit
        ? apiPut<Transaction>(`/transactions/${txId}`, data)
        : apiPost<Transaction>('/transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-summary', projectId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-ledgers', projectId] });
      queryClient.invalidateQueries({ queryKey: ['partner-settlement', projectId] });
      toast({ title: isEdit ? 'Transaction updated' : 'Transaction added' });
      navigate(`/projects/${projectId}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save transaction';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const onSubmit = (data: FormData) => {
    const payload: Record<string, unknown> = {
      type: data.type,
      amount: Number(data.amount),
      transactionDate: data.transactionDate,
      projectId,
    };
    if (data.purpose?.trim()) payload.purpose = data.purpose.trim();

    if (data.type === 'EXPENSE') {
      if (data.paidByPartnerId) payload.paidByPartnerId = data.paidByPartnerId;
    }
    if (data.type === 'VENDOR_SUPPLY' || data.type === 'VENDOR_PAYMENT') {
      if (data.vendorId) payload.vendorId = data.vendorId;
    }
    if (data.type === 'PARTNER_SETTLEMENT' || data.type === 'PROFIT_WITHDRAWAL') {
      if (data.partnerId) payload.partnerId = data.partnerId;
    }

    mutation.mutate(payload);
  };

  const needsVendor = selectedType === 'VENDOR_SUPPLY' || selectedType === 'VENDOR_PAYMENT';
  const needsPartner = selectedType === 'PARTNER_SETTLEMENT' || selectedType === 'PROFIT_WITHDRAWAL';
  const needsPaidBy = selectedType === 'EXPENSE';

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/projects/${projectId}`)}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold">
              {isEdit ? 'Edit Transaction' : 'Add Transaction'}
            </h1>
          </div>

          {isEdit && txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-5">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Transaction Type</Label>
                    <Select
                      value={form.watch('type')}
                      onValueChange={val => form.setValue('type', val as TransactionType)}
                    >
                      <SelectTrigger data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value} data-testid={`option-type-${value}`}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        data-testid="input-amount"
                        {...form.register('amount')}
                      />
                      {form.formState.errors.amount && (
                        <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        data-testid="input-date"
                        {...form.register('transactionDate')}
                      />
                      {form.formState.errors.transactionDate && (
                        <p className="text-xs text-destructive">{form.formState.errors.transactionDate.message}</p>
                      )}
                    </div>
                  </div>

                  {needsPaidBy && (
                    <div className="space-y-1.5">
                      <Label>Paid By (Partner)</Label>
                      <Select
                        value={form.watch('paidByPartnerId')}
                        onValueChange={val => { form.setValue('paidByPartnerId', val); form.trigger('paidByPartnerId'); }}
                      >
                        <SelectTrigger data-testid="select-paid-by-partner">
                          <SelectValue placeholder="Select partner" />
                        </SelectTrigger>
                        <SelectContent>
                          {partners?.map(p => (
                            <SelectItem key={p.id} value={p.id} data-testid={`option-partner-${p.id}`}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.paidByPartnerId && (
                        <p className="text-xs text-destructive">{form.formState.errors.paidByPartnerId.message}</p>
                      )}
                    </div>
                  )}

                  {needsVendor && (
                    <div className="space-y-1.5">
                      <Label>Vendor</Label>
                      <Select
                        value={form.watch('vendorId')}
                        onValueChange={val => { form.setValue('vendorId', val); form.trigger('vendorId'); }}
                      >
                        <SelectTrigger data-testid="select-vendor">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors?.map(v => (
                            <SelectItem key={v.id} value={v.id} data-testid={`option-vendor-${v.id}`}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.vendorId && (
                        <p className="text-xs text-destructive">{form.formState.errors.vendorId.message}</p>
                      )}
                    </div>
                  )}

                  {needsPartner && (
                    <div className="space-y-1.5">
                      <Label>Partner</Label>
                      <Select
                        value={form.watch('partnerId')}
                        onValueChange={val => { form.setValue('partnerId', val); form.trigger('partnerId'); }}
                      >
                        <SelectTrigger data-testid="select-partner">
                          <SelectValue placeholder="Select partner" />
                        </SelectTrigger>
                        <SelectContent>
                          {partners?.map(p => (
                            <SelectItem key={p.id} value={p.id} data-testid={`option-partner-${p.id}`}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.partnerId && (
                        <p className="text-xs text-destructive">{form.formState.errors.partnerId.message}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="purpose">Purpose / Description</Label>
                    <Textarea
                      id="purpose"
                      rows={2}
                      data-testid="input-purpose"
                      placeholder="e.g. Steel rods purchase"
                      {...form.register('purpose')}
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/projects/${projectId}`)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      data-testid="button-submit"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? 'Saving...' : isEdit ? 'Update Transaction' : 'Add Transaction'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
