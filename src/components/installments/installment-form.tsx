import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCustomers, useCreateCustomer } from '@/hooks/use-customers';
import { useCreateInstallment, useUpdateInstallment } from '@/hooks/use-installments';
import type { Installment, InstallmentRequest } from '@/lib/types';

interface InstallmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** When set, the dialog edits this installment instead of creating a new one. */
  editing?: Installment | null;
}

/**
 * Modal form for adding or editing an installment. Shows all owned
 * customers (global per user); a "+ Add new" inline option lets the user
 * create one without leaving the dialog.
 */
export function InstallmentForm({
  open,
  onOpenChange,
  projectId,
  editing,
}: InstallmentFormProps) {
  const isEdit = !!editing;
  const [customerId, setCustomerId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expected, setExpected] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const customersQuery = useCustomers();
  const createCustomer = useCreateCustomer();
  const createInstallment = useCreateInstallment(projectId);
  const updateInstallment = useUpdateInstallment(projectId);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCustomerId(editing.customerId);
      setTitle(editing.title);
      setDescription(editing.description ?? '');
      setExpected(String(editing.expectedAmount));
      setDueDate(editing.dueDate);
    } else {
      setCustomerId('');
      setTitle('');
      setDescription('');
      setExpected('');
      setDueDate(new Date().toISOString().slice(0, 10));
    }
    setShowNewCustomer(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
  }, [open, editing]);

  const isPending = createInstallment.isPending || updateInstallment.isPending;
  const expectedNum = Number(expected);
  const canSubmit =
    !!customerId &&
    title.trim().length > 0 &&
    !!dueDate &&
    !isNaN(expectedNum) &&
    expectedNum > 0 &&
    !isPending;

  const submit = () => {
    const req: InstallmentRequest = {
      customerId,
      title: title.trim(),
      description: description.trim() || undefined,
      expectedAmount: expectedNum,
      dueDate,
    };
    if (isEdit && editing) {
      updateInstallment.mutate(
        { id: editing.id, req },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createInstallment.mutate(req, { onSuccess: () => onOpenChange(false) });
    }
  };

  const submitNewCustomer = () => {
    const name = newCustomerName.trim();
    if (!name) return;
    createCustomer.mutate(
      { name, phone: newCustomerPhone.trim() || undefined },
      {
        onSuccess: (c) => {
          setCustomerId(c.id);
          setShowNewCustomer(false);
          setNewCustomerName('');
          setNewCustomerPhone('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-installment-form">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit installment' : 'New installment'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <div className="flex gap-2">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger data-testid="select-customer" className="flex-1">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {(customersQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id} data-testid={`option-customer-${c.id}`}>
                      {c.name}
                    </SelectItem>
                  ))}
                  {(customersQuery.data ?? []).length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No customers yet.
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                data-testid="button-new-customer"
                onClick={() => setShowNewCustomer((v) => !v)}
              >
                {showNewCustomer ? 'Close' : '+ New'}
              </Button>
            </div>
          </div>

          {showNewCustomer && (
            <div className="rounded-md border p-3 space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-customer-name">Customer name</Label>
                <Input
                  id="new-customer-name"
                  data-testid="input-new-customer-name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-customer-phone">Phone (optional)</Label>
                <Input
                  id="new-customer-phone"
                  data-testid="input-new-customer-phone"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                />
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!newCustomerName.trim() || createCustomer.isPending}
                onClick={submitNewCustomer}
                data-testid="button-save-new-customer"
              >
                {createCustomer.isPending ? 'Saving…' : 'Save customer'}
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ins-title">Title</Label>
            <Input
              id="ins-title"
              data-testid="input-installment-title"
              value={title}
              placeholder="Milestone 1 — Foundation"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ins-amount">Expected amount</Label>
              <Input
                id="ins-amount"
                type="number"
                min="0.01"
                step="0.01"
                data-testid="input-installment-expected"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ins-due">Due date</Label>
              <Input
                id="ins-due"
                type="date"
                data-testid="input-installment-due"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ins-desc">Notes (optional)</Label>
            <Textarea
              id="ins-desc"
              data-testid="input-installment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Anything to remember about this installment"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            data-testid="button-installment-cancel"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            data-testid="button-installment-submit"
            disabled={!canSubmit}
            onClick={submit}
          >
            {isPending ? 'Saving…' : isEdit ? 'Update' : 'Save installment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
