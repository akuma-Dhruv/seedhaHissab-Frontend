import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { todayInAppZone } from '@/lib/reminder-format';
import { useCreateReminder } from '@/hooks/use-reminders';
import type { Reminder, ReminderRequest } from '@/lib/types';

interface ReminderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fills + locks the linked counterparty (used inside a counterparty page). */
  lockCounterpartyName?: string;
  /** Pre-fills + locks the linked project (used inside a project dashboard). */
  lockProjectId?: string;
  /** Pre-fills + locks the linked transaction (used near a tx context). */
  lockTransactionId?: string;
  onCreated?: (r: Reminder) => void;
}

/**
 * Modal form for adding a reminder. The lock-* props let consumers anchor
 * the new reminder to a specific context (counterparty/project/transaction)
 * without exposing those fields in the dialog UI.
 */
export function ReminderForm({
  open,
  onOpenChange,
  lockCounterpartyName,
  lockProjectId,
  lockTransactionId,
  onCreated,
}: ReminderFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(todayInAppZone());
  const [counterpartyName, setCounterpartyName] = useState('');

  const createMutation = useCreateReminder();

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setDueDate(todayInAppZone());
      setCounterpartyName(lockCounterpartyName ?? '');
    }
  }, [open, lockCounterpartyName]);

  const isPending = createMutation.isPending;
  const canSubmit = title.trim().length > 0 && dueDate && !isPending;

  const submit = () => {
    const req: ReminderRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      linkedTransactionId: lockTransactionId,
      linkedProjectId: lockProjectId,
      linkedCounterpartyName: (lockCounterpartyName ?? counterpartyName).trim() || undefined,
    };
    createMutation.mutate(req, {
      onSuccess: (r) => {
        onCreated?.(r);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-reminder-form">
        <DialogHeader>
          <DialogTitle>New reminder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="reminder-title">Title</Label>
            <Input
              id="reminder-title"
              data-testid="input-reminder-title"
              value={title}
              autoFocus
              placeholder="Follow up with Aman"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reminder-due">Due date</Label>
            <Input
              id="reminder-due"
              type="date"
              data-testid="input-reminder-due"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {!lockCounterpartyName && !lockProjectId && !lockTransactionId && (
            <div className="space-y-1.5">
              <Label htmlFor="reminder-cp">Counterparty (optional)</Label>
              <Input
                id="reminder-cp"
                data-testid="input-reminder-counterparty"
                value={counterpartyName}
                placeholder="Aman"
                onChange={(e) => setCounterpartyName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reminder-desc">Note (optional)</Label>
            <Textarea
              id="reminder-desc"
              data-testid="input-reminder-description"
              value={description}
              placeholder="Collect remaining ₹5,000"
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            data-testid="button-reminder-cancel"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            data-testid="button-reminder-submit"
            disabled={!canSubmit}
            onClick={submit}
          >
            {isPending ? 'Saving…' : 'Save reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
